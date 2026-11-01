import { AppError } from "../lib/errors";
import { baseName, kindOf } from "../lib/format";
import { encode, loadImage, render } from "../lib/image";
import { stripJpegMetadata } from "../lib/jpeg";
import { readPngText, stripPngMetadata } from "../lib/png";
import { stripWebpMetadata } from "../lib/webp";
import type { ToolOutput } from "./types";

export interface MetaSummary {
  gps?: { lat: number; lon: number };
  camera?: string;
  date?: Date;
  software?: string;
  author?: string;
  /** Free-form text fields, e.g. PNG "Comment". */
  other: [string, string][];
  fields: number;
}

function text(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

export async function readMetadata(file: File): Promise<MetaSummary> {
  const { default: exifr } = await import("exifr");
  let data: Record<string, unknown> = {};
  try {
    data =
      (await exifr.parse(file, {
        tiff: true,
        exif: true,
        gps: true,
        xmp: true,
        iptc: true,
        icc: false,
        jfif: false,
        ihdr: false,
        makerNote: false,
      })) ?? {};
  } catch {
    // unreadable metadata is treated as none
  }

  // exifr skips PNG text chunks unless it also parses the image header, so read them here.
  let pngText: [string, string][] = [];
  if ((await kindOf(file)) === "png") {
    try {
      pngText = readPngText(new Uint8Array(await file.arrayBuffer()));
    } catch {
      // corrupt PNG: nothing to show
    }
  }
  const fromPng = (keyword: string) => pngText.find(([key]) => key.toLowerCase() === keyword)?.[1];

  const summary: MetaSummary = {
    fields: Object.keys(data).length + pngText.length,
    other: pngText
      .filter(([key]) => !["author", "software"].includes(key.toLowerCase()))
      .map(([key, value]): [string, string] => [key, value.length > 80 ? `${value.slice(0, 80)}…` : value])
      .slice(0, 4),
  };
  const { latitude, longitude } = data;
  if (typeof latitude === "number" && typeof longitude === "number" && (latitude !== 0 || longitude !== 0)) {
    summary.gps = { lat: latitude, lon: longitude };
  }
  const make = text(data.Make);
  const model = text(data.Model);
  if (make || model) {
    summary.camera = model && make && model.toLowerCase().startsWith(make.toLowerCase()) ? model : [make, model].filter(Boolean).join(" ");
  }
  const date = data.DateTimeOriginal ?? data.CreateDate;
  if (date instanceof Date && !Number.isNaN(date.getTime())) summary.date = date;
  summary.software = text(data.Software) ?? fromPng("software");
  summary.author = text(data.Artist) ?? text(data.creator) ?? text(data.Copyright) ?? fromPng("author");
  return summary;
}

export async function cleanFile(file: File): Promise<ToolOutput> {
  const kind = await kindOf(file);
  const base = `${baseName(file.name)}-clean`;
  const bytes = () => file.arrayBuffer().then((buffer) => new Uint8Array(buffer));

  switch (kind) {
    case "jpeg":
      return lossless(stripJpegMetadata(await bytes()).bytes, "image/jpeg", `${base}.jpg`);
    case "png":
      return lossless(stripPngMetadata(await bytes()).bytes, "image/png", `${base}.png`);
    case "webp":
      return lossless(stripWebpMetadata(await bytes()).bytes, "image/webp", `${base}.webp`);
    case "pdf":
    case "other":
      throw new AppError("unsupported");
    default: {
      // HEIC, AVIF, GIF, BMP: drawing the pixels to a fresh JPG leaves all metadata behind.
      const bitmap = await loadImage(file);
      try {
        const canvas = render(bitmap, bitmap.width, bitmap.height, true);
        const blob = await encode(canvas, "image/jpeg", 0.92);
        return { blob, name: `${base}.jpg`, notes: [{ key: "note_reencoded" }] };
      } finally {
        bitmap.close();
      }
    }
  }
}

function lossless(bytes: Uint8Array<ArrayBuffer>, type: string, name: string): ToolOutput {
  return { blob: new Blob([bytes], { type }), name, notes: [{ key: "note_lossless" }] };
}
