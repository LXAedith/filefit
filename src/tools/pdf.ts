import { EncryptedPDFError, PDFDocument } from "pdf-lib";
import { AppError } from "../lib/errors";
import { baseName, kindOf } from "../lib/format";
import { encode, loadImage, render } from "../lib/image";
import { scaleForMaxSide } from "../lib/search";
import type { ToolOutput } from "./types";

export interface PdfOptions {
  pageSize: "a4" | "letter" | "fit";
  margins: boolean;
  quality: "high" | "medium" | "small";
}

// Points (1/72 inch).
const PAGE_SIZES = { a4: [595.28, 841.89], letter: [612, 792] } as const;
const MARGIN = 28; // ≈ 1 cm
// Long side in pixels ≈ A4 at 300 / 150 / 100 dpi.
const QUALITY = {
  high: { maxSide: 3508, jpeg: 0.9 },
  medium: { maxSide: 1754, jpeg: 0.8 },
  small: { maxSide: 1169, jpeg: 0.65 },
} as const;
const FIT_DPI = 150;

export async function buildPdf(
  files: File[],
  options: PdfOptions,
  onProgress: (done: number) => void = () => {},
): Promise<ToolOutput> {
  const pdf = await PDFDocument.create();
  pdf.setProducer("FileFit");
  pdf.setCreator("FileFit");

  for (const [index, file] of files.entries()) {
    if ((await kindOf(file)) === "pdf") await appendPdf(pdf, file);
    else await appendImage(pdf, file, options);
    onProgress(index + 1);
  }

  const bytes = await pdf.save();
  const first = baseName(files[0]?.name ?? "document");
  return {
    blob: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" }),
    name: files.length === 1 ? `${first}.pdf` : `${first}-combined.pdf`,
    notes: [{ key: pdf.getPageCount() === 1 ? "page_one" : "page_other", params: { n: pdf.getPageCount() } }],
  };
}

async function appendPdf(target: PDFDocument, file: File): Promise<void> {
  let source: PDFDocument;
  try {
    source = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
  } catch (error) {
    throw new AppError(error instanceof EncryptedPDFError ? "pdfEncrypted" : "pdfInvalid");
  }
  const pages = await target.copyPages(source, source.getPageIndices());
  for (const page of pages) target.addPage(page);
}

async function appendImage(target: PDFDocument, file: File, options: PdfOptions): Promise<void> {
  const { maxSide, jpeg } = QUALITY[options.quality];
  const bitmap = await loadImage(file);
  let canvas: HTMLCanvasElement;
  try {
    const scale = scaleForMaxSide(bitmap.width, bitmap.height, maxSide);
    canvas = render(bitmap, bitmap.width * scale, bitmap.height * scale, true);
  } finally {
    bitmap.close();
  }
  const image = await target.embedJpg(await (await encode(canvas, "image/jpeg", jpeg)).arrayBuffer());

  const margin = options.margins ? MARGIN : 0;
  let pageWidth: number;
  let pageHeight: number;
  if (options.pageSize === "fit") {
    pageWidth = (canvas.width * 72) / FIT_DPI + margin * 2;
    pageHeight = (canvas.height * 72) / FIT_DPI + margin * 2;
  } else {
    const [short, long] = PAGE_SIZES[options.pageSize];
    const landscape = canvas.width > canvas.height;
    [pageWidth, pageHeight] = landscape ? [long, short] : [short, long];
  }

  const boxWidth = pageWidth - margin * 2;
  const boxHeight = pageHeight - margin * 2;
  const fit = Math.min(boxWidth / image.width, boxHeight / image.height);
  const width = image.width * fit;
  const height = image.height * fit;
  const page = target.addPage([pageWidth, pageHeight]);
  page.drawImage(image, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height });
}
