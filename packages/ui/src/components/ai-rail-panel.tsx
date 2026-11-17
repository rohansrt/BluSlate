import * as React from "react";
import { Compass, Lightbulb, Loader2, ShieldAlert, Sparkles } from "lucide-react";
import type { EvidenceLabel } from "@bluslate/contracts";
import { Card } from "./card";
import { EvidenceBadge } from "./evidence-badge";

export type AiRailState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "unavailable"; message: string }
  | {
      kind: "guide";
      concept: string;
      example: string;
      questions: string[];
      label: EvidenceLabel;
    };

/**
 * The AI rail (spec §6.1): explains, guides and flags. Its output is advice
 * shown beside the question; it never fills in or publishes an answer.
 */
export function AiRailPanel({ state }: { state: AiRailState }) {
  return (
    <aside aria-label="AI helper" className="space-y-3" data-testid="ai-rail">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Sparkles className="size-3.5" aria-hidden /> AI helper
      </p>

      {state.kind === "loading" && (
        <Card
          className="flex items-center gap-2 p-4 text-sm text-muted-foreground shadow-none"
          role="status"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden /> Thinking it through…
        </Card>
      )}

      {state.kind === "unavailable" && (
        <Card className="border-dashed p-4 text-sm shadow-none" role="status">
          <p className="font-semibold">The AI helper isn&apos;t available</p>
          <p className="mt-1 text-muted-foreground">{state.message}</p>
          <p className="mt-2 text-muted-foreground">
            You can still answer with &ldquo;I&apos;ll decide&rdquo;.
          </p>
        </Card>
      )}

      {state.kind === "guide" && (
        <Card className="border-2 border-dashed border-ai/60 bg-ai-soft/40 p-4 shadow-none">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <Compass className="size-4 text-ai" aria-hidden /> Guide me
            </p>
            <EvidenceBadge label={state.label} />
          </div>
          <p className="mt-2 text-sm">{state.concept}</p>
          <p className="mt-2 text-sm italic text-muted-foreground">{state.example}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Think about
          </p>
          <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm">
            {state.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ol>
        </Card>
      )}

      {state.kind === "idle" && (
        <>
          {[
            {
              icon: Compass,
              title: "Guide me",
              body: "Choose “Guide me” above for a short explanation and questions.",
            },
            {
              icon: ShieldAlert,
              title: "Reality check",
              body: "Flags problems, like a price below cost.",
            },
            {
              icon: Lightbulb,
              title: "Next best action",
              body: "Points to the most useful thing to do next.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <Card key={title} className="border-dashed border-ai/60 bg-ai-soft/40 p-4 shadow-none">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="size-4 text-ai" aria-hidden /> {title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{body}</p>
            </Card>
          ))}
        </>
      )}

      <p className="text-xs text-muted-foreground">
        AI suggestions always arrive as drafts. Nothing enters your plan until you approve it.
      </p>
    </aside>
  );
}
