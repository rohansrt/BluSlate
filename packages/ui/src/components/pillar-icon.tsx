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

/** The blue tile with a pillar icon and a small step number. */
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
  const box = { sm: "size-9 rounded-lg", md: "size-12 rounded-xl", lg: "size-14 rounded-2xl" }[
    size
  ];
  const icon = { sm: "size-4", md: "size-5", lg: "size-6" }[size];
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center bg-gradient-to-br from-[#2f7bff] to-[var(--founder)] text-white shadow-md shadow-primary/25",
        box,
        className,
      )}
    >
      <PillarIcon id={id} className={icon} />
      {number !== undefined && (
        <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border-2 border-card bg-foreground text-[10px] font-bold text-background">
          {number}
        </span>
      )}
    </span>
  );
}
