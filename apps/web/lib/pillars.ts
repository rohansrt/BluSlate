/**
 * The seven pillars (spec §3). App-level metadata for navigation only; the
 * typed PillarModule contracts arrive in packages/contracts (S2/S3).
 */
export const PILLARS = [
  {
    id: "discover",
    folder: "01-discover",
    number: 1,
    name: "Discover",
    question: "What problem is worth solving?",
  },
  {
    id: "customers",
    folder: "02-customers",
    number: 2,
    name: "Customers",
    question: "Who has the problem, and what is the evidence?",
  },
  {
    id: "market",
    folder: "03-market",
    number: 3,
    name: "Market",
    question: "How big, reachable and contested is it?",
  },
  {
    id: "build",
    folder: "04-build",
    number: 4,
    name: "Build",
    question: "What exactly should exist?",
  },
  {
    id: "setup",
    folder: "05-setup",
    number: 5,
    name: "Set Up",
    question: "How will it be delivered?",
  },
  {
    id: "gtm",
    folder: "06-gtm",
    number: 6,
    name: "Go to Market",
    question: "Who buys first, at what price, through which channels?",
  },
  {
    id: "run-grow",
    folder: "07-run-grow",
    number: 7,
    name: "Run & Grow",
    question: "What happens over time?",
  },
] as const;

export type PillarId = (typeof PILLARS)[number]["id"];

export const PILLAR_IDS = PILLARS.map((p) => p.id) as [PillarId, ...PillarId[]];

export function pillarById(id: string) {
  return PILLARS.find((p) => p.id === id);
}
