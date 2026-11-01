import { concat } from "./jpeg";

// Text and EXIF chunks; everything that affects how the image looks (colour profile,
// gamma, transparency) is kept.
const METADATA_CHUNKS = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);
const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

interface Chunk {
  type: string;
  start: number;
  end: number;
  data: Uint8Array;
}

function* chunks(input: Uint8Array): Generator<Chunk> {
  if (!SIGNATURE.every((byte, i) => input[i] === byte)) throw new Error("Not a PNG file");
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
  let pos = 8;
  while (pos + 12 <= input.length) {
    const length = view.getUint32(pos);
    const type = String.fromCharCode(...input.subarray(pos + 4, pos + 8));
    const end = pos + 12 + length;
    if (end > input.length) throw new Error("Corrupt PNG: chunk runs past end of file");
    yield { type, start: pos, end, data: input.subarray(pos + 8, pos + 8 + length) };
    pos = end;
    if (type === "IEND") break;
  }
}

export function stripPngMetadata(input: Uint8Array): { bytes: Uint8Array<ArrayBuffer>; removedChunks: number } {
  const parts: Uint8Array[] = [input.subarray(0, 8)];
  let removedChunks = 0;
  for (const chunk of chunks(input)) {
    if (METADATA_CHUNKS.has(chunk.type)) removedChunks++;
    else parts.push(input.subarray(chunk.start, chunk.end));
  }
  return { bytes: concat(parts), removedChunks };
}

/** Keyword/text pairs from tEXt, iTXt and zTXt chunks. Compressed text is reported as "…". */
export function readPngText(input: Uint8Array): [string, string][] {
  const latin1 = new TextDecoder("latin1");
  const utf8 = new TextDecoder();
  const entries: [string, string][] = [];
  for (const { type, data } of chunks(input)) {
    if (!["tEXt", "iTXt", "zTXt"].includes(type)) continue;
    const zero = data.indexOf(0);
    if (zero < 1) continue;
    const keyword = latin1.decode(data.subarray(0, zero));
    let text = "…";
    if (type === "tEXt") {
      text = latin1.decode(data.subarray(zero + 1));
    } else if (type === "iTXt" && data[zero + 1] === 0) {
      // keyword\0 flag method language\0 translated\0 text
      const language = data.indexOf(0, zero + 3);
      const translated = language < 0 ? -1 : data.indexOf(0, language + 1);
      if (translated >= 0) text = utf8.decode(data.subarray(translated + 1));
    }
    entries.push([keyword, text]);
  }
  return entries;
}
