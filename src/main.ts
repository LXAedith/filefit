import "./styles.css";
import { REPO_URL } from "./config";
import { getLang, locale, plural, setLang, t, type Key } from "./i18n";
import { icon, type IconName } from "./icons";
import { errorKey, type ErrorKey } from "./lib/errors";
import { formatBytes, kindOf, uniqueNames, type FileKind } from "./lib/format";
import { canEncodeWebp } from "./lib/image";
import type { MetaSummary } from "./tools/clean";
import type { ConvertOptions } from "./tools/convert";
import type { FitOptions } from "./tools/fit";
import type { PdfOptions } from "./tools/pdf";
import type { Note, ToolOutput } from "./tools/types";

type ToolId = "fit" | "convert" | "pdf" | "clean";
type Status = "queued" | "working" | "done" | "error";

interface Item {
  id: number;
  file: File;
  kind: FileKind;
  status: Status;
  thumbUrl?: string;
  output?: ToolOutput;
  outputUrl?: string;
  error?: ErrorKey;
  meta?: MetaSummary | "loading";
}

interface Options {
  fit: FitOptions;
  convert: ConvertOptions;
  pdf: PdfOptions;
}

const TOOLS: { id: ToolId; icon: IconName; run: Key }[] = [
  { id: "fit", icon: "fit", run: "run_fit" },
  { id: "convert", icon: "convert", run: "run_convert" },
  { id: "pdf", icon: "pdf", run: "run_pdf" },
  { id: "clean", icon: "clean", run: "run_clean" },
];
const IMAGE_KINDS: FileKind[] = ["jpeg", "png", "webp", "heic", "gif", "avif", "bmp"];
const PREVIEWABLE: FileKind[] = ["jpeg", "png", "webp", "gif", "avif", "bmp"];
const TARGET_PRESETS = [50, 100, 200, 500, 1000, 2000];
const SIDE_PRESETS = [0, 4000, 3000, 2000, 1600, 1280, 1024, 800, 600];
const OPTIONS_KEY = "filefit:options";
const TOOL_KEY = "filefit:tool";

const DEFAULT_OPTIONS: Options = {
  fit: { targetKB: 200, mime: "image/jpeg", maxSide: 0 },
  convert: { mime: "image/jpeg", quality: 90, maxSide: 0 },
  pdf: { pageSize: "a4", margins: true, quality: "medium" },
};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const els = {
  tools: $("tools"),
  options: $("options"),
  drop: $("drop"),
  input: $<HTMLInputElement>("file-input"),
  formats: $("drop-formats"),
  pdfResult: $("pdf-result"),
  actions: $("actions"),
  items: $("items"),
  lang: $<HTMLButtonElement>("lang"),
  install: $<HTMLButtonElement>("install"),
};

const state = {
  tool: loadTool(),
  queues: { fit: [], convert: [], pdf: [], clean: [] } as Record<ToolId, Item[]>,
  options: loadOptions(),
  pdfOutput: undefined as { output: ToolOutput; url: string } | undefined,
  busy: false,
  done: 0,
  webp: true,
};
let nextId = 1;

// ---------- persistence ----------

function loadOptions(): Options {
  try {
    const saved = JSON.parse(localStorage.getItem(OPTIONS_KEY) ?? "{}");
    return {
      fit: { ...DEFAULT_OPTIONS.fit, ...saved.fit },
      convert: { ...DEFAULT_OPTIONS.convert, ...saved.convert },
      pdf: { ...DEFAULT_OPTIONS.pdf, ...saved.pdf },
    };
  } catch {
    return structuredClone(DEFAULT_OPTIONS);
  }
}

function saveOptions(): void {
  try {
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(state.options));
  } catch {
    // not fatal
  }
}

function loadTool(): ToolId {
  try {
    const saved = localStorage.getItem(TOOL_KEY);
    if (TOOLS.some((tool) => tool.id === saved)) return saved as ToolId;
  } catch {
    // not fatal
  }
  return "fit";
}

// ---------- helpers ----------

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const size = (bytes: number) => formatBytes(bytes, locale());
const noteText = (note: Note) => t(note.key, note.params);
const queue = () => state.queues[state.tool];

function accepts(kind: FileKind, tool = state.tool): boolean {
  return IMAGE_KINDS.includes(kind) || (tool === "pdf" && kind === "pdf");
}

function revoke(item: Item): void {
  if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
  if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
}

