import { z } from "zod";

/**
 * The common output envelope every AI task returns (Appendix A.0). The API's
 * structured-output schema subset has no min/max constraints, so bounds are
 * checked after parsing (see AiTask.check).
 */
export const Envelope = <T extends z.ZodTypeAny>(items: T) =>
  z.object({
    items,
    rationale: z.string(),
    unknowns: z.array(z.string()),
    sourceIds: z.array(z.string()),
    confidence: z.enum(["low", "medium", "high"]),
  });
