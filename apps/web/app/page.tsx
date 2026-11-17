import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ShieldCheck, Tags } from "lucide-react";
import { auth } from "@/auth";
import { HeroArt } from "@/components/home/hero-art";
import { StepsCycle } from "@/components/home/steps-cycle";
import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { ContinueCard } from "@/components/home/continue-card";
import { site, absoluteUrl } from "@/lib/site";
import { listStartupsForUser } from "@/lib/startups";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const PROMISES = [
  {
    icon: ShieldCheck,
    title: "You decide",
    body: "AI suggests. Nothing enters your plan without your yes.",
  },
  { icon: Tags, title: "Real vs simulated", body: "Every number says where it came from." },
  { icon: Clock, title: "Time matters", body: "A clock runs, and every week costs money." },
];

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;
  const startups = user?.id ? await listStartupsForUser(user.id) : [];

  return (
    <>
      <JsonLd />
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(70%_60%_at_20%_0%,var(--founder-soft),transparent_70%)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.15rem]">
              Got a business idea?
              <span className="block text-primary">Will it work?</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-muted-foreground">
              Test it step by step, before you spend real money.
            </p>
            <div className="mt-10">
              <HeroArt />
            </div>
          </div>
          {user && startups.length > 0 ? (
            <ContinueCard name={user.name ?? null} startups={startups} />
          ) : (
            <OnboardingCard
              signedIn={Boolean(user)}
              knownName={user?.name}
              className="lg:self-center"
            />
          )}
        </div>
      </section>

      <section aria-labelledby="steps-heading" className="border-t border-border/70 bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="steps-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Seven steps, one loop
          </h2>
          <p className="mt-2 text-muted-foreground">Tap a step to see what it does.</p>
          <div className="mt-10">
            <StepsCycle />
          </div>
        </div>
      </section>

      <section aria-labelledby="promises-heading" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 id="promises-heading" className="sr-only">
          Our promises
        </h2>
        <ul className="grid gap-6 sm:grid-cols-3">
          {PROMISES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-founder-soft text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-muted-foreground">
          Practice, not a prediction.{" "}
          <Link href="/about" className="font-medium text-primary underline underline-offset-4">
            How BluSlate works
          </Link>
        </p>
      </section>
    </>
  );
}

function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: site.name,
        url: absoluteUrl("/"),
        description: site.description,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        inLanguage: "en",
      },
      {
        "@type": "Organization",
        name: site.name,
        url: absoluteUrl("/"),
        logo: absoluteUrl("/brand/icon-512.png"),
        email: site.contactEmail,
        parentOrganization: {
          "@type": "Organization",
          name: site.ecosystem.name,
          url: site.ecosystem.url,
        },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      // JSON-LD must be inline; the content is static and contains no user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
