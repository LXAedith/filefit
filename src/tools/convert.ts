import { baseName, extensionFor, type OutputMime } from "../lib/format";
import { encode, loadImage, render } from "../lib/image";
import { scaleForMaxSide } from "../lib/search";
import type { ToolOutput } from "./types";

export interface ConvertOptions {
  mime: OutputMime;
  /** 1–100, ignored for PNG. */
  quality: number;
  /** 0 keeps the original dimensions. */
  maxSide: number;
}

export async function convertImage(file: File, options: ConvertOptions): Promise<ToolOutput> {
  const bitmap = await loadImage(file);
  try {
    const scale = scaleForMaxSide(bitmap.width, bitmap.height, options.maxSide);
    const canvas = render(bitmap, bitmap.width * scale, bitmap.height * scale, options.mime === "image/jpeg");
    const quality = options.mime === "image/png" ? undefined : options.quality / 100;
    const blob = await encode(canvas, options.mime, quality);

    let name = `${baseName(file.name)}.${extensionFor(options.mime)}`;
    if (name.toLowerCase() === file.name.toLowerCase()) {
      name = `${baseName(file.name)}-converted.${extensionFor(options.mime)}`;
    }
    return { blob, name, notes: [{ key: "note_size", params: { w: canvas.width, h: canvas.height } }] };
  } finally {
    bitmap.close();
  }
}
