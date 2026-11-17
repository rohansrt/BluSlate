import * as React from "react";
import {
  ChartPie,
  Hammer,
  Lightbulb,
  Megaphone,
  Package,
  TrendingUp,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { PillarId } from "@bluslate/contracts";
import { cn } from "../cn";
import { Slate } from "./slate-drawings";

/** One icon per pillar, used everywhere the seven steps appear. */
export const PILLAR_ICONS: Record<PillarId, LucideIcon> = {
  discover: Lightbulb,
  customers: Users,
  market: ChartPie,
  build: Hammer,
  setup: Truck,
  gtm: Megaphone,
  "run-grow": TrendingUp,
};

export const FounderPackIcon = Package;

export function PillarIcon({
  id,
  className,
  ...props
}: { id: PillarId } & React.ComponentProps<LucideIcon>) {
  const Icon = PILLAR_ICONS[id];
  return <Icon aria-hidden className={cn("size-5", className)} {...props} />;
}

/** The blue slate with the pillar's chalk drawing and an optional step number. */
export function PillarTile({
  id,
  number,
  size = "md",
  className,
}: {
  id: PillarId;
  number?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return <Slate name={id} number={number} size={size} className={className} />;
}
