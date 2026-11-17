import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name}: ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The social share image: logo, promise and the seven steps. */
export default async function OpenGraphImage() {
  const logo = await readFile(path.join(process.cwd(), "public/brand/logo-light.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  const steps = [
    "Discover",
    "Customers",
    "Market",
    "Build",
    "Set Up",
    "Go to Market",
    "Run & Grow",
  ];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(180deg, #ffffff 0%, #eaf0ff 100%)",
        color: "#0b1530",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse needs a plain img */}
      <img src={logoSrc} width={307} height={80} alt="" />
      <div
        style={{
          display: "flex",
          fontSize: 68,
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: -2,
          maxWidth: 980,
        }}
      >
        {site.tagline}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {steps.map((s, i) => (
          <div
            key={s}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 18px",
              borderRadius: 999,
              background: "#ffffff",
              border: "2px solid #dfe5f2",
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                display: "flex",
                width: 32,
                height: 32,
                borderRadius: 999,
                background: "#004bfc",
                color: "#fff",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              {i + 1}
            </span>
            {s}
          </div>
        ))}
      </div>
    </div>,
    size,
  );
}
