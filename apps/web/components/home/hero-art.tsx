import { CheckCircle2, MessageCircle, Rocket } from "lucide-react";
import { SlateDrawingStrokes, type SlateDrawingName } from "@bluslate/ui";

/**
 * The hero image: a blue slate board with the journey sketched in chalk, from
 * a question to a launch. Original artwork drawn in SVG; the chalk edge
 * comes from the shared #bluslate-chalk filter.
 *
 * The chalk rocket floats along the route from the first sketch to the launch
 * spot, drawing its chalk trail as it goes, then fades and starts again. It is
 * plain SVG animation (no JavaScript). With "reduce motion" on, the rocket
 * stays still at the end of the route instead.
 */

// Sketches on the board: drawing, x, y, size (in board units).
const SKETCHES: [SlateDrawingName, number, number, number][] = [
  ["discover", 70, 170, 92],
  ["customers", 196, 220, 92],
  ["market", 318, 168, 88],
];
// Where the rocket rests at the end (and stays, with reduced motion).
const ROCKET_REST: [number, number, number] = [432, 92, 104];

// The chalk route joining the sketches, ending in an arrow at the rocket.
const ROUTE = "M120 290 C 160 330, 210 330, 240 318 S 320 290, 360 262 S 430 210, 470 200";
// The rocket's flight: the route, then a short lift into its resting spot.
const FLIGHT = `${ROUTE} Q 486 190, 484 150`;

// One loop: wait, fly (eased), hold at the top, fade. Shared so the trail and rocket stay in step.
const LOOP = "9s";
const KEY_TIMES = "0;0.06;0.7;1";
const FLY_SPLINES = "0 0 1 1;0.45 0 0.3 1;0 0 1 1";
const ROCKET_SIZE = 84;

