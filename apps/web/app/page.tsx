import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Plus, ShieldCheck, Tags } from "lucide-react";
import { Badge, Card } from "@bluslate/ui";
import { auth } from "@/auth";
import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { StartupCard } from "@/components/startup-card";
import { PILLARS } from "@/lib/pillars";
import { site, absoluteUrl } from "@/lib/site";
import { listStartupsForUser } from "@/lib/startups";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const PROMISES = [
  {
    icon: ShieldCheck,
    title: "You decide",
    body: "AI researches and suggests. Nothing enters your plan until you approve it, and it never contacts anyone or spends money for you.",
  },
  {
    icon: Tags,
    title: "Real and simulated, never mixed",
    body: "Every number carries a label: actual, field evidence, sourced, assumed, estimated or synthetic.",
  },
  {
    icon: Clock,
    title: "Time matters",
    body: "A clock is always running. Interviews take days, building takes weeks, and every week costs money.",
  },
];

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;
  const startups = user?.id ? await listStartupsForUser(user.id) : [];

  return (
    <>
      <JsonLd />
      {user && startups.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back{user.name ? `, ${user.name}` : ""}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Pick up where you left off, or test another idea.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {startups.map((s) => (
              <li key={s.id}>
                <StartupCard startup={s} />
              </li>
            ))}
            <li>
              <Link
                href="/startups/new"
                className="flex h-full min-h-36 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/50 bg-founder-soft/50 p-6 text-center font-semibold text-primary transition-colors hover:bg-founder-soft"
              >
                <Plus className="size-6" aria-hidden />
                Start another
              </Link>
            </li>
          </ul>
        </section>
      ) : (
        <section className="mx-auto grid max-w-6xl items-start gap-10 px-4 pb-12 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div className="lg:pt-6">
            <Badge variant="founder">Startup simulator</Badge>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Test a business idea before you spend real money on it.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Bring an idea, or just a problem that bothers you. BluSlate walks you through what a
              real founder does, runs your business in a simulated market month by month, and hands
              you a Founder Pack.
            </p>
            <ol className="mt-8 hidden flex-wrap gap-2 sm:flex" aria-label="The seven steps">
              {PILLARS.map((p) => (
                <li
                  key={p.id}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium shadow-sm"
                >
                  <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {p.number}
                  </span>
                  {p.name}
                </li>
              ))}
            </ol>
          </div>
          <OnboardingCard signedIn={Boolean(user)} knownName={user?.name} />
        </section>
      )}

      <section aria-labelledby="pillars-heading" className="border-t border-border/70 bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 id="pillars-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
            Seven steps, one journey
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Each step answers one question and works on its own. Do them in order, skip around, or
            come back and change any decision later.
          </p>
          <ol className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <li key={p.id}>
                <Card className="h-full p-4 sm:p-5">
                  <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                    {p.number}
                  </span>
                  <h3 className="mt-3 font-semibold">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.question}</p>
                </Card>
              </li>
            ))}
            <li>
              <Card className="h-full border-primary/40 bg-founder-soft p-4 sm:p-5">
                <span className="grid size-8 place-items-center rounded-lg bg-card text-primary">
                  <ArrowRight className="size-4" aria-hidden />
                </span>
                <h3 className="mt-3 font-semibold">Founder Pack</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  A pitch document, financial model, detailed report, Business Model Canvas and a
                  funding shortlist.
                </p>
              </Card>
            </li>
          </ol>
        </div>
      </section>

      <section aria-labelledby="promises-heading" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 id="promises-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
          Honest by design
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PROMISES.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="p-6">
              <Icon className="size-6 text-primary" aria-hidden />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
            </Card>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          BluSlate is a practice ground, not a prediction of success or a substitute for real
          customers or professional advice.{" "}
          <Link href="/about" className="font-medium text-primary underline underline-offset-4">
            Read how it works
          </Link>
          .
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