function setOutput(item: Item, output: ToolOutput): void {
  if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
  item.output = output;
  item.outputUrl = URL.createObjectURL(output.blob);
  item.status = "done";
  item.error = undefined;
}

function clearPdfOutput(): void {
  if (state.pdfOutput) URL.revokeObjectURL(state.pdfOutput.url);
  state.pdfOutput = undefined;
}

// ---------- rendering ----------

function renderStatic(): void {
  document.documentElement.lang = getLang();
  document.title = t("app_title");
  for (const el of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const text = escapeHtml(t(el.dataset.i18n as Key));
    el.innerHTML = el.dataset.icon ? `${icon(el.dataset.icon as IconName)}<span>${text}</span>` : text;
  }
  for (const el of document.querySelectorAll<HTMLElement>("[data-icon]:not([data-i18n])")) {
    el.innerHTML = icon(el.dataset.icon as IconName, "icon icon-lg");
  }
  els.lang.innerHTML = `${icon("globe")}<span>${t("lang_name")}</span>`;
  els.install.innerHTML = `${icon("install")}<span>${t("install")}</span>`;
  for (const id of ["repo", "repo-footer"]) $<HTMLAnchorElement>(id).href = REPO_URL;
}

function renderTools(): void {
  els.tools.innerHTML = TOOLS.map(
    ({ id, icon: name }) => `
      <button class="tool" role="tab" id="tab-${id}" data-tool="${id}" aria-selected="${id === state.tool}"
        aria-controls="workspace" tabindex="${id === state.tool ? 0 : -1}">
        ${icon(name, "icon tool-icon")}
        <span class="tool-title">${t(`tool_${id}`)}</span>
        <span class="tool-desc">${t(`tool_${id}_desc`)}</span>
        ${state.queues[id].length ? `<span class="tool-count">${state.queues[id].length}</span>` : ""}
      </button>`,
  ).join("");
  $("workspace").setAttribute("aria-labelledby", `tab-${state.tool}`);
}

function select(opt: string, value: string | number, choices: [string | number, string][]): string {
  return `<select data-opt="${opt}">${choices
    .map(([v, label]) => `<option value="${v}" ${String(v) === String(value) ? "selected" : ""}>${escapeHtml(label)}</option>`)
    .join("")}</select>`;
}

function sideChoices(): [number, string][] {
  return SIDE_PRESETS.map((px) => [px, px ? `${px} px` : t("opt_original")]);
}

function renderOptions(): void {
  const { fit, convert, pdf } = state.options;
  let html = "";
  if (state.tool === "fit") {
    const chips = TARGET_PRESETS.map(
      (kb) =>
        `<button type="button" class="chip" data-opt="targetKB" data-value="${kb}" aria-pressed="${kb === fit.targetKB}">${
          kb >= 1000 ? `${kb / 1000} MB` : `${kb} KB`
        }</button>`,
    ).join("");
    html = `
      <div class="field field-wide">
        <span class="label">${t("opt_target")}</span>
        <div class="chips">${chips}
          <label class="chip chip-input"><span class="sr-only">${t("opt_custom")}</span>
            <input type="number" min="5" max="100000" step="1" inputmode="numeric" data-opt="targetKB" value="${fit.targetKB}" /> KB
          </label>
        </div>
        <p class="hint">${t("hint_target")}</p>
      </div>
      <label class="field"><span class="label">${t("opt_format")}</span>
        ${select("mime", fit.mime, [["image/jpeg", "JPG"], ["image/webp", "WebP"]])}</label>
      <label class="field"><span class="label">${t("opt_max_side")}</span>
        ${select("maxSide", fit.maxSide, sideChoices())}</label>
      ${fit.mime === "image/webp" && !state.webp ? `<p class="hint field-wide">${t("hint_webp")}</p>` : ""}`;
  } else if (state.tool === "convert") {
    html = `
      <label class="field"><span class="label">${t("opt_format")}</span>
        ${select("mime", convert.mime, [["image/jpeg", "JPG"], ["image/png", "PNG"], ["image/webp", "WebP"]])}</label>
      ${
        convert.mime === "image/png"
          ? ""
          : `<label class="field"><span class="label">${t("opt_quality")} <output id="quality-out">${convert.quality}%</output></span>
              <input type="range" min="40" max="100" step="1" data-opt="quality" value="${convert.quality}" /></label>`
      }
      <label class="field"><span class="label">${t("opt_max_side")}</span>
        ${select("maxSide", convert.maxSide, sideChoices())}</label>
      ${convert.mime === "image/webp" && !state.webp ? `<p class="hint field-wide">${t("hint_webp")}</p>` : ""}`;
  } else if (state.tool === "pdf") {
    html = `
      <label class="field"><span class="label">${t("opt_page_size")}</span>
        ${select("pageSize", pdf.pageSize, [["a4", "A4"], ["letter", "Letter"], ["fit", t("opt_page_fit")]])}</label>
      <label class="field"><span class="label">${t("opt_image_quality")}</span>
        ${select("quality", pdf.quality, [["high", t("q_high")], ["medium", t("q_medium")], ["small", t("q_small")]])}</label>
      <label class="field field-check"><input type="checkbox" data-opt="margins" ${pdf.margins ? "checked" : ""} />
        <span>${t("opt_margins")}</span></label>
      <p class="hint field-wide">${t("hint_pdf")}</p>`;
  } else {
    html = `<p class="hint field-wide">${icon("check")} ${t("hint_clean")}</p>`;
  }
  els.options.innerHTML = html;

  els.input.accept = state.tool === "pdf" ? "application/pdf,image/*,.heic,.heif" : "image/*,.heic,.heif";
  els.formats.textContent =
    state.tool === "pdf" ? "PDF · JPG · PNG · HEIC · WebP · AVIF" : "JPG · PNG · HEIC · WebP · AVIF · GIF · BMP";
}

