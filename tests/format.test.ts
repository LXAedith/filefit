import { describe, expect, it } from "vitest";
import { baseName, formatBytes, sniffKind, uniqueNames } from "../src/lib/format";
import { sizeLabel } from "../src/tools/fit";
import { ascii, bytes } from "./helpers";

describe("formatBytes", () => {
  it("uses file-manager units", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(204_800)).toBe("200 KB");
    expect(formatBytes(1_572_864)).toBe("1.5 MB");
    expect(formatBytes(1_572_864, "tr-TR")).toBe("1,5 MB");
  });
});

describe("names", () => {
  it("strips extensions", () => {
    expect(baseName("IMG_0001.HEIC")).toBe("IMG_0001");
    expect(baseName("archive.tar.gz")).toBe("archive.tar");
    expect(baseName(".env")).toBe(".env");
  });

  it("deduplicates names for ZIP files", () => {
    expect(uniqueNames(["a.jpg", "b.jpg", "A.jpg", "a.jpg"])).toEqual(["a.jpg", "b.jpg", "A (2).jpg", "a (3).jpg"]);
  });

  it("labels target sizes", () => {
    expect(sizeLabel(200)).toBe("200kb");
    expect(sizeLabel(1000)).toBe("1mb");
    expect(sizeLabel(1500)).toBe("1500kb");
  });
});

describe("sniffKind", () => {
  const ftyp = (brand: string) => new Uint8Array([0, 0, 0, 24, ...ascii("ftyp"), ...ascii(brand), 0, 0, 0, 0]);

  it("detects formats from their first bytes, not the file name", () => {
    expect(sniffKind(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpeg");
    expect(sniffKind(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a))).toBe("png");
    expect(sniffKind(new Uint8Array([...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBP")]))).toBe("webp");
    expect(sniffKind(ascii("%PDF-1.7"))).toBe("pdf");
    expect(sniffKind(ftyp("heic"))).toBe("heic");
    expect(sniffKind(ftyp("mif1"))).toBe("heic");
    expect(sniffKind(ftyp("avif"))).toBe("avif");
    expect(sniffKind(ascii("hello world"))).toBe("other");
  });
});
