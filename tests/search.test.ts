import { describe, expect, it } from "vitest";
import { nextScale, scaleForMaxSide, searchQuality } from "../src/lib/search";

// Fake encoder: size grows linearly with quality, like real JPEG output roughly does.
const encoder = (bytesAtFull: number) => async (quality: number) => ({ size: Math.round(bytesAtFull * quality) });

describe("searchQuality", () => {
  it("returns the top quality when it already fits", async () => {
    const result = await searchQuality(encoder(100_000), 200_000);
    expect(result.best?.quality).toBe(0.92);
  });

  it("finds the highest quality under the target", async () => {
    const target = 70_000;
    const result = await searchQuality(encoder(100_000), target);
    expect(result.best).toBeDefined();
    expect(result.best!.result.size).toBeLessThanOrEqual(target);
    expect(result.best!.quality).toBeGreaterThan(0.62);
  });

  it("reports when even the lowest quality is too big", async () => {
    const result = await searchQuality(encoder(1_000_000), 100_000);
    expect(result.best).toBeUndefined();
    expect(result.smallest.quality).toBe(0.4);
    expect(result.smallest.result.size).toBe(400_000);
  });

  it("never returns a result over the target", async () => {
    for (const target of [41_000, 55_555, 80_000, 91_999]) {
      const result = await searchQuality(encoder(100_000), target);
      expect(result.best!.result.size).toBeLessThanOrEqual(target);
    }
  });
});

describe("nextScale", () => {
  it("shrinks so pixel count roughly matches the size ratio", () => {
    // 4× too big → about half the side length.
    expect(nextScale(1, 400_000, 100_000)).toBeCloseTo(0.46, 2);
  });

  it("always makes progress and never shrinks too drastically", () => {
    expect(nextScale(1, 101_000, 100_000)).toBe(0.9);
    expect(nextScale(1, 100_000_000, 100_000)).toBe(0.3);
  });
});

describe("scaleForMaxSide", () => {
  it("limits the longer side and never upscales", () => {
    expect(scaleForMaxSide(4000, 3000, 2000)).toBe(0.5);
    expect(scaleForMaxSide(3000, 4000, 2000)).toBe(0.5);
    expect(scaleForMaxSide(800, 600, 2000)).toBe(1);
    expect(scaleForMaxSide(800, 600, 0)).toBe(1);
  });
});
