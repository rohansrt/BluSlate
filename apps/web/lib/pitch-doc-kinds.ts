import type { PillarId } from "@/lib/pillars";

/**
 * The pitch documents (decision 0012). Each is made from the pillars it lists:
 * a section exists only when its pillar has work in it, so a founder who did
 * two pillars gets a document with those two sections. Safe to import on the
 * client (no server code).
 */

export const DOC_KINDS = ["summary", "deck", "plan", "canvas", "financials"] as const;
export type DocKind = (typeof DOC_KINDS)[number];

export interface DocKindInfo {
  id: DocKind;
  title: string;
  description: string;
  format: "PDF" | "XLSX";
  /** File extension for the download. */
  ext: "pdf" | "xlsx";
  /** The pillars this document draws on, in order. */
  pillars: readonly PillarId[];
}

const ALL: readonly PillarId[] = [
  "discover",
  "customers",
  "market",
  "build",
  "setup",
  "gtm",
  "run-grow",
];

export const DOC_KIND_INFO: Record<DocKind, DocKindInfo> = {
  summary: {
    id: "summary",
    title: "One-page summary",
    description: "The whole startup on one page: problem, customer, market, product, plan.",
    format: "PDF",
    ext: "pdf",
    pillars: ALL,
  },
  deck: {
    id: "deck",
    title: "Pitch deck",
    description: "Widescreen slides, one per step, ready to present or share.",
    format: "PDF",
    ext: "pdf",
    pillars: ALL,
  },
  plan: {
    id: "plan",
    title: "Business plan",
    description: "Every step in full: findings, numbers and their evidence labels.",
    format: "PDF",
    ext: "pdf",
    pillars: ALL,
  },
  canvas: {
    id: "canvas",
    title: "Business Model Canvas",
    description: "The nine boxes on one landscape page.",
    format: "PDF",
    ext: "pdf",
    pillars: ["customers", "build", "setup", "gtm"],
  },
  financials: {
    id: "financials",
    title: "Financial model",
    description: "Costs, pricing, unit economics and the month-by-month projection.",
    format: "XLSX",
    ext: "xlsx",
    pillars: ["market", "setup", "gtm", "run-grow"],
  },
};

export function isDocKind(value: string): value is DocKind {
  return (DOC_KINDS as readonly string[]).includes(value);
}
