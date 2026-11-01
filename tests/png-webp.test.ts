import { describe, expect, it } from "vitest";
import { concat } from "../src/lib/jpeg";
import { readPngText, stripPngMetadata } from "../src/lib/png";
import { stripWebpMetadata } from "../src/lib/webp";
import { ascii, bytes, find, pngChunk, webp, webpChunk } from "./helpers";

const SIGNATURE = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);

describe("stripPngMetadata", () => {
  it("removes text, EXIF and time chunks and keeps image chunks", () => {
    const ihdr = pngChunk("IHDR", new Uint8Array(13));
    const iccp = pngChunk("iCCP", ascii("icc"));
    const idat = pngChunk("IDAT", bytes(1, 2, 3));
    const iend = pngChunk("IEND", new Uint8Array());
    const input = concat([
      SIGNATURE, ihdr, pngChunk("tEXt", ascii("Author\0Jane")), iccp, pngChunk("eXIf", ascii("MM\0*gps")),
      pngChunk("iTXt", ascii("XML:com.adobe.xmp")), pngChunk("tIME", new Uint8Array(7)), idat, iend,
    ]);
    const { bytes: out, removedChunks } = stripPngMetadata(input);
    expect(removedChunks).toBe(4);
    expect(out).toEqual(concat([SIGNATURE, ihdr, iccp, idat, iend]));
  });

  it("drops anything after IEND", () => {
    const input = concat([SIGNATURE, pngChunk("IHDR", new Uint8Array(13)), pngChunk("IEND", new Uint8Array()), ascii("junk")]);
    expect(find(stripPngMetadata(input).bytes, ascii("junk"))).toBe(-1);
  });
});

describe("stripWebpMetadata", () => {
  it("removes EXIF and XMP chunks, clears their flags and fixes the RIFF size", () => {
    const vp8x = webpChunk("VP8X", bytes(0x2c, 0, 0, 0, 0, 0, 0, 0, 0, 0)); // ICC + EXIF + XMP flags
    const icc = webpChunk("ICCP", ascii("icc"));
    const image = webpChunk("VP8 ", bytes(1, 2, 3)); // odd length → padded
    const input = webp([vp8x, icc, image, webpChunk("EXIF", ascii("gps-data")), webpChunk("XMP ", ascii("<xmp/>"))]);

    const { bytes: out, removedChunks } = stripWebpMetadata(input);
    expect(removedChunks).toBe(2);
    expect(find(out, ascii("gps-data"))).toBe(-1);
    expect(find(out, ascii("<xmp/>"))).toBe(-1);
    expect(out[12 + 8]).toBe(0x20); // only the ICC flag is left
    const riffSize = new DataView(out.buffer).getUint32(4, true);
    expect(riffSize).toBe(out.length - 8);
    expect(find(out, ascii("ICCP"))).toBeGreaterThan(0);
  });

  it("leaves a simple WebP without metadata unchanged", () => {
    const input = webp([webpChunk("VP8L", bytes(1, 2, 3, 4))]);
    expect(stripWebpMetadata(input).bytes).toEqual(input);
  });
});

describe("readPngText", () => {
  it("reads tEXt and uncompressed iTXt fields", () => {
    const itxt = concat([ascii("Comment\0"), bytes(0, 0), ascii("tr\0Yorum\0"), new TextEncoder().encode("gizli not ğüş")]);
    const input = concat([
      SIGNATURE, pngChunk("IHDR", new Uint8Array(13)), pngChunk("tEXt", ascii("Author\0Jane")),
      pngChunk("iTXt", itxt), pngChunk("zTXt", ascii("Raw\0\0compressed")), pngChunk("IEND", new Uint8Array()),
    ]);
    expect(readPngText(input)).toEqual([["Author", "Jane"], ["Comment", "gizli not ğüş"], ["Raw", "…"]]);
  });
});