function renderMeta(item: Item): string {
  if (state.tool !== "clean" || !item.meta) return "";
  if (item.meta === "loading") return `<div class="meta muted">${t("meta_scanning")}</div>`;
  const meta = item.meta;
  if (!meta.fields) return `<div class="meta muted">${icon("check")} ${t("meta_none")}</div>`;
  if (item.status === "done") return `<div class="meta meta-done">${icon("check")} ${t("meta_removed", { n: meta.fields })}</div>`;

  const rows: [string, string | undefined][] = [
    [t("meta_camera"), meta.camera],
    [t("meta_date"), meta.date?.toLocaleString(locale(), { dateStyle: "medium", timeStyle: "short" })],
    [t("meta_software"), meta.software],
    [t("meta_author"), meta.author],
    ...meta.other,
  ];
  const gps = meta.gps
    ? `<div class="meta-warn">${icon("pin")}<span><strong>${t("meta_gps_warning")}</strong>
         ${meta.gps.lat.toFixed(5)}, ${meta.gps.lon.toFixed(5)} ·
         <a href="https://www.openstreetmap.org/?mlat=${meta.gps.lat}&mlon=${meta.gps.lon}#map=16/${meta.gps.lat}/${meta.gps.lon}"
           target="_blank" rel="noopener noreferrer">${t("meta_map")}</a></span></div>`
    : "";
  const list = rows
    .filter(([, value]) => value)
    .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value!)}</dd>`)
    .join("");
  return `<div class="meta">${gps}${list ? `<dl>${list}</dl>` : ""}
    <div class="muted">${t("meta_fields", { n: meta.fields })}</div></div>`;
}

function renderItem(item: Item, index: number, total: number): string {
  const ext = item.file.name.split(".").pop()?.slice(0, 4).toUpperCase() ?? "";
  const previewUrl = item.output && item.output.blob.type.startsWith("image/") ? item.outputUrl : item.thumbUrl;
  const thumb = previewUrl
    ? `<img src="${previewUrl}" alt="" loading="lazy" decoding="async" />`
    : `<span class="thumb-ext">${escapeHtml(item.kind === "pdf" ? "PDF" : ext)}</span>`;

  let sizes = `<span>${size(item.file.size)}</span>`;
  let detail = "";
  if (item.status === "done" && item.output && state.tool !== "pdf") {
    const before = item.file.size;
    const after = item.output.blob.size;
    const change = Math.round(((after - before) / before) * 100);
    sizes += ` <span class="arrow">→</span> <strong>${size(after)}</strong>`;
    if (change !== 0) sizes += ` <span class="change ${change < 0 ? "good" : ""}">${change > 0 ? "+" : "−"}${Math.abs(change)}%</span>`;
    detail = item.output.notes.map(noteText).join(" · ");
  } else if (item.status === "error") {
    detail = `<span class="error">${icon("alert")} ${t(`err_${item.error ?? "generic"}`)}</span>`;
  } else if (item.status === "working") {
    detail = `<span class="spinner" aria-hidden="true"></span> ${t("status_working")}`;
  }

  const reorder =
    state.tool === "pdf"
      ? `<button class="icon-btn" data-action="up" ${index === 0 ? "disabled" : ""} aria-label="${t("move_up")}" title="${t("move_up")}">${icon("up")}</button>
         <button class="icon-btn" data-action="down" ${index === total - 1 ? "disabled" : ""} aria-label="${t("move_down")}" title="${t("move_down")}">${icon("down")}</button>`
      : "";
  const download =
    item.status === "done" && item.outputUrl && state.tool !== "pdf"
      ? `<a class="btn btn-small" href="${item.outputUrl}" download="${escapeHtml(item.output!.name)}">${icon("download")}<span>${t("download")}</span></a>`
      : "";

  return `
    <li class="item is-${item.status}" data-id="${item.id}">
      <div class="thumb">${state.tool === "pdf" ? `<span class="order">${index + 1}</span>` : ""}${thumb}</div>
      <div class="info">
        <div class="name" title="${escapeHtml(item.file.name)}">${escapeHtml(item.output?.name ?? item.file.name)}</div>
        <div class="sizes">${sizes}</div>
        ${detail ? `<div class="detail">${detail}</div>` : ""}
        ${renderMeta(item)}
      </div>
      <div class="item-actions">
        ${reorder}${download}
        <button class="icon-btn" data-action="remove" ${state.busy ? "disabled" : ""} aria-label="${t("remove")}" title="${t("remove")}">${icon("x")}</button>
      </div>
    </li>`;
}

function renderItems(): void {
  const items = queue();
  els.items.innerHTML = items.map((item, i) => renderItem(item, i, items.length)).join("");
}

function renderActions(): void {
  const items = queue();
  const runnable = items.filter((item) => accepts(item.kind));
  const tool = TOOLS.find((entry) => entry.id === state.tool)!;
  const done = items.filter((item) => item.status === "done" && item.output);

  if (!items.length) {
    els.actions.innerHTML = "";
  } else {
    const label = state.busy
      ? t("working", { done: state.done, total: runnable.length })
      : `${t(tool.run)} · ${plural(runnable.length, "file_one", "file_other")}`;
    let summary = "";
    if ((state.tool === "fit" || state.tool === "convert") && done.length && !state.busy) {
      const before = done.reduce((sum, item) => sum + item.file.size, 0);
      const after = done.reduce((sum, item) => sum + item.output!.blob.size, 0);
      if (after < before * 0.99) {
        summary = `<span class="summary">${t("summary_saved", {
          size: size(before - after),
          pct: Math.round((1 - after / before) * 100),
        })}</span>`;
      }
    }
    els.actions.innerHTML = `
      <button class="btn btn-primary" data-action="run" ${state.busy || !runnable.length ? "disabled" : ""}>
        ${state.busy ? '<span class="spinner" aria-hidden="true"></span>' : icon(tool.icon)}<span>${label}</span></button>
      ${
        state.tool !== "pdf" && done.length > 1
          ? `<button class="btn" data-action="zip" ${state.busy ? "disabled" : ""}>${icon("download")}<span>${t("download_all")}</span></button>`
          : ""
      }
      <button class="btn btn-quiet" data-action="clear" ${state.busy ? "disabled" : ""}>${icon("x")}<span>${t("clear")}</span></button>
      ${summary}`;
  }

  const pdf = state.tool === "pdf" ? state.pdfOutput : undefined;
  els.pdfResult.hidden = !pdf;
  els.pdfResult.innerHTML = pdf
    ? `${icon("check", "icon icon-lg")}
       <div><strong>${t("pdf_ready")}</strong><div class="muted">${pdf.output.notes.map(noteText).join(" · ")} · ${size(pdf.output.blob.size)}</div></div>
       <a class="btn btn-primary" href="${pdf.url}" download="${escapeHtml(pdf.output.name)}">${icon("download")}<span>${t("download")}</span></a>`
    : "";
}

function renderAll(): void {
  renderStatic();
  renderTools();
  renderOptions();
  renderItems();
  renderActions();
}

function refresh(): void {
  renderTools();
  renderItems();
  renderActions();
}

// ---------- adding files ----------

async function addFiles(files: Iterable<File>): Promise<void> {
  if (state.busy) return;
  const tool = state.tool;
  const added: Item[] = [];
  for (const file of files) {
    const kind = await kindOf(file);
    const item: Item = { id: nextId++, file, kind, status: "queued" };
    if (PREVIEWABLE.includes(kind)) item.thumbUrl = URL.createObjectURL(file);
    if (!accepts(kind, tool)) {
      item.status = "error";
      item.error = "unsupported";
    }
    added.push(item);
  }
  if (!added.length) return;
  if (tool === "pdf") clearPdfOutput();
  state.queues[tool].push(...added);
  refresh();

  if (tool === "clean") {
    const { readMetadata } = await import("./tools/clean");
    for (const item of added.filter((entry) => entry.status !== "error")) {
      item.meta = "loading";
      if (state.tool === "clean") renderItems();
      item.meta = await readMetadata(item.file);
      if (state.tool === "clean") renderItems();
    }
  }
}

// ---------- running tools ----------

async function run(): Promise<void> {
  if (state.busy) return;
  const tool = state.tool;
  const items = state.queues[tool].filter((item) => accepts(item.kind));
  if (!items.length) return;

  state.busy = true;
  state.done = 0;
  for (const item of items) item.status = "queued";
  refresh();

  try {
    if (tool === "pdf") {
      clearPdfOutput();
      const { buildPdf } = await import("./tools/pdf");
      items.forEach((item) => (item.status = "working"));
      renderItems();
      try {
        const output = await buildPdf(
          items.map((item) => item.file),
          state.options.pdf,
          (done) => {
            state.done = done;
            items.slice(0, done).forEach((item) => (item.status = "done"));
            if (state.tool === "pdf") refresh();
          },
        );
        state.pdfOutput = { output, url: URL.createObjectURL(output.blob) };
      } catch (error) {
        const failed = items.find((item) => item.status === "working");
        if (failed) {
          failed.status = "error";
          failed.error = errorKey(error);
        }
        items.filter((item) => item.status === "working").forEach((item) => (item.status = "queued"));
      }
    } else {
      const process = await loadProcessor(tool);
      for (const item of items) {
        item.status = "working";
        if (state.tool === tool) refresh();
        try {
          setOutput(item, await process(item.file));
        } catch (error) {
          console.error(error);
          item.status = "error";
          item.error = errorKey(error);
        }
        state.done++;
      }
    }
  } finally {
    state.busy = false;
    if (state.tool === tool) refresh();
  }
}

async function loadProcessor(tool: Exclude<ToolId, "pdf">): Promise<(file: File) => Promise<ToolOutput>> {
  if (tool === "fit") {
    const { fitToSize } = await import("./tools/fit");
    const options = { ...state.options.fit };
    if (options.mime === "image/webp" && !state.webp) options.mime = "image/jpeg";
    return (file) => fitToSize(file, options);
  }
  if (tool === "convert") {
    const { convertImage } = await import("./tools/convert");
    const options = { ...state.options.convert };
    if (options.mime === "image/webp" && !state.webp) options.mime = "image/jpeg";
    return (file) => convertImage(file, options);
  }
  const { cleanFile } = await import("./tools/clean");
  return cleanFile;
}

async function downloadZip(): Promise<void> {
  const done = queue().filter((item) => item.status === "done" && item.output);
  if (!done.length) return;
  const { zipSync } = await import("fflate");
  const names = uniqueNames(done.map((item) => item.output!.name));
  const entries: Record<string, Uint8Array> = {};
  for (const [i, item] of done.entries()) {
    // Photos are already compressed, so store them as-is: much faster, same size.
    entries[names[i]] = new Uint8Array(await item.output!.blob.arrayBuffer());
  }
  const zip = zipSync(entries, { level: 0 });
  const url = URL.createObjectURL(new Blob([zip as Uint8Array<ArrayBuffer>], { type: "application/zip" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `filefit-${state.tool}.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

