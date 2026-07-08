// Shared client-side shapes for the Book UI. These mirror the JSON the book API
// routes return (src/app/api/book/**), kept minimal — only the fields the UI reads.

export type BookStatus = "draft" | "authoring" | "complete" | "failed";

export interface BookPlanChapter {
  index: number;
  intent: string;
  beats?: string[];
}

export interface Book {
  _id: string;
  title: string;
  subtitle?: string;
  author?: string;
  kind: "fiction" | "nonfiction";
  sourceKind: "outline" | "partial";
  status: BookStatus;
  plan: BookPlanChapter[];
}

export interface Chapter {
  _id: string;
  index: number;
  intent: string;
  content: string;
  status: "accepted" | "failed";
  attempts: number;
}

export interface ProgressItem {
  index: number;
  status: "accepted" | "failed";
  attempt: number;
}

export interface RunProgress {
  total: number;
  accepted: number;
  failed: number;
  lastIndex: number | null;
  perIndex: ProgressItem[];
}

export type ByokProvider = "openai" | "anthropic";

export const BYOK_PROVIDERS: { id: ByokProvider; name: string }[] = [
  { id: "openai", name: "OpenAI" },
  { id: "anthropic", name: "Anthropic" },
];

/** Terminal run states — polling stops when the book reaches one of these. */
export function isTerminalStatus(status: BookStatus): boolean {
  return status === "complete" || status === "failed";
}
