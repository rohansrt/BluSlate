// `pnpm eval <pillar>` runs the AI evals for one pillar (packages/ai/evals).
// The AI gateway and evals arrive in S3 and the pillar steps; until then this is a stub.
const pillar = process.argv[2];
console.log(
  `AI evals${pillar ? ` for "${pillar}"` : ""} are not built yet. They arrive with the AI gateway (S3) and each pillar's Build step.`,
);
