import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "The cookies and browser storage BluSlate uses: only what's needed to sign you in and keep your onboarding draft. No advertising or tracking cookies.",
  alternates: { canonical: "/cookies" },
  openGraph: { title: "BluSlate Cookie Policy", url: "/cookies" },
};

const ITEMS = [
  {
    name: "authjs.session-token",
    kind: "Cookie (essential)",
    purpose:
      "Keeps you signed in, or connects this browser to your startups if you use BluSlate without an account.",
    duration: "30 days, renewed while you use BluSlate",
  },
  {
    name: "authjs.csrf-token",
    kind: "Cookie (essential)",
    purpose: "Protects sign-in forms against cross-site request forgery.",
    duration: "Until you close your browser",
  },
  {
    name: "authjs.callback-url",
    kind: "Cookie (essential)",
    purpose: "Remembers where to take you after you sign in.",
    duration: "Until you close your browser",
  },
  {
    name: "bluslate.onboarding.v1",
    kind: "Local storage (essential)",
    purpose: "Keeps the answers you type on the Home page until you sign in and save your startup.",
    duration: "Removed once your startup is saved, or when you clear site data",
  },
];

const sections: LegalSection[] = [
  {
    id: "what",
    title: "What cookies are",
    body: (
      <p>
        Cookies are small text files a website stores in your browser. &ldquo;Local storage&rdquo;
        is a similar feature that keeps information on your device. We call both
        &ldquo;cookies&rdquo; in this policy.
      </p>
    ),
  },
  {
    id: "which",
    title: "The cookies we use",
    body: (
      <>
        <p>
          BluSlate uses only <strong>essential</strong> cookies: the service can&apos;t work without
          them, so they don&apos;t need your consent. In production, the cookie names carry a{" "}
          <code>__Secure-</code> or <code>__Host-</code> prefix.
        </p>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Type</th>
                <th scope="col">Purpose</th>
                <th scope="col">How long</th>
              </tr>
            </thead>
            <tbody>
              {ITEMS.map((i) => (
                <tr key={i.name}>
                  <td>
                    <code className="text-xs">{i.name}</code>
                  </td>
                  <td>{i.kind}</td>
                  <td>{i.purpose}</td>
                  <td>{i.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "no-tracking",
    title: "No advertising or tracking cookies",
    body: (
      <p>
        We don&apos;t use advertising cookies, and we don&apos;t let third parties track you across
        other websites. If we ever add optional cookies, for example for product analytics, we will
        update this policy and ask for your consent first.
      </p>
    ),
  },
  {
    id: "control",
    title: "Controlling cookies",
    body: (
      <p>
        You can block or delete cookies in your browser settings. If you block essential cookies you
        won&apos;t be able to use BluSlate. If you use BluSlate without an account and clear this
        site&apos;s cookies, you will lose access to your startups. Clearing local storage before
        you open your city loses your onboarding answers.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about cookies? Email{" "}
        <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>. For how we handle personal
        data more generally, see our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      intro={
        <p>
          BluSlate keeps cookies to a minimum: only what is needed to sign you in, protect your
          account and remember your onboarding answers. There are no advertising or tracking
          cookies.
        </p>
      }
      sections={sections}
    />
  );
}