// ---------- events ----------

function switchTool(tool: ToolId): void {
  if (tool === state.tool) return;
  state.tool = tool;
  try {
    localStorage.setItem(TOOL_KEY, tool);
  } catch {
    // not fatal
  }
  renderOptions();
  refresh();
}

els.tools.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLElement>("[data-tool]");
  if (button) switchTool(button.dataset.tool as ToolId);
});

els.tools.addEventListener("keydown", (event) => {
  const index = TOOLS.findIndex((tool) => tool.id === state.tool);
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
  if (!step) return;
  event.preventDefault();
  switchTool(TOOLS[(index + step + TOOLS.length) % TOOLS.length].id);
  $(`tab-${state.tool}`).focus();
});

function updateOption(target: HTMLElement, value: string): void {
  if (state.tool === "clean") return;
  const opt = target.dataset.opt!;
  const options = state.options[state.tool] as unknown as Record<string, unknown>;
  if (target instanceof HTMLInputElement && target.type === "checkbox") {
    options[opt] = target.checked;
  } else if (typeof options[opt] === "number") {
    const number = Math.round(Number(value));
    if (!Number.isFinite(number) || number < 0) return;
    options[opt] = number;
  } else {
    options[opt] = value;
  }
  saveOptions();
}

els.options.addEventListener("click", (event) => {
  const chip = (event.target as HTMLElement).closest<HTMLElement>("button[data-opt]");
  if (!chip) return;
  updateOption(chip, chip.dataset.value!);
  renderOptions();
});

