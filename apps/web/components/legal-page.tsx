import Link from "next/link";
import { site } from "@/lib/site";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

/** Shared layout for Privacy, Terms and Cookies: title, date, contents, sections. */
export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: React.ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <article className="prose-page">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Legal</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">Last updated: {site.legalUpdated}</p>
        <div className="mt-6">{intro}</div>

        <nav aria-label="Contents" className="mt-8 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold">Contents</p>
          <ol className="!mt-3 columns-1 text-sm sm:columns-2">
            {sections.map((s, i) => (
              <li key={s.id} className="!leading-6">
                <a href={`#${s.id}`} className="!font-normal !no-underline hover:!underline">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {sections.map((s, i) => (
          <section key={s.id} aria-labelledby={s.id}>
            <h2 id={s.id} className="scroll-mt-24">
              {i + 1}. {s.title}
            </h2>
            {s.body}
          </section>
        ))}

        <p className="mt-12 text-sm text-muted-foreground">
          See also: <Link href="/privacy">Privacy Policy</Link> ·{" "}
          <Link href="/terms">Terms of Use</Link> · <Link href="/cookies">Cookie Policy</Link>
        </p>
      </article>
    </div>
  );
}
