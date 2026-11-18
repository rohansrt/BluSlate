/**
 * The demo video on Home (docs/decisions/0009) is set with
 * NEXT_PUBLIC_DEMO_VIDEO_URL: a YouTube link, or a video file such as
 * /demo/bluslate-demo.mp4 (put it in apps/web/public/demo/).
 */
export type DemoVideo = { kind: "youtube"; embedUrl: string } | { kind: "file"; src: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeId(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const [, kind, value] = url.pathname.split("/");
      if (kind === "embed" || kind === "shorts" || kind === "live") id = value ?? null;
    }
  }
  return id && YOUTUBE_ID.test(id) ? id : null;
}

/** Null when no video is set, or the value isn't a YouTube link, a site path or an https file. */
export function parseDemoVideo(raw: string | null | undefined): DemoVideo | null {
  const value = raw?.trim();
  if (!value) return null;
  const id = youtubeId(value);
  // Privacy-enhanced mode: YouTube stores nothing until the video is played.
  if (id)
    return { kind: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0` };
  if (value.startsWith("/") && !value.startsWith("//")) return { kind: "file", src: value };
  if (value.startsWith("https://")) return { kind: "file", src: value };
  return null;
}
