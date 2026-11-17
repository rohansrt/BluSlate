import type { Metadata, Viewport } from "next";
import { Caveat, Inter } from "next/font/google";
import { ChalkDefs } from "@bluslate/ui";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Chalk handwriting for illustrations only.
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  display: "swap",
  weight: ["600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name}: test a business idea before you spend real money`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "startup simulator",
    "test a business idea",
    "business idea validation",
    "customer interviews",
    "market sizing",
    "TAM SAM SOM",
    "go to market",
    "founder pack",
    "pitch document",
    "financial model",
    "student founders",
    "India startups",
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name}: test a business idea before you spend real money`,
    description: site.description,
    url: "/",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name}: test a business idea before you spend real money`,
    description: site.description,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fe" },
    { media: "(prefers-color-scheme: dark)", color: "#010826" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${caveat.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <ChalkDefs />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
