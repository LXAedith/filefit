import type { Key } from "../i18n";

export interface Note {
  key: Key;
  params?: Record<string, string | number>;
}

export interface ToolOutput {
  blob: Blob;
  name: string;
  notes: Note[];
}
