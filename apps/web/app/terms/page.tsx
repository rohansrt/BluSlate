import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms for using BluSlate: what the service is and isn't, your content, AI output, acceptable use, and our responsibilities.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "BluSlate Terms of Use", url: "/terms" },
};

const mail = <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>;

const sections: LegalSection[] = [
  {
    id: "agreement",
    title: "Agreeing to these terms",
    body: (
      <p>
        These terms are an agreement between you and BluSlate, part of the{" "}
        <a href={site.ecosystem.url}>YOPPI</a> ecosystem. By creating an account or using BluSlate
        you accept them, together with our <Link href="/privacy">Privacy Policy</Link> and{" "}
        <Link href="/cookies">Cookie Policy</Link>. If you don&apos;t agree, please don&apos;t use
        the service.
      </p>
    ),
  },
  {
    id: "eligibility",
    title: "Who can use BluSlate",
    body: (
      <ul>
        <li>You must be at least 18 years old.</li>
        <li>
          If you use BluSlate for an organisation, such as an incubator, you confirm you may accept
          these terms for it.
        </li>
        <li>
          Keep access to your email account secure: anyone who can open your sign-in links can open
          your BluSlate account. Tell us at once if you think someone else has used it.
        </li>
      </ul>
    ),
  },
  {
    id: "service",
    title: "What BluSlate is, and isn't",
    body: (
      <>
        <p>
          BluSlate is a practice and planning tool. It guides you through seven steps, runs your
          idea in a <strong>simulated</strong> market, and produces documents from what you
          approved.
        </p>
        <ul>
          <li>
            <strong>Simulations are not predictions.</strong> Simulated customers, sales, quotes and
            market results are illustrations based on your inputs and stated assumptions. They are
            labelled SYNTHETIC and are not evidence that a business will succeed.
          </li>
          <li>
            <strong>It is not professional advice.</strong> Nothing in BluSlate is legal, financial,
            tax, investment, engineering or regulatory advice. Speak to a qualified professional
            before you rely on it.
          </li>
          <li>
            <strong>Funding listings are not introductions.</strong> Investors, accelerators and
            grants in a funding shortlist are listed from public sources with a &ldquo;last
            checked&rdquo; date. We don&apos;t endorse them and can&apos;t promise a meeting,
            interest or funding.
          </li>
        </ul>
        <p>
          We may change, add or remove features as the product develops. We&apos;ll tell you in
          advance about changes that significantly reduce what you can do.
        </p>
      </>
    ),
  },
  {
    id: "your-content",
    title: "Your content",
    body: (
      <>
        <p>
          You own your ideas and everything you put into BluSlate (&ldquo;your content&rdquo;), and
          the documents generated from it. You give us a limited permission to store, copy, process
          and display your content only to run the service for you, including sending it to our
          service providers such as our AI provider. This permission ends when you delete the
          content, apart from backup copies that expire as described in the Privacy Policy.
        </p>
        <p>
          You are responsible for your content. Only upload material you have the right to use, and
          only include personal data about other people (such as real interview notes) with their
          consent.
        </p>
      </>
    ),
  },
  {
    id: "ai-output",
    title: "AI-generated suggestions",
    body: (
      <ul>
        <li>
          AI features can be wrong, incomplete or out of date. Every suggestion is a draft until you
          approve it, and you are responsible for what you approve and how you use it.
        </li>
        <li>
          We label every number and claim (actual, field evidence, sourced, assumed, estimated or
          synthetic). Check sourced facts against their linked source before relying on them.
        </li>
        <li>
          Simulated customers and suppliers are fictional. Any resemblance to real people or
          businesses is coincidental.
        </li>
      </ul>
    ),
  },
  {
    id: "real-world",
    title: "Real-world actions",
    body: (
      <p>
        BluSlate never contacts anyone, spends money, places orders, books, pays or shares your data
        on your behalf without a separate, explicit approval from you each time. Anything you do in
        the real world based on BluSlate, such as contacting customers, signing with suppliers or
        approaching investors, is your own decision and responsibility.
      </p>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>break the law, or plan or promote illegal, fraudulent or harmful activity;</li>
          <li>
            upload content that infringes someone else&apos;s rights, or is abusive or malicious;
          </li>
          <li>
            try to access other people&apos;s startups or accounts, or get around our security;
          </li>
          <li>
            probe, overload or disrupt the service, or use bots or scrapers on it, except as we
            allow;
          </li>
          <li>
            try to make the AI features produce harmful content, or extract hidden simulation
            details;
          </li>
          <li>
            resell or copy the service, or present simulated results as real evidence to mislead
            others.
          </li>
        </ul>
        <p>We may remove content or limit accounts that break these rules.</p>
      </>
    ),
  },
  {
    id: "fees",
    title: "Fees",
    body: (
      <p>
        BluSlate is currently free to use. If we introduce paid features, we will show the price
        clearly before you buy, and paid features will have their own terms. We will never charge
        you without your explicit agreement.
      </p>
    ),
  },
  {
    id: "our-ip",
    title: "Our intellectual property",
    body: (
      <p>
        The BluSlate name, logo, software, design and our own explanatory content belong to us or
        our licensors. These terms don&apos;t give you rights to them beyond using the service.
        Feedback you send us may be used to improve BluSlate without obligation to you.
      </p>
    ),
  },
  {
    id: "third-parties",
    title: "Third-party services and links",
    body: (
      <p>
        BluSlate may link to or recommend third-party tools, websites, providers and programmes.
        They are run by others under their own terms. We are not responsible for them, and a
        recommendation is not an endorsement.
      </p>
    ),
  },
  {
    id: "ending",
    title: "Suspending or closing accounts",
    body: (
      <p>
        You can stop using BluSlate and ask us to delete your account at any time. We may suspend or
        close an account that breaks these terms or puts the service or other users at risk. Where
        reasonable, we will warn you first and give you a chance to export your content.
      </p>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <p>
        We work hard to keep BluSlate accurate, secure and available, but we provide it &ldquo;as
        is&rdquo; and &ldquo;as available&rdquo;. To the extent the law allows, we make no promise
        that it will be uninterrupted or error-free, or that simulations, research or AI suggestions
        are accurate or fit for a particular purpose.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limits on our liability",
    body: (
      <>
        <p>To the extent the law allows:</p>
        <ul>
          <li>
            we are not liable for indirect or consequential losses, or for lost profits, revenue,
            opportunities or data, arising from your use of BluSlate or decisions you make based on
            it;
          </li>
          <li>
            our total liability to you for any claim is limited to the greater of the amount you
            paid us in the 12 months before the claim or INR 5,000.
          </li>
        </ul>
        <p>
          Nothing in these terms limits liability that cannot be limited by law, such as liability
          for fraud.
        </p>
      </>
    ),
  },
  {
    id: "indemnity",
    title: "Your responsibility to us",
    body: (
      <p>
        If someone makes a claim against us because of your content or your breach of these terms,
        you agree to cover our reasonable losses and costs, to the extent the law allows.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. The date at the top shows the latest version. We will tell you
        about material changes by email or in the app before they take effect. If you keep using
        BluSlate after that, the new terms apply.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law and disputes",
    body: (
      <p>
        These terms are governed by the laws of India. Before starting any formal dispute, please
        contact us so we can try to resolve it. If we can&apos;t, the courts of India will have
        jurisdiction. If you live in the EU or UK, you also keep the protection of the mandatory
        consumer laws where you live.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: <p>Questions about these terms? Email {mail}.</p>,
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro={
        <p>
          These terms explain how BluSlate works, what you can expect from us, and what we expect
          from you. The most important points: simulations are practice, not predictions; nothing
          here is professional advice; you own your ideas; and we never act in the real world on
          your behalf without your explicit approval.
        </p>
      }
      sections={sections}
    />
  );
}
