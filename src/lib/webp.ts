import { concat } from "./jpeg";

const EXIF_FLAG = 0x08;
const XMP_FLAG = 0x04;

function fourCC(bytes: Uint8Array, at: number): string {
  return String.fromCharCode(...bytes.subarray(at, at + 4));
}

export function stripWebpMetadata(input: Uint8Array): { bytes: Uint8Array<ArrayBuffer>; removedChunks: number } {
  if (fourCC(input, 0) !== "RIFF" || fourCC(input, 8) !== "WEBP") throw new Error("Not a WebP file");
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
  const parts: Uint8Array[] = [];
  let removedChunks = 0;
  let pos = 12;

  while (pos + 8 <= input.length) {
    const type = fourCC(input, pos);
    const size = view.getUint32(pos + 4, true);
    const end = pos + 8 + size + (size & 1); // chunks are padded to an even length
    if (pos + 8 + size > input.length) throw new Error("Corrupt WebP: chunk runs past end of file");
    if (type === "EXIF" || type === "XMP ") {
      removedChunks++;
    } else if (type === "VP8X") {
      const chunk = input.slice(pos, Math.min(end, input.length));
      chunk[8] &= ~(EXIF_FLAG | XMP_FLAG);
      parts.push(chunk);
    } else {
      parts.push(input.subarray(pos, Math.min(end, input.length)));
    }
    pos = end;
  }

  const body = concat(parts);
  const header = new Uint8Array(12);
  header.set(input.subarray(0, 12));
  new DataView(header.buffer).setUint32(4, body.length + 4, true);
  return { bytes: concat([header, body]), removedChunks };
}