els.options.addEventListener("input", (event) => {
  const target = event.target as HTMLInputElement;
  if (!target.dataset.opt) return;
  if (target.type === "number") {
    if (Number(target.value) < 5) return;
    updateOption(target, target.value);
    for (const chip of els.options.querySelectorAll<HTMLElement>(".chip[data-value]")) {
      chip.setAttribute("aria-pressed", String(Number(chip.dataset.value) === state.options.fit.targetKB));
    }
  } else if (target.type === "range") {
    updateOption(target, target.value);
    const out = document.getElementById("quality-out");
    if (out) out.textContent = `${target.value}%`;
  }
});

els.options.addEventListener("change", (event) => {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  if (!target.dataset.opt || (target instanceof HTMLInputElement && target.type !== "checkbox")) return;
  updateOption(target, target.value);
  if (state.tool === "pdf") clearPdfOutput();
  renderOptions();
  renderActions();
});

els.actions.addEventListener("click", (event) => {
  const action = (event.target as HTMLElement).closest<HTMLElement>("[data-action]")?.dataset.action;
  if (action === "run") void run();
  if (action === "zip") void downloadZip();
  if (action === "clear") {
    queue().forEach(revoke);
    state.queues[state.tool] = [];
    if (state.tool === "pdf") clearPdfOutput();
    refresh();
  }
});

