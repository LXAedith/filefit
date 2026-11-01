import { concat } from "../src/lib/jpeg";

export const bytes = (...values: number[]) => new Uint8Array(values);
export const ascii = (text: string) => new TextEncoder().encode(text);

export function segment(marker: number, payload: Uint8Array): Uint8Array {
  const length = payload.length + 2;
  return concat([bytes(0xff, marker, length >> 8, length & 0xff), payload]);
}

/** EXIF APP1 payload with IFD0 holding Orientation and a GPS pointer (little-endian). */
export function exifPayload(orientation: number): Uint8Array {
  const tiff = bytes(
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, // "II", 42, IFD0 at 8
    0x02, 0x00, // 2 entries
    0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, orientation, 0x00, 0x00, 0x00, // Orientation
    0x25, 0x88, 0x04, 0x00, 0x01, 0x00, 0x00, 0x00, 0x26, 0x00, 0x00, 0x00, // GPS IFD pointer
    0x00, 0x00, 0x00, 0x00,
  );
  return concat([ascii("Exif\0\0"), tiff]);
}

/** A structurally valid baseline JPEG skeleton with the given extra segments after SOI. */
export function jpeg(extra: Uint8Array[], trailing = new Uint8Array()): Uint8Array {
  return concat([
    bytes(0xff, 0xd8),
    ...extra,
    segment(0xdb, new Uint8Array(65)), // DQT
    segment(0xc0, bytes(8, 0, 1, 0, 1, 1, 1, 0x11, 0)), // SOF0 1×1
    segment(0xc4, new Uint8Array(20)), // DHT
    segment(0xda, bytes(1, 1, 0, 0, 63, 0)), // SOS
    bytes(0x12, 0xff, 0x00, 0x34, 0xff, 0xd0, 0x56), // scan data with a stuffed byte and a restart marker
    bytes(0xff, 0xd9),
    trailing,
  ]);
}

export function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  new DataView(out.buffer).setUint32(0, data.length);
  out.set(ascii(type), 4);
  out.set(data, 8);
  return out; // CRC left as zeros; the stripper copies chunks verbatim
}

export function webpChunk(type: string, data: Uint8Array): Uint8Array {
  const padded = data.length + (data.length & 1);
  const out = new Uint8Array(8 + padded);
  out.set(ascii(type), 0);
  new DataView(out.buffer).setUint32(4, data.length, true);
  out.set(data, 8);
  return out;
}

export function webp(chunks: Uint8Array[]): Uint8Array {
  const body = concat([ascii("WEBP"), ...chunks]);
  const header = new Uint8Array(8);
  header.set(ascii("RIFF"));
  new DataView(header.buffer).setUint32(4, body.length, true);
  return concat([header, body]);
}

export function find(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (haystack[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}
