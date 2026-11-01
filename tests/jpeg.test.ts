import { describe, expect, it } from "vitest";
import { orientationSegment, readExifOrientation, stripJpegMetadata } from "../src/lib/jpeg";
import { ascii, bytes, exifPayload, find, jpeg, segment } from "./helpers";

const jfif = segment(0xe0, ascii("JFIF\0\x01\x01\0\0\x01\0\x01\0\0"));
const icc = segment(0xe2, ascii("ICC_PROFILE\0\x01\x01profile-data"));
const mpf = segment(0xe2, ascii("MPF\0secondary-image-index"));
const xmp = segment(0xe1, ascii("http://ns.adobe.com/xap/1.0/\0<x:xmpmeta>GPS</x:xmpmeta>"));
const iptc = segment(0xed, ascii("Photoshop 3.0\0iptc"));
const comment = segment(0xfe, ascii("shot at home"));
const adobe = segment(0xee, ascii("Adobe\0\x64\0\0\0\0\x01"));

describe("stripJpegMetadata", () => {
  it("removes EXIF, XMP, IPTC, MPF and comments but keeps JFIF, ICC and Adobe", () => {
    const input = jpeg([jfif, segment(0xe1, exifPayload(1)), xmp, icc, mpf, iptc, comment, adobe]);
    const { bytes: out, removedSegments, orientation } = stripJpegMetadata(input);

    expect(orientation).toBe(1);
    expect(removedSegments).toBe(5);
    expect(find(out, ascii("Exif"))).toBe(-1);
    expect(find(out, ascii("xmpmeta"))).toBe(-1);
    expect(find(out, ascii("Photoshop"))).toBe(-1);
    expect(find(out, ascii("MPF"))).toBe(-1);
    expect(find(out, ascii("shot at home"))).toBe(-1);
    expect(find(out, ascii("JFIF"))).toBeGreaterThan(0);
    expect(find(out, ascii("ICC_PROFILE"))).toBeGreaterThan(0);
    expect(find(out, ascii("Adobe"))).toBeGreaterThan(0);
  });

  it("copies the compressed image data byte for byte", () => {
    const clean = jpeg([]);
    const { bytes: out } = stripJpegMetadata(jpeg([segment(0xe1, exifPayload(1)), comment]));
    expect(out).toEqual(clean);
  });

  it("keeps only the orientation so rotated photos stay upright", () => {
    const { bytes: out, orientation } = stripJpegMetadata(jpeg([segment(0xe1, exifPayload(6))]));
    expect(orientation).toBe(6);
    expect(Array.from(out.subarray(0, 2 + 36))).toEqual([0xff, 0xd8, ...orientationSegment(6)]);
    // The re-added segment must itself be readable.
    expect(readExifOrientation(out, 2 + 4 + 6, 2 + 36)).toBe(6);
  });

  it("drops data appended after the end-of-image marker", () => {
    const { bytes: out } = stripJpegMetadata(jpeg([], ascii("extra-image-with-its-own-exif")));
    expect(Array.from(out.subarray(-2))).toEqual([0xff, 0xd9]);
    expect(find(out, ascii("extra-image"))).toBe(-1);
  });

  it("tolerates fill bytes before markers and truncated files", () => {
    const withFill = jpeg([]);
    const padded = new Uint8Array([...withFill.subarray(0, 2), 0xff, 0xff, ...withFill.subarray(2)]);
    expect(() => stripJpegMetadata(padded)).not.toThrow();

    const truncated = jpeg([]).subarray(0, -2);
    expect(() => stripJpegMetadata(truncated)).not.toThrow();
  });

  it("rejects files that are not JPEG", () => {
    expect(() => stripJpegMetadata(bytes(0x89, 0x50, 0x4e, 0x47))).toThrow();
  });
});
