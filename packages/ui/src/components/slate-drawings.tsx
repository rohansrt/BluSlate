import * as React from "react";
import type { PillarId } from "@bluslate/contracts";
import { cn } from "../cn";

/**
 * Chalk drawings on a blue slate: BluSlate's illustration style for the seven
 * steps. Each drawing is a set of strokes in a 64 × 64 box. The rough chalk
 * edge comes from the shared `#bluslate-chalk` filter (render <ChalkDefs />
 * once per page, e.g. in the root layout).
 */

type Drawing = React.ReactNode;

const DRAWINGS: Record<PillarId | "pack" | "rocket", Drawing> = {
  // A light bulb with a question mark: finding the real problem.
  discover: (
    <>
      <path d="M32 13a13 13 0 0 1 7.6 23.5c-1.5 1.1-2.4 2.9-2.4 4.8V44H26.8v-2.7c0-1.9-.9-3.7-2.4-4.8A13 13 0 0 1 32 13Z" />
      <path d="M27 49h10M28.5 53.5h7" />
      <path d="M28.6 24.6a3.6 3.6 0 1 1 5.1 3.3c-1 .5-1.7 1.4-1.7 2.5v1.2M32 35.6v.2" />
      <path d="M32 4.5v3.5M50.5 12.5l-2.5 2.5M13.5 12.5l2.5 2.5M57 28h-3.5M7 28h3.5" />
    </>
  ),
  // Two people and a speech bubble: talking to customers.
  customers: (
    <>
      <circle cx="22" cy="30" r="6" />
      <path d="M10.5 53c0-7 5-12.5 11.5-12.5S33.5 46 33.5 53" />
      <circle cx="42" cy="33" r="5" />
      <path d="M35.5 53c.7-5.7 3.6-9.8 7.4-9.8s7.4 4 8.1 9.8" />
      <path d="M38 8h15a4 4 0 0 1 4 4v6.5a4 4 0 0 1-4 4h-7.5L40.5 27v-4.5H38a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z" />
      <path d="M41.5 15.3h.1M45.5 15.3h.1M49.5 15.3h.1" />
    </>
  ),
  // A pie chart with a slice pulled out, and a magnifier: sizing the market.
  market: (
    <>
      <path d="M27 17A14.5 14.5 0 1 0 41.5 31.5H27Z" />
      <path d="M31.5 12.5A14.5 14.5 0 0 1 46 27H31.5Z" />
      <circle cx="44.5" cy="45.5" r="6.5" />
      <path d="M49.3 50.3l6.2 6.2" />
    </>
  ),
  // A phone wireframe and a gear: shaping the first version.
  build: (
    <>
      <rect x="13" y="9" width="24" height="44" rx="3.5" />
      <path d="M18 17h14M18 23h9M18 29h14M18 35h6M23 47.5h4" />
      <circle cx="46" cy="41" r="5" />
      <path d="M46 31.5v3M46 47.5v3M36.5 41h3M52.5 41h3M39.3 34.3l2.1 2.1M50.6 45.6l2.1 2.1M52.7 34.3l-2.1 2.1M41.4 45.6l-2.1 2.1" />
    </>
  ),
  // A delivery truck with a parcel: setting up how it's delivered.
  setup: (
    <>
      <path d="M6 22h28v20H6Z" />
      <path d="M34 28h9.5l7.5 7.5V42H34" />
      <path d="M38 31.5h4.5l3.5 3.5h-8Z" />
      <circle cx="15" cy="44.5" r="4" />
      <circle cx="43" cy="44.5" r="4" />
      <path d="M4 52h56" />
      <path d="M13 10h12v9H13ZM19 10v3.5" />
    </>
  ),
  // A megaphone with sound waves: going to market.
  gtm: (
    <>
      <path d="M10 27h6v11h-6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
      <path d="M16 27l21-10v31l-21-10" />
      <path d="M19.5 38.5l3 11h5.5l-2.5-10" />
      <path d="M43 25c2.8 3 2.8 12 0 15M48.5 20c5 5.5 5 19.5 0 25" />
    </>
  ),
  // A rising line with an arrow: running and growing over time.
  "run-grow": (
    <>
      <path d="M10 9v45h45" />
      <path d="M16 44l10-10 8 6.5 16-18" />
      <path d="M43.5 22.5H50V29" />
      <path d="M20 54v-4M30 54v-7M40 54v-9M50 54v-13" strokeOpacity={0.45} />
    </>
  ),
  // A document with a folded corner: the Founder Pack.
  pack: (
    <>
      <path d="M19 9h18l9 9v37H19Z" />
      <path d="M37 9v9h9" />
      <path d="M24.5 27h16M24.5 33h16M24.5 39h10" />
      <path d="M41 45.5l1.6 3.2 3.4.5-2.5 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4-2.5-2.4 3.4-.5Z" />
    </>
  ),
  // A rocket lifting off: the BluSlate mark, drawn in chalk.
  rocket: (
    <>
      <path d="M47 11c-10.5 1.6-19 9.5-23 20.5l8.5 8.5c11-4 18.9-12.5 20.5-23 .3-2.4-.1-4.6-1.5-6s-3.6-1.8-4.5 0Z" />
      <circle cx="41" cy="23" r="3.5" />
      <path d="M24.5 30l-8 .8-5 6.7 9.3-.8M34 39.5l-.8 8-6.7 5 .8-9.3" />
      <path d="M22 42c-3.4 1.2-5.6 4.3-6.5 9 4.7-.9 7.8-3.1 9-6.5" />
    </>
  ),
};

