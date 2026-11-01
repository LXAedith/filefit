export type ErrorKey = "unsupported" | "decode" | "pdfEncrypted" | "pdfInvalid" | "generic";

/** An error whose message is a translation key, so the UI can explain it in the user's language. */
export class AppError extends Error {
  constructor(readonly key: ErrorKey) {
    super(key);
  }
}

export function errorKey(error: unknown): ErrorKey {
  return error instanceof AppError ? error.key : "generic";
}
