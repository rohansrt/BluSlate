import { describe, expect, it } from "vitest";
import { parseDemoVideo, youtubeId } from "@/lib/demo-video";

describe("demo video", () => {
  it("is hidden until a URL is set", () => {
    expect(parseDemoVideo(undefined)).toBeNull();
    expect(parseDemoVideo("  ")).toBeNull();
  });

  it("reads the common YouTube link shapes", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ?si=abc",
      "https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=10",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://youtube.com/shorts/dQw4w9WgXcQ",
    ]) {
      expect(youtubeId(url), url).toBe("dQw4w9WgXcQ");
    }
    expect(youtubeId("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
  });

  it("embeds YouTube in privacy-enhanced mode", () => {
    expect(parseDemoVideo("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0",
    });
  });

  it("plays a file from the site or an https URL, and nothing else", () => {
    expect(parseDemoVideo("/demo/bluslate-demo.mp4")).toEqual({
      kind: "file",
      src: "/demo/bluslate-demo.mp4",
    });
    expect(parseDemoVideo("https://cdn.example.com/demo.mp4")?.kind).toBe("file");
    expect(parseDemoVideo("http://insecure.example.com/demo.mp4")).toBeNull();
    expect(parseDemoVideo("//evil.example.com/demo.mp4")).toBeNull();
    expect(parseDemoVideo("javascript:alert(1)")).toBeNull();
  });
});
