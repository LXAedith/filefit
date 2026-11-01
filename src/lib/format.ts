export type OutputMime = "image/jpeg" | "image/png" | "image/webp";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function extensionFor(mime: string): string {
  return EXTENSIONS[mime] ?? "bin";
}

/** Sizes the way file managers show them (1 KB = 1024 bytes). */
export function formatBytes(bytes: number, locale = "en"): string {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toLocaleString(locale, { maximumFractionDigits: digits })} ${units[unit]}`;
}

export function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(0, dot) : fileName;
}

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

/** Makes names unique for a ZIP: a.jpg, a.jpg → a.jpg, a (2).jpg */
export function uniqueNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const key = name.toLowerCase();
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    if (count === 0) return name;
    const ext = extensionOf(name);
    const renamed = `${baseName(name)} (${count + 1})${ext ? `.${ext}` : ""}`;
    seen.set(renamed.toLowerCase(), 1);
    return renamed;
  });
}

export type FileKind = "jpeg" | "png" | "webp" | "heic" | "pdf" | "gif" | "avif" | "bmp" | "other";

/** Detects the real format from the first bytes, so a renamed file is still handled correctly. */
export function sniffKind(head: Uint8Array): FileKind {
  const ascii = (from: number, to: number) => String.fromCharCode(...head.subarray(from, to));
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "jpeg";
  if (head[0] === 0x89 && ascii(1, 4) === "PNG") return "png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (ascii(0, 5) === "%PDF-") return "pdf";
  if (ascii(0, 4) === "GIF8") return "gif";
  if (ascii(0, 2) === "BM") return "bmp";
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    if (brand === "avif" || brand === "avis") return "avif";
    if (["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1"].includes(brand)) return "heic";
  }
  return "other";
}

export async function kindOf(file: Blob): Promise<FileKind> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  return sniffKind(head);
}
