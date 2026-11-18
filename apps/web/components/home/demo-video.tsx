import { PlayCircle } from "lucide-react";
import type { DemoVideo } from "@/lib/demo-video";

/** The demo of a founder's journey on Home (docs/decisions/0009). */
export function DemoVideoSection({ video }: { video: DemoVideo }) {
  return (
    <section
      id="demo"
      aria-labelledby="demo-heading"
      className="scroll-mt-20 border-t border-border/70"
      data-testid="demo-video"
    >
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2
          id="demo-heading"
          className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl"
        >
          <PlayCircle className="size-7 text-primary" aria-hidden /> See a founder&apos;s journey
        </h2>
        <p className="mt-2 text-muted-foreground">
          From an idea in one line to a Founder Pack, in a few minutes.
        </p>
        <div className="mt-8 aspect-video overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
          {video.kind === "youtube" ? (
            <iframe
              src={video.embedUrl}
              title="BluSlate demo: a founder's journey"
              className="size-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <video
              src={video.src}
              controls
              preload="metadata"
              playsInline
              className="size-full bg-black"
              aria-label="BluSlate demo: a founder's journey"
            />
          )}
        </div>
      </div>
    </section>
  );
}
