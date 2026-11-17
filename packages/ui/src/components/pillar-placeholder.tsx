import * as React from "react";
import { BookOpen } from "lucide-react";
import type { EntityType, PillarId } from "@bluslate/contracts";
import { Badge } from "./badge";
import { Card } from "./card";
import { PillarTile } from "./pillar-icon";

export interface PillarPlaceholderProps {
  id: PillarId;
  number: number;
  name: string;
  question: string;
  deliverable: string;
  reads: readonly EntityType[];
  writes: readonly EntityType[];
}

/**
 * The skeleton screen every pillar shows until its Build step (S2): the
 * pillar's question, what it reads and what it alone writes.
 */
export function PillarPlaceholder({
  id,
  number,
  name,
  question,
  deliverable,
  reads,
  writes,
}: PillarPlaceholderProps) {
  return (
    <div className="space-y-6" data-testid={`pillar-placeholder-${id}`}>
      <div className="flex items-start gap-4">
        <PillarTile id={id} size="lg" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Step {number}
          </p>
          <h2 className="text-2xl font-bold tracking-tight">{question}</h2>
          <p className="mt-1 text-muted-foreground">
            {name} gives you: <span className="font-medium text-foreground">{deliverable}</span>
          </p>
        </div>
      </div>

      <Card className="border-dashed p-5">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-muted-foreground" aria-hidden />
          <p className="font-semibold">This step is being built</p>
          <Badge variant="review">Coming soon</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          The full {name} workspace arrives after it has been defined and signed off. Until then,
          answer the first question above.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold">Reads</p>
          <p className="text-xs text-muted-foreground">
            Uses these from other steps when they exist. It works without them too.
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`${name} reads`}>
            {reads.map((t) => (
              <li key={t}>
                <Badge variant="neutral">{t}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold">Writes</p>
          <p className="text-xs text-muted-foreground">
            Only {name} can publish these, after your approval.
          </p>
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`${name} writes`}>
            {writes.map((t) => (
              <li key={t}>
                <Badge variant="founder">{t}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
