/**
 * The seven pillars (spec §3, §3.1; deliverables in Part B §B4 wording).
 * Pillar metadata used by navigation, the city and each pillar's module.
 */
export const PILLAR_IDS = [
  "discover",
  "customers",
  "market",
  "build",
  "setup",
  "gtm",
  "run-grow",
] as const;

export type PillarId = (typeof PILLAR_IDS)[number];

export interface PillarInfo {
  id: PillarId;
  /** Folder under pillars/, e.g. "01-discover". */
  folder: string;
  /** Workspace package name, e.g. "@bluslate/pillar-discover". */
  packageName: string;
  number: number;
  name: string;
  question: string;
  /** What the founder takes away (Part B §B4). */
  deliverable: string;
}

export const PILLARS: readonly PillarInfo[] = [
  {
    id: "discover",
    folder: "01-discover",
    packageName: "@bluslate/pillar-discover",
    number: 1,
    name: "Discover",
    question: "What problem is worth solving?",
    deliverable: "A one-page problem brief",
  },
  {
    id: "customers",
    folder: "02-customers",
    packageName: "@bluslate/pillar-customers",
    number: 2,
    name: "Customers",
    question: "Who has the problem, and what is the evidence?",
    deliverable: "Customer needs, ranked, with evidence",
  },
  {
    id: "market",
    folder: "03-market",
    packageName: "@bluslate/pillar-market",
    number: 3,
    name: "Market",
    question: "How big, reachable and contested is it?",
    deliverable: "Market size and a competitor map",
  },
  {
    id: "build",
    folder: "04-build",
    packageName: "@bluslate/pillar-build",
    number: 4,
    name: "Build",
    question: "What exactly should exist?",
    deliverable: "A prioritised first version and business model",
  },
  {
    id: "setup",
    folder: "05-setup",
    packageName: "@bluslate/pillar-setup",
    number: 5,
    name: "Set Up",
    question: "How will it be delivered?",
    deliverable: "An operating plan and cost base",
  },
  {
    id: "gtm",
    folder: "06-gtm",
    packageName: "@bluslate/pillar-gtm",
    number: 6,
    name: "Go to Market",
    question: "Who buys first, at what price, through which channels?",
    deliverable: "A launch plan and sales funnel",
  },
  {
    id: "run-grow",
    folder: "07-run-grow",
    packageName: "@bluslate/pillar-run-grow",
    number: 7,
    name: "Run & Grow",
    question: "What happens over time?",
    deliverable: "A live control room and what-if scenarios",
  },
];

export function isPillarId(value: string): value is PillarId {
  return (PILLAR_IDS as readonly string[]).includes(value);
}

export function pillarInfo(id: PillarId): PillarInfo {
  const info = PILLARS.find((p) => p.id === id);
  if (!info) throw new Error(`Unknown pillar: ${id}`);
  return info;
}