els.items.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-action]");
  const id = Number(button?.closest<HTMLElement>("[data-id]")?.dataset.id);
  if (!button || state.busy) return;
  const items = queue();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return;
  const action = button.dataset.action;
  if (action === "remove") revoke(items.splice(index, 1)[0]);
  else {
    const to = action === "up" ? index - 1 : index + 1;
    if (to < 0 || to >= items.length) return;
    [items[index], items[to]] = [items[to], items[index]];
  }
  if (state.tool === "pdf") clearPdfOutput();
  refresh();
});

// Thumbnails that the browser can't display fall back to the file extension.
els.items.addEventListener(
  "error",
  (event) => {
    const img = event.target as HTMLElement;
    if (img.tagName === "IMG") img.replaceWith(Object.assign(document.createElement("span"), { className: "thumb-ext" }));
  },
  true,
);

els.input.addEventListener("change", () => {
  if (els.input.files) void addFiles([...els.input.files]);
  els.input.value = "";
});

let dragDepth = 0;
window.addEventListener("dragenter", (event) => {
  if (!event.dataTransfer?.types.includes("Files")) return;
  dragDepth++;
  document.body.classList.add("dragging");
});
window.addEventListener("dragleave", () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (!dragDepth) document.body.classList.remove("dragging");
});
window.addEventListener("dragover", (event) => event.preventDefault());
window.addEventListener("drop", (event) => {
  event.preventDefault();
  dragDepth = 0;
  document.body.classList.remove("dragging");
  if (event.dataTransfer?.files.length) void addFiles([...event.dataTransfer.files]);
});

document.addEventListener("paste", (event) => {
  const files = [...(event.clipboardData?.files ?? [])];
  if (files.length) {
    event.preventDefault();
    void addFiles(files);
  }
});

els.lang.addEventListener("click", () => {
  setLang(getLang() === "tr" ? "en" : "tr");
  renderAll();
});

let installPrompt: (Event & { prompt: () => Promise<void> }) | undefined;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event as typeof installPrompt;
  els.install.hidden = false;
});
els.install.addEventListener("click", async () => {
  await installPrompt?.prompt();
  installPrompt = undefined;
  els.install.hidden = true;
});

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => void navigator.serviceWorker.register("./sw.js"));
}

renderAll();
void canEncodeWebp().then((supported) => {
  state.webp = supported;
  if (!supported) renderOptions();
});

