import type { Metadata } from "next";
import Link from "next/link";
import { Badge, type BadgeProps } from "@bluslate/ui";
import { PILLARS } from "@/lib/pillars";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "What BluSlate is, who it's for, the seven steps, how the simulated market works, how we use AI, how every number is labelled, and how we keep your idea private.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About BluSlate", url: "/about" },
};

const SECTIONS = [
  ["what", "What BluSlate is"],
  ["who", "Who it's for"],
  ["steps", "The seven steps"],
  ["journey", "How a journey works"],
  ["ai", "How we use AI"],
  ["labels", "Real vs simulated"],
  ["privacy", "Privacy"],
  ["yoppi", "Part of YOPPI"],
  ["contact", "Contact"],
] as const;

const PILLAR_ROWS = PILLARS.map((p) => [p.name, p.question, p.deliverable] as const);

const LABELS: { badge: string; variant: BadgeProps["variant"]; example: string; use: string }[] = [
  {
    badge: "ACTUAL",
    variant: "actual",
    example: "Real sales or costs imported from a running business",
    use: "History. Locked, never changed.",
  },
  {
    badge: "FIELD",
    variant: "founder",
    example: "A real interview or survey, with consent",
    use: "Evidence about customers",
  },
  {
    badge: "SOURCED",
    variant: "founder",
    example: "An official statistic or a dated competitor price",
    use: "Context, always shown with its source and date",
  },
  {
    badge: "ASSUMED",
    variant: "neutral",
    example: "“15% of trial users will pay”",
    use: "A guess to test. We show how much your results depend on it.",
  },
  {
    badge: "ESTIMATE",
    variant: "review",
    example: "A market size worked out from your inputs",
    use: "Always shown with its formula and range",
  },
  {
    badge: "SYNTHETIC",
    variant: "synthetic",
    example: "A simulated customer's quote, a simulated sale or supplier quote",
    use: "Practice and what-ifs only. Never proof.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[220px_1fr]">
      <nav aria-label="On this page" className="hidden lg:block">
        <div className="sticky top-24">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            On this page
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {SECTIONS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-muted-foreground hover:text-foreground">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <article className="prose-page max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          About BluSlate
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
          A safe place to test a business idea.
        </h1>
        <p className="text-lg text-muted-foreground">
          BluSlate walks you through what a real founder does, runs your idea in a simulated market,
          and hands you a Founder Pack. All before you spend real money.
        </p>

        <h2 id="what">What BluSlate is</h2>
        <p>
          BluSlate is a website where anyone can test a business idea before spending real money on
          it. Bring an idea (an app, a shop, a product, a service) or just a problem that bothers
          you.
        </p>
        <p>
          You work through the same steps a real founder goes through: understanding the problem,
          talking to customers, sizing the market, deciding what to build, setting up suppliers and
          a team, and choosing a price and a launch plan. Then BluSlate runs your business in a
          simulated market, month by month, so you can see what might happen. Change your price,
          your marketing or your supplier at any time and watch the effects play out.
        </p>
        <p>
          <strong>What it is not:</strong> a business-plan writer, a prediction of success, or a
          replacement for talking to real customers or getting legal and financial advice.
        </p>

        <h2 id="who">Who it&apos;s for</h2>
        <ul>
          <li>
            <strong>College students</strong> who want to understand how a startup really works.
          </li>
          <li>
            <strong>First-time founders</strong> who want to test an idea before quitting a job or
            raising money.
          </li>
          <li>
            <strong>Business owners</strong> who want to try a new product, shop or location on
            paper first.
          </li>
          <li>
            <strong>Incubators and mentors</strong> who support several startups at once.
          </li>
        </ul>

        <h2 id="steps">The seven steps</h2>
        <p>
          Each step answers one question and works on its own, so you can use one tool or the whole
          journey. Each step owns its own information: others can read it, but only that step can
          change it.
        </p>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th scope="col">Step</th>
                <th scope="col">The question</th>
                <th scope="col">What comes out</th>
              </tr>
            </thead>
            <tbody>
              {PILLAR_ROWS.map(([name, q, out], i) => (
                <tr key={name}>
                  <td className="whitespace-nowrap font-semibold text-foreground">
                    {i + 1} · {name}
                  </td>
                  <td>{q}</td>
                  <td>{out}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Every question offers three ways to answer: <strong>I&apos;ll decide</strong> (type, pick
          or upload it yourself), <strong>Guide me</strong> (a short explanation with an example and
          a few questions, then you decide), and <strong>Research &amp; suggest</strong> (two to
          four options with sources, pros and risks, which you pick, edit or mix).
        </p>

        <h2 id="journey">How a journey works</h2>
        <h3>The clock</h3>
        <p>
          A simulated clock is always visible. Before launch, time moves when you act: an interview
          takes about half a day and building an app takes weeks. After launch, time runs on its own
          and pauses when something important happens, such as cash running low.
        </p>
        <h3>The simulated market</h3>
        <p>
          The market behaves like a real one. Most outreach is ignored, advertising gets more
          expensive as you scale, customers remember old prices, and competitors fight back. A
          calculation engine works out sales, costs and cash from your decisions; the AI only
          explains them.
        </p>
        <h3>Nothing is locked</h3>
        <p>
          Go back and change any earlier decision. The market responds from that day forward, and
          the past is never rewritten. You can also try a change in a copy of your startup,
          fast-forward, compare, and then keep it or throw it away.
        </p>
        <h3>The Founder Pack</h3>
        <p>
          When you&apos;re ready, export a pitch document, a financial model, a detailed report of
          everything you learned, a Business Model Canvas, and a shortlist of investors and
          programmes that fit, each with an official link and a &ldquo;last checked&rdquo; date. You
          can also talk to an AI consultant, or book a session with a real one and share only what
          you choose.
        </p>

        <h2 id="ai">How we use AI, and what it never does</h2>
        <p>
          BluSlate uses Claude, made by Anthropic. The AI researches, explains, plays simulated
          customers and suppliers, and suggests options. Every AI answer is saved as a draft for you
          to approve.
        </p>
        <p>The AI never:</p>
        <ul>
          <li>
            invents numbers such as sales, prices or market sizes (a calculation engine does that);
          </li>
          <li>invents sources, competitors, investors or web links;</li>
          <li>adds anything to your plan without your approval;</li>
          <li>sends messages, spends money, books, pays or shares your data;</li>
          <li>changes a simulated customer&apos;s hidden traits to flatter you;</li>
          <li>treats instructions hidden in uploaded files or web pages as commands.</li>
        </ul>
        <p>
          If the AI is unavailable, you can still type your own answers and use every calculator.
          For legal, financial and regulated-sector questions, we point you to real professionals.
        </p>

        <h2 id="labels">Real vs simulated</h2>
        <p>
          Every fact, quote and number carries one of six labels, on screen and in every report, so
          a simulated result is never mistaken for real proof.
        </p>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th scope="col">Label</th>
                <th scope="col">Example</th>
                <th scope="col">How we use it</th>
              </tr>
            </thead>
            <tbody>
              {LABELS.map((l) => (
                <tr key={l.badge}>
                  <td>
                    <Badge variant={l.variant}>{l.badge}</Badge>
                  </td>
                  <td>{l.example}</td>
                  <td>{l.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 id="privacy">Privacy</h2>
        <p>
          Your ideas are private by default. They are never shown to other users and never reused
          for anyone else&apos;s startup. You choose what to share with a mentor or consultant, and
          you can export or delete your data. Read the full{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2 id="yoppi">Part of the YOPPI family</h2>
        <p>
          BluSlate is part of the <a href={site.ecosystem.url}>YOPPI</a> ecosystem, with its own
          accounts, data and roadmap. YOPPI&apos;s school programmes, such as Startup Sprint, stay
          separate products.
        </p>

        <h2 id="contact">Contact</h2>
        <p>
          Questions, feedback or partnership ideas? Write to{" "}
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
        </p>
      </article>
    </div>
  );
}