export function HeroArt() {
  return (
    <div className="relative mx-auto w-full max-w-[36rem]" aria-hidden>
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-[radial-gradient(60%_60%_at_60%_40%,rgba(0,75,252,0.18),transparent_70%)]" />
      <svg viewBox="0 0 600 440" className="w-full drop-shadow-[0_30px_40px_rgba(0,40,140,0.28)]">
        <defs>
          <linearGradient id="board" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#2a64f5" />
            <stop offset="0.5" stopColor="#1442d6" />
            <stop offset="1" stopColor="#0a2a96" />
          </linearGradient>
          <radialGradient id="smudge" cx="0.3" cy="0.25" r="0.7">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <marker
            id="chalk-arrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
          >
            <path
              d="M1 1 L9 5 L1 9"
              fill="none"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>

        <g transform="rotate(-2.5 300 220)">
          {/* Frame and board */}
          <rect x="18" y="22" width="564" height="372" rx="30" fill="#0a2378" />
          <rect x="30" y="34" width="540" height="348" rx="22" fill="url(#board)" />
          <rect x="30" y="34" width="540" height="348" rx="22" fill="url(#smudge)" />
          {/* Faint rubbed-out chalk */}
          <path
            d="M70 110 q60 -16 130 0 M380 330 q50 10 120 -6 M90 350 q30 -8 70 0"
            stroke="white"
            strokeOpacity="0.08"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />

          {/* Hook, in chalk handwriting */}
          <text
            x="62"
            y="98"
            fill="white"
            fillOpacity="0.95"
            fontSize="50"
            filter="url(#bluslate-chalk)"
            style={{ fontFamily: "var(--font-hand), cursive" }}
          >
            Will it work?
          </text>
          <path
            d="M64 112 q90 10 200 -2"
            stroke="white"
            strokeOpacity="0.8"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            filter="url(#bluslate-chalk)"
          />

          {/* The route and the sketches */}
          <path
            d={ROUTE}
            fill="none"
            stroke="white"
            strokeOpacity="0.75"
            strokeWidth="3"
            strokeDasharray="10 11"
            strokeLinecap="round"
            markerEnd="url(#chalk-arrow)"
            filter="url(#bluslate-chalk)"
          />
          {SKETCHES.map(([name, x, y, size]) => (
            <svg
              key={name}
              x={x}
              y={y}
              width={size}
              height={size}
              viewBox="0 0 64 64"
              color="white"
              overflow="visible"
            >
              <SlateDrawingStrokes name={name} />
            </svg>
          ))}

          {/* Reduced motion: the rocket waits at the end of the route. */}
          <g className="hidden motion-reduce:inline">
            <svg
              x={ROCKET_REST[0]}
              y={ROCKET_REST[1]}
              width={ROCKET_REST[2]}
              height={ROCKET_REST[2]}
              viewBox="0 0 64 64"
              color="white"
              overflow="visible"
            >
              <SlateDrawingStrokes name="rocket" />
            </svg>
          </g>

          {/* The flight: a chalk trail drawn behind a floating rocket. */}
          <g className="motion-reduce:hidden" data-testid="hero-rocket">
            <path
              d={FLIGHT}
              pathLength={1}
              fill="none"
              stroke="white"
              strokeOpacity="0.9"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeDasharray="1 1"
              strokeDashoffset="1"
              filter="url(#bluslate-chalk)"
            >
              <animate
                attributeName="stroke-dashoffset"
                values="1;1;0;0"
                keyTimes={KEY_TIMES}
                calcMode="spline"
                keySplines={FLY_SPLINES}
                dur={LOOP}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="1;1;1;0"
                keyTimes="0;0.06;0.9;1"
                dur={LOOP}
                repeatCount="indefinite"
              />
            </path>
            <g opacity="0">
              <animateMotion
                path={FLIGHT}
                keyPoints="0;0;1;1"
                keyTimes={KEY_TIMES}
                calcMode="spline"
                keySplines={FLY_SPLINES}
                dur={LOOP}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;1;1;0"
                keyTimes="0;0.06;0.9;1"
                dur={LOOP}
                repeatCount="indefinite"
              />
              {/* A gentle float while it flies. */}
              <g>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0 0;0 -6;0 0"
                  dur="1.8s"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
                  repeatCount="indefinite"
                />
                <svg
                  x={-ROCKET_SIZE / 2}
                  y={-ROCKET_SIZE / 2}
                  width={ROCKET_SIZE}
                  height={ROCKET_SIZE}
                  viewBox="0 0 64 64"
                  color="white"
                  overflow="visible"
                >
                  <SlateDrawingStrokes name="rocket" />
                  {/* Chalk exhaust, flickering. */}
                  <g
                    stroke="white"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    fill="none"
                    filter="url(#bluslate-chalk)"
                  >
                    <path d="M13 53 l-7 7 M17 57 l-3 6 M9 49 l-6 2">
                      <animate
                        attributeName="opacity"
                        values="0.95;0.25;0.8;0.35;0.95"
                        dur="0.6s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </g>
                </svg>
              </g>
            </g>
          </g>

          {/* Chalk tray */}
          <rect x="120" y="382" width="360" height="12" rx="6" fill="#071b5e" />
          <rect x="170" y="376" width="44" height="9" rx="4.5" fill="#f4f7ff" />
          <rect x="226" y="378" width="26" height="8" rx="4" fill="#ffd2a1" />
        </g>
      </svg>

      {/* Floating notes: what you walk away with. No numbers, nothing simulated. */}
      <div className="absolute -left-2 top-[58%] flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold shadow-lg sm:-left-6 sm:text-sm">
        <CheckCircle2 className="size-4 text-actual" /> Problem brief
      </div>
      <div className="absolute -right-1 top-[6%] flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold shadow-lg sm:-right-4 sm:text-sm">
        <MessageCircle className="size-4 text-primary" /> Customer interviews
      </div>
      <div className="absolute bottom-[2%] right-[8%] flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold shadow-lg sm:text-sm">
        <Rocket className="size-4 text-enabler" /> Launch plan
      </div>
    </div>
  );
}
