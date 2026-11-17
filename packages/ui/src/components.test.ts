import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EVIDENCE_LABELS } from "@bluslate/contracts";
import {
  AiRailPanel,
  DecisionCard,
  EnablerCard,
  EvidenceBadge,
  PublishPanel,
  SuggestionCard,
  TimeStrip,
} from "./index";

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);
const noop = () => {};

describe("evidence labels are always visible", () => {
  it("renders every label with its meaning as a tooltip", () => {
    for (const label of EVIDENCE_LABELS) {
      const out = html(h(EvidenceBadge, { label }));
      expect(out).toContain(`>${label}<`);
      expect(out).toMatch(/title="[^"]+"/);
    }
  });

  it("labels the founder's decision and the AI suggestion differently", () => {
    expect(html(h(DecisionCard, { label: "ASSUMED", children: "x" }))).toContain("Your decision");
    const suggestion = html(h(SuggestionCard, { label: "SOURCED", children: "x" }));
    expect(suggestion).toContain("Suggested by AI");
    expect(suggestion).toContain("border-dashed");
  });

  it("never shows a synthetic quote as a real provider (G1)", () => {
    const synthetic = html(h(EnablerCard, { name: "Acme Bikes", kind: "synthetic" }));
    expect(synthetic).toContain("SYNTHETIC");
    expect(synthetic).not.toContain("Real provider");
    expect(
      html(h(EnablerCard, { name: "Acme Bikes", kind: "real", lastChecked: "17 Nov 2026" })),
    ).toContain("Last checked 17 Nov 2026");
  });
});

describe("publish panel", () => {
  it("shows the change, its label and what it will mark outdated", () => {
    const out = html(
      h(PublishPanel, {
        entityName: "problem",
        isNew: false,
        fromVersion: 1,
        changes: [
          { field: "Problem", before: "Late to class", after: "Late and broke", label: "ASSUMED" },
        ],
        affected: [{ name: "Segment", pillar: "Customers" }],
        onApprove: noop,
        onEdit: noop,
        onReject: noop,
      }),
    );
    expect(out).toContain("version 2");
    expect(out).toContain("Late and broke");
    expect(out).toContain("ASSUMED");
    expect(out).toContain("Segment in Customers will be marked");
    expect(out).toContain("Approve and publish");
  });
});

describe("time strip and AI rail", () => {
  it("shows each figure with its label, and flags danger", () => {
    const out = html(
      h(TimeStrip, {
        day: 143,
        month: 5,
        date: "12 Apr 2027",
        playing: false,
        figures: [{ name: "Runway", value: "2.5 months", label: "SYNTHETIC", danger: true }],
        alerts: 2,
      }),
    );
    expect(out).toContain("Day 143 · Month 5");
    expect(out).toContain("SYNTHETIC");
    expect(out).toContain("text-danger");
    expect(out).toContain("2 alerts");
  });

  it("offers the manual path when AI is unavailable", () => {
    const out = html(
      h(AiRailPanel, { state: { kind: "unavailable", message: "Not connected yet." } }),
    );
    expect(out).toContain("isn&#x27;t available");
    expect(out).toContain("I&#x27;ll decide");
  });
});
