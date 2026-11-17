import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How BluSlate collects, uses, shares and protects your personal data and your startup ideas, and the rights you have over them.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "BluSlate Privacy Policy", url: "/privacy" },
};

const mail = <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>;

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          BluSlate (&ldquo;BluSlate&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is a web service for
          testing business ideas, operated as part of the <a href={site.ecosystem.url}>YOPPI</a>{" "}
          ecosystem. We decide how and why your personal data is processed, so we are the
          &ldquo;data fiduciary&rdquo; under India&apos;s Digital Personal Data Protection Act, 2023
          (&ldquo;DPDP Act&rdquo;), and the &ldquo;controller&rdquo; under the EU and UK General
          Data Protection Regulation (&ldquo;GDPR&rdquo;) where it applies.
        </p>
        <p>You can reach us about anything in this policy at {mail}.</p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <h3>Information you give us</h3>
        <ul>
          <li>
            <strong>Account details:</strong> the first name you tell us, and your email address if
            you choose to sign in by email. You can use BluSlate without an email address: your
            startups are then linked to a private session in your browser.
          </li>
          <li>
            <strong>Your startup content:</strong> your idea, onboarding answers, decisions, notes,
            interview notes and anything else you type, choose or upload while using BluSlate.
          </li>
          <li>
            <strong>Messages to us:</strong> what you send when you contact us for support or
            feedback.
          </li>
        </ul>
        <h3>Information collected automatically</h3>
        <ul>
          <li>
            <strong>Technical data:</strong> IP address, browser and device type, pages requested,
            and timestamps, kept in server logs for security and troubleshooting.
          </li>
          <li>
            <strong>Cookies and similar storage:</strong> only what is needed to sign you in and
            keep your onboarding draft. See our <Link href="/cookies">Cookie Policy</Link>.
          </li>
        </ul>
        <p>
          We do not collect payment card details, and we do not ask for sensitive categories of data
          such as health, religion or biometrics. Please don&apos;t upload personal data about other
          people (for example, real interview recordings) unless they have agreed to it.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use your information",
    body: (
      <>
        <ul>
          <li>
            to create your workspace, keep it private to you, and sign you in by email link if you
            use it;
          </li>
          <li>to save your startups and show them only to you and the people you invite;</li>
          <li>
            to run the features you ask for, including research, explanations, simulated customers
            and the simulated market;
          </li>
          <li>to send you service emails, such as sign-in links and important changes;</li>
          <li>to keep the service safe, prevent abuse and fix problems;</li>
          <li>
            to understand, in aggregate, how the service is used so we can improve it, without using
            the content of your ideas;
          </li>
          <li>to comply with the law and respond to lawful requests.</li>
        </ul>
        <p>
          <strong>
            We do not sell your personal data, we do not show advertising, and we never reuse one
            founder&apos;s ideas for another.
          </strong>
        </p>
      </>
    ),
  },
  {
    id: "ai",
    title: "How AI features use your content",
    body: (
      <>
        <p>
          When you use an AI feature, the relevant parts of your startup are sent to our AI
          provider, Anthropic, to produce a draft. Only the information that task needs is sent, and
          only for your own startup.
        </p>
        <ul>
          <li>
            AI output is saved as a draft and becomes part of your plan only when you approve it.
          </li>
          <li>
            Anthropic processes this content as our service provider under its commercial terms,
            which do not allow it to train its models on content we send through its API.
          </li>
          <li>We do not use your ideas to train any AI model.</li>
          <li>
            We keep a log of each AI request (which task, cost and timing) to control quality and
            cost.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "legal-bases",
    title: "Why we are allowed to use it",
    body: (
      <>
        <p>
          Under the DPDP Act we process your personal data on the basis of the consent you give when
          you create an account and use BluSlate, and for the legitimate uses the Act permits, such
          as complying with the law. You can withdraw consent at any time (see{" "}
          <a href="#your-rights">Your rights</a>); this does not affect processing that already
          happened.
        </p>
        <p>Where the GDPR applies, our legal bases are:</p>
        <ul>
          <li>
            <strong>contract:</strong> to provide the service you signed up for;
          </li>
          <li>
            <strong>legitimate interests:</strong> to keep the service secure and improve it,
            balanced against your rights;
          </li>
          <li>
            <strong>consent:</strong> where we ask for it, for example for any optional cookies in
            future;
          </li>
          <li>
            <strong>legal obligation:</strong> where the law requires us to keep or disclose
            information.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>We share personal data only with:</p>
        <ul>
          <li>
            <strong>Service providers</strong> that run BluSlate for us under contracts that limit
            what they can do with it: website hosting (Vercel), database (Neon), file storage
            (Cloudflare), sign-in email (Resend) and AI processing (Anthropic).
          </li>
          <li>
            <strong>People you choose:</strong> a team member, mentor or consultant you invite sees
            only what you decide to share with them.
          </li>
          <li>
            <strong>Authorities</strong> when the law requires it, or to protect the rights, safety
            or property of our users or others.
          </li>
          <li>
            <strong>A successor</strong> if BluSlate is reorganised, merged or sold, in which case
            this policy will continue to protect your data.
          </li>
        </ul>
        <p>
          BluSlate never contacts real customers, suppliers or investors on your behalf, and never
          shares your data with them, without a separate, explicit approval from you.
        </p>
      </>
    ),
  },
  {
    id: "transfers",
    title: "International transfers",
    body: (
      <p>
        Some of our service providers store or process data outside India, including in the United
        States and the European Union. We transfer data only to countries the DPDP Act does not
        restrict, and, where the GDPR applies, we rely on adequacy decisions or standard contractual
        clauses to protect it.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <ul>
        <li>Your account and startups are kept for as long as your account is open.</li>
        <li>
          If you delete a startup or your account, we delete the related data from our live systems
          within 30 days. Copies in encrypted backups are overwritten within a further 30 days.
        </li>
        <li>
          Server logs are kept for up to 90 days, unless we need them longer to investigate abuse.
        </li>
        <li>Sign-in links expire after 24 hours and can be used only once.</li>
        <li>We keep information longer only where the law requires it.</li>
      </ul>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <p>
        We use encryption in transit (HTTPS) and at rest, keep each founder&apos;s startups separate
        from everyone else&apos;s, limit staff access to what is needed to run and support the
        service, and log that access. No system is perfectly secure. If a breach affects your
        personal data, we will tell you and the relevant authorities as the law requires.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>Depending on where you live, you have the right to:</p>
        <ul>
          <li>get a summary of the personal data we hold about you and how we use it;</li>
          <li>correct, complete or update it;</li>
          <li>delete it, and close your account;</li>
          <li>export your startups in a portable format;</li>
          <li>withdraw your consent;</li>
          <li>object to or restrict some processing (under the GDPR);</li>
          <li>
            nominate someone to exercise your rights if you die or become unable to (under the DPDP
            Act);
          </li>
          <li>raise a grievance with us, and complain to a regulator.</li>
        </ul>
        <p>
          To use any of these rights, email {mail} from the address on your account. We will reply
          within 30 days. In India, if you are not satisfied with our response, you can complain to
          the Data Protection Board of India. In the EU or UK, you can complain to your local data
          protection authority.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Age limit",
    body: (
      <p>
        BluSlate is for people aged 18 and over. We do not knowingly collect personal data from
        anyone under 18. If you believe a child has created an account, contact us and we will
        delete it. YOPPI&apos;s programmes for schools are separate services with their own
        policies.
      </p>
    ),
  },
  {
    id: "grievance",
    title: "Grievance officer and contact",
    body: (
      <p>
        For questions, requests or complaints about your personal data, contact our grievance
        officer at {mail}. We acknowledge grievances within 7 days and aim to resolve them within 30
        days.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We will update this policy as BluSlate grows. The date at the top shows the latest version.
        If a change materially affects how we use your personal data, we will tell you by email or
        in the app before it takes effect.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          Your ideas are private by default. This policy explains what personal data BluSlate
          collects, why, who we share it with, and the choices and rights you have. In short: we
          collect only what we need to run the service, we never sell your data, and we never show
          your ideas to anyone you haven&apos;t chosen.
        </p>
      }
      sections={sections}
    />
  );
}
