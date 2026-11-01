import { kindOf, type OutputMime } from "./format";
import { AppError } from "./errors";

/** Decodes any supported image (including iPhone HEIC) to an upright bitmap. */
export async function loadImage(file: Blob): Promise<ImageBitmap> {
  const kind = await kindOf(file);
  if (kind === "pdf") throw new AppError("unsupported");
  if (kind === "heic") return decodeHeic(file);
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    try {
      return await decodeWithImageElement(file);
    } catch {
      throw new AppError("decode");
    }
  }
}

async function decodeHeic(file: Blob): Promise<ImageBitmap> {
  // Safari can decode HEIC itself; everywhere else the decoder (~3 MB) is loaded on first use.
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    // fall through to the bundled decoder
  }
  try {
    const { heicTo } = await import("heic-to/csp");
    return await heicTo({ blob: file, type: "bitmap" });
  } catch {
    throw new AppError("decode");
  }
}

/** Fallback for formats createImageBitmap rejects from a Blob, such as SVG. */
async function decodeWithImageElement(file: Blob): Promise<ImageBitmap> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return await createImageBitmap(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Draws the bitmap at the given size. Big reductions are done in halving steps,
 * which looks much sharper than a single drawImage.
 */
export function render(bitmap: ImageBitmap, width: number, height: number, opaque: boolean): HTMLCanvasElement {
  width = Math.max(1, Math.round(width));
  height = Math.max(1, Math.round(height));
  let source: CanvasImageSource = bitmap;
  let sw = bitmap.width;
  let sh = bitmap.height;

  while (sw / 2 >= width && sh / 2 >= height) {
    const step = document.createElement("canvas");
    step.width = Math.round(sw / 2);
    step.height = Math.round(sh / 2);
    const ctx = step.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, step.width, step.height);
    source = step;
    sw = step.width;
    sh = step.height;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  if (opaque) {
    // JPEG has no transparency; without this, transparent areas turn black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

export function encode(canvas: HTMLCanvasElement, mime: OutputMime, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new AppError("generic"))), mime, quality);
  });
}

let webpSupport: Promise<boolean> | undefined;

/** Safari can display WebP but cannot save it from a canvas. */
export function canEncodeWebp(): Promise<boolean> {
  webpSupport ??= new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    canvas.toBlob((blob) => resolve(blob?.type === "image/webp"), "image/webp");
  });
  return webpSupport;
}
