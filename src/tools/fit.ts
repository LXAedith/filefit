import { baseName, extensionFor, kindOf } from "../lib/format";
import { encode, loadImage, render } from "../lib/image";
import { stripJpegMetadata } from "../lib/jpeg";
import { nextScale, scaleForMaxSide, searchQuality } from "../lib/search";
import { stripWebpMetadata } from "../lib/webp";
import type { ToolOutput } from "./types";

export interface FitOptions {
  /** Limit in KB, counted as 1000 bytes so the result also fits sites that use 1024. */
  targetKB: number;
  mime: "image/jpeg" | "image/webp";
  /** 0 keeps the original dimensions. */
  maxSide: number;
}

const MAX_ATTEMPTS = 8;
const MIN_SIDE = 64;
// Below this, JPEG artifacts look worse than a slightly smaller image, so shrink instead.
const MIN_QUALITY = 0.5;

export function sizeLabel(kb: number): string {
  return kb >= 1000 && kb % 1000 === 0 ? `${kb / 1000}mb` : `${kb}kb`;
}

export async function fitToSize(file: File, options: FitOptions): Promise<ToolOutput> {
  const target = options.targetKB * 1000;
  const name = `${baseName(file.name)}-${sizeLabel(options.targetKB)}.${extensionFor(options.mime)}`;
  const kind = await kindOf(file);
  const sameFormat =
    (kind === "jpeg" && options.mime === "image/jpeg") || (kind === "webp" && options.mime === "image/webp");

  const bitmap = await loadImage(file);
  try {
    let scale = scaleForMaxSide(bitmap.width, bitmap.height, options.maxSide);

    if (sameFormat && scale === 1 && file.size <= target) {
      // Re-encoding would only lose quality; just drop the hidden data.
      const bytes = new Uint8Array(await file.arrayBuffer());
      const clean = kind === "jpeg" ? stripJpegMetadata(bytes).bytes : stripWebpMetadata(bytes).bytes;
      return { blob: new Blob([clean], { type: options.mime }), name, notes: [{ key: "note_already_fits" }] };
    }

    let smallest: Blob | undefined;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const canvas = render(bitmap, bitmap.width * scale, bitmap.height * scale, options.mime === "image/jpeg");
      const search = await searchQuality((quality) => encode(canvas, options.mime, quality), target, { min: MIN_QUALITY });
      if (search.best) {
        return {
          blob: search.best.result,
          name,
          notes: [
            {
              key: "note_fitted",
              params: { w: canvas.width, h: canvas.height, q: Math.round(search.best.quality * 100) },
            },
          ],
        };
      }
      smallest = search.smallest.result;
      if (Math.max(canvas.width, canvas.height) <= MIN_SIDE) break;
      scale = nextScale(scale, search.smallest.result.size, target);
    }
    return { blob: smallest!, name, notes: [{ key: "note_not_reached" }] };
  } finally {
    bitmap.close();
  }
}
