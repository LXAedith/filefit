export interface Encoded {
  size: number;
}

export interface QualitySearch<T extends Encoded> {
  /** Highest quality that fits the target, if any did. */
  best?: { result: T; quality: number };
  /** Result at the lowest allowed quality — used to decide how much to shrink the image. */
  smallest: { result: T; quality: number };
}

/**
 * Binary-searches the encoder quality for the best-looking result that is still
 * `<= target` bytes. Encoders are close enough to monotonic for this to work well.
 */
export async function searchQuality<T extends Encoded>(
  encode: (quality: number) => Promise<T>,
  target: number,
  { min = 0.4, max = 0.92, steps = 6 } = {},
): Promise<QualitySearch<T>> {
  const top = await encode(max);
  if (top.size <= target) return { best: { result: top, quality: max }, smallest: { result: top, quality: max } };

  const bottom = await encode(min);
  const smallest = { result: bottom, quality: min };
  if (bottom.size > target) return { smallest };

  let best = smallest;
  let lo = min;
  let hi = max;
  for (let i = 0; i < steps; i++) {
    const mid = Math.round(((lo + hi) / 2) * 100) / 100;
    if (mid <= lo || mid >= hi) break;
    const result = await encode(mid);
    if (result.size <= target) {
      best = { result, quality: mid };
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return { best, smallest };
}

/**
 * File size grows roughly with pixel count, i.e. with scale². Picks the next scale so
 * the smallest encode lands a bit under the target, without shrinking too drastically.
 */
export function nextScale(scale: number, smallestSize: number, target: number): number {
  const ratio = Math.sqrt(target / smallestSize) * 0.92;
  return scale * Math.min(0.9, Math.max(0.3, ratio));
}

/** Scale that makes the longer side at most `maxSide` (never upscales). */
export function scaleForMaxSide(width: number, height: number, maxSide?: number): number {
  if (!maxSide) return 1;
  return Math.min(1, maxSide / Math.max(width, height));
}