export type SlateDrawingName = keyof typeof DRAWINGS;

/** The strokes of one drawing, for use inside your own <svg viewBox="0 0 64 64">. */
export function SlateDrawingStrokes({ name }: { name: SlateDrawingName }) {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      filter="url(#bluslate-chalk)"
    >
      {DRAWINGS[name]}
    </g>
  );
}

/** A drawing on its own, sized by the caller (color = chalk colour). */
export function SlateDrawing({ name, className }: { name: SlateDrawingName; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("size-10", className)}>
      <SlateDrawingStrokes name={name} />
    </svg>
  );
}

const SLATE_SIZES = {
  sm: { box: "size-12 rounded-xl", art: "size-8" },
  md: { box: "size-16 rounded-2xl", art: "size-11" },
  lg: { box: "size-20 rounded-[1.4rem]", art: "size-14" },
  xl: { box: "size-24 rounded-[1.7rem]", art: "size-16" },
} as const;

/** A chalk drawing on a small blue slate, with an optional step number. */
export function Slate({
  name,
  number,
  size = "md",
  selected = false,
  className,
}: {
  name: SlateDrawingName;
  number?: number;
  size?: keyof typeof SLATE_SIZES;
  selected?: boolean;
  className?: string;
}) {
  const s = SLATE_SIZES[size];
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center text-white/95 transition-transform duration-300",
        "bg-[radial-gradient(120%_90%_at_20%_10%,#3f7bff_0%,#1447e6_45%,#0b2c9a_100%)]",
        "shadow-[inset_0_0_0_3px_rgba(255,255,255,0.14),inset_0_-8px_16px_rgba(0,0,0,0.18),0_10px_24px_-10px_rgba(0,75,252,0.65)]",
        selected &&
          "scale-110 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.35),0_0_0_4px_var(--background),0_0_0_7px_var(--founder),0_16px_30px_-12px_rgba(0,75,252,0.8)]",
        s.box,
        className,
      )}
    >
      <SlateDrawing name={name} className={s.art} />
      {number !== undefined && (
        <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full border-2 border-background bg-foreground text-[10px] font-bold text-background">
          {number}
        </span>
      )}
    </span>
  );
}

/**
 * The chalk filter the drawings reference. Render once per page (the root
 * layout does). It is a zero-size SVG rather than `display: none`, which
 * would stop browsers applying the filter.
 */
export function ChalkDefs() {
  return (
    <svg
      aria-hidden
      width="0"
      height="0"
      className="pointer-events-none absolute"
      focusable="false"
    >
      <defs>
        <filter id="bluslate-chalk" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
