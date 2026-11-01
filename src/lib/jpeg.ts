// Lossless JPEG metadata removal: segments are dropped, the compressed image data is
// copied byte for byte, so quality is untouched.

const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;
const APP0 = 0xe0; // JFIF (kept)
const APP1 = 0xe1; // EXIF (incl. GPS), XMP
const APP2 = 0xe2; // ICC profile (kept) or MPF (dropped)
const APP14 = 0xee; // Adobe colour transform (kept, needed to decode correctly)
const APP15 = 0xef;
const COM = 0xfe; // free-text comments

export interface JpegStripResult {
  bytes: Uint8Array<ArrayBuffer>;
  /** EXIF orientation of the original (1 = upright). Preserved in the output. */
  orientation: number;
  removedSegments: number;
}

function startsWith(bytes: Uint8Array, offset: number, text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (bytes[offset + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

/** Reads the Orientation tag (0x0112) from an EXIF APP1 payload starting at `tiff`. */
export function readExifOrientation(bytes: Uint8Array, tiff: number, end: number): number {
  if (end - tiff < 8) return 1;
  const little = bytes[tiff] === 0x49; // "II"
  const u16 = (at: number) => (little ? bytes[at] | (bytes[at + 1] << 8) : (bytes[at] << 8) | bytes[at + 1]);
  const u32 = (at: number) =>
    little
      ? (bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16) | (bytes[at + 3] << 24)) >>> 0
      : ((bytes[at] << 24) | (bytes[at + 1] << 16) | (bytes[at + 2] << 8) | bytes[at + 3]) >>> 0;
  const ifd = tiff + u32(tiff + 4);
  if (ifd + 2 > end) return 1;
  const entries = u16(ifd);
  for (let i = 0; i < entries; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > end) break;
    if (u16(entry) === 0x0112) {
      const value = u16(entry + 8);
      return value >= 1 && value <= 8 ? value : 1;
    }
  }
  return 1;
}

/** A 36-byte APP1 segment that contains nothing but the Orientation tag. */
export function orientationSegment(orientation: number): Uint8Array {
  return new Uint8Array([
    0xff, APP1, 0x00, 0x22,
    0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
    0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08, // big-endian TIFF header, IFD0 at 8
    0x00, 0x01, // one entry
    0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, orientation, 0x00, 0x00, // Orientation SHORT
    0x00, 0x00, 0x00, 0x00, // no next IFD
  ]);
}

function shouldDrop(bytes: Uint8Array, marker: number, payload: number): boolean {
  if (marker === COM) return true;
  // MPF points at extra images appended after the main one; those are dropped too.
  if (marker === APP2) return !startsWith(bytes, payload, "ICC_PROFILE\0");
  // APP1 EXIF/XMP, APP3–13 vendor data, IPTC, C2PA/JUMBF (APP11) and so on.
  const isApp = marker >= APP0 && marker <= APP15;
  return isApp && marker !== APP0 && marker !== APP14;
}

export function stripJpegMetadata(input: Uint8Array): JpegStripResult {
  if (input[0] !== 0xff || input[1] !== SOI) throw new Error("Not a JPEG file");

  const chunks: Uint8Array[] = [];
  let orientation = 1;
  let removedSegments = 0;
  let pos = 2;

  while (pos < input.length) {
    if (input[pos] !== 0xff) throw new Error("Corrupt JPEG: expected a marker");
    // Skip fill bytes (0xFF padding before a marker).
    while (input[pos + 1] === 0xff) pos++;
    const marker = input[pos + 1];

    if (marker === EOI) {
      chunks.push(input.subarray(pos, pos + 2));
      break; // Anything after the end of the main image (MPF extras, trailing junk) is dropped.
    }
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      chunks.push(input.subarray(pos, pos + 2));
      pos += 2;
      continue;
    }

    const length = (input[pos + 2] << 8) | input[pos + 3];
    const segmentEnd = pos + 2 + length;
    if (length < 2 || segmentEnd > input.length) throw new Error("Corrupt JPEG: bad segment length");
    const payload = pos + 4;

    if (marker === APP1 && startsWith(input, payload, "Exif\0\0")) {
      orientation = readExifOrientation(input, payload + 6, segmentEnd);
    }

    if (shouldDrop(input, marker, payload)) {
      removedSegments++;
      pos = segmentEnd;
      continue;
    }

    chunks.push(input.subarray(pos, segmentEnd));
    pos = segmentEnd;

    if (marker === SOS) {
      // Entropy-coded data runs until the next real marker (0xFF not followed by 0x00 or RSTn).
      let scan = pos;
      let found = false;
      while (scan < input.length - 1) {
        if (input[scan] === 0xff) {
          const next = input[scan + 1];
          if (next !== 0x00 && !(next >= 0xd0 && next <= 0xd7) && next !== 0xff) {
            found = true;
            break;
          }
        }
        scan++;
      }
      if (!found) {
        // Truncated file without an end marker: keep what is there.
        chunks.push(input.subarray(pos));
        break;
      }
      chunks.push(input.subarray(pos, scan));
      pos = scan;
    }
  }

  // Without its orientation the photo would suddenly appear sideways, so keep just that.
  const head = [input.subarray(0, 2)];
  if (orientation !== 1) head.push(orientationSegment(orientation));

  return { bytes: concat([...head, ...chunks]), orientation, removedSegments };
}

export function concat(parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}
