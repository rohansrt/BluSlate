import { beforeEach, describe, expect, it } from "vitest";
import type { FounderApproval } from "@bluslate/contracts";
import {
  ApprovalRequiredError,
  EntityValidationError,
  InMemoryTwinStore,
  NotFoundError,
  SingleWriterError,
  createTwin,
  type Twin,
} from "./index";

const S = "startup-1";
const FOUNDER = "user-founder";
const NOW = new Date("2026-11-17T10:00:00Z");

let store: InMemoryTwinStore;
let twin: Twin;
let seq = 0;

const approval = (userId = FOUNDER, at = NOW): FounderApproval => ({
  userId,
  approvedAt: at.toISOString(),
});

beforeEach(() => {
  seq = 0;
  store = new InMemoryTwinStore().addMember(S, FOUNDER);
  twin = createTwin(store, { now: () => NOW, newId: () => `id-${++seq}` });
});

async function publishNew(
  pillar: Parameters<Twin["saveDraft"]>[0]["pillar"],
  type: Parameters<Twin["saveDraft"]>[0]["type"],
  data: Record<string, unknown>,
  basedOn: string[] = [],
) {
  const draft = await twin.saveDraft({
    startupId: S,
    pillar,
    type,
    data,
    evidenceLabel: "ASSUMED",
    createdBy: "FOUNDER",
    basedOn,
    schemaVersion: "0.1.0",
  });
  return twin.publish({ startupId: S, draftId: draft.id, approval: approval() });
}

async function republish(
  logicalId: string,
  pillar: "discover" | "customers",
  type: "Problem" | "Segment",
  data: Record<string, unknown>,
) {
  const draft = await twin.saveDraft({
    startupId: S,
    pillar,
    type,
    logicalId,
    data,
    evidenceLabel: "ASSUMED",
    createdBy: "FOUNDER",
    schemaVersion: "0.1.0",
  });
  return twin.publish({ startupId: S, draftId: draft.id, approval: approval() });
}

describe("single writer (architecture rule 3)", () => {
  it("lets the owning pillar save a draft", async () => {
    const d = await twin.saveDraft({
      startupId: S,
      pillar: "discover",
      type: "Problem",
      data: { pain: "Late to class" },
      evidenceLabel: "ASSUMED",
      createdBy: "FOUNDER",
      schemaVersion: "0.1.0",
    });
    expect(d.reviewState).toBe("DRAFT");
  });

  it("refuses a draft of another pillar's entity type", async () => {
    await expect(
      twin.saveDraft({
        startupId: S,
        pillar: "market",
        type: "Problem",
        data: {},
        evidenceLabel: "ASSUMED",
        createdBy: "FOUNDER",
        schemaVersion: "0.1.0",
      }),
    ).rejects.toBeInstanceOf(SingleWriterError);
  });

  it("refuses shared types, which no pillar owns", async () => {
    await expect(
      twin.saveDraft({
        startupId: S,
        pillar: "discover",
        // @ts-expect-error - Startup is a shared type, deliberately invalid here
        type: "Startup",
        data: {},
        evidenceLabel: "ASSUMED",
        createdBy: "FOUNDER",
        schemaVersion: "0.1.0",
      }),
    ).rejects.toBeInstanceOf(SingleWriterError);
  });

  it("validates data against the entity schema", async () => {
    await expect(
      twin.saveDraft({
        startupId: S,
        pillar: "discover",
        type: "Problem",
        data: { pain: 42 },
        evidenceLabel: "ASSUMED",
        createdBy: "FOUNDER",
        schemaVersion: "0.1.0",
      }),
    ).rejects.toBeInstanceOf(EntityValidationError);
  });
});

describe("publishing needs the founder's approval (G5)", () => {
  async function draftId() {
    const d = await twin.saveDraft({
      startupId: S,
      pillar: "discover",
      type: "Problem",
      data: { pain: "Late to class" },
      evidenceLabel: "ASSUMED",
      createdBy: "AI",
      schemaVersion: "0.1.0",
    });
    return d.id;
  }

  it("rejects a publish with no approval (e.g. an AI-originated publish)", async () => {
    const id = await draftId();
    await expect(
      twin.publish({
        startupId: S,
        draftId: id,
        approval: undefined as unknown as FounderApproval,
      }),
    ).rejects.toBeInstanceOf(ApprovalRequiredError);
    expect(store.versions).toHaveLength(0);
  });

  it("rejects an approval from someone outside the startup", async () => {
    const id = await draftId();
    await expect(
      twin.publish({ startupId: S, draftId: id, approval: approval("stranger") }),
    ).rejects.toBeInstanceOf(ApprovalRequiredError);
  });

  it("rejects a stale approval", async () => {
    const id = await draftId();
    const old = new Date(NOW.getTime() - 60 * 60 * 1000);
    await expect(
      twin.publish({ startupId: S, draftId: id, approval: approval(FOUNDER, old) }),
    ).rejects.toBeInstanceOf(ApprovalRequiredError);
  });

  it("marks AI output as needing review until it is approved", async () => {
    await draftId();
    const { pillars } = await twin.statuses(S);
    expect(pillars.discover.status).toBe("needs_review");
  });
});

describe("append-only history (architecture rule 5)", () => {
  it("publishes version 1 with a decision event, and keeps drafts out of other pillars' reads", async () => {
    const d = await twin.saveDraft({
      startupId: S,
      pillar: "discover",
      type: "Problem",
      data: { pain: "Late to class" },
      evidenceLabel: "ASSUMED",
      createdBy: "FOUNDER",
      schemaVersion: "0.1.0",
    });
    expect(await twin.approved(S)).toHaveLength(0);

    const r = await twin.publish({
      startupId: S,
      draftId: d.id,
      approval: approval(),
      rationale: "First pass",
    });
    expect(r.version).toBe(1);
    const [v] = await twin.approved(S);
    expect(v).toMatchObject({
      type: "Problem",
      ownerPillar: "discover",
      evidenceLabel: "ASSUMED",
      data: { pain: "Late to class" },
    });
    const [e] = await twin.decisions(S);
    expect(e).toMatchObject({
      entityLogicalId: r.logicalId,
      fromVersion: null,
      toVersion: 1,
      actorId: FOUNDER,
      rationale: "First pass",
    });
    expect(await twin.drafts(S)).toHaveLength(0);
  });

  it("a change adds version 2 and leaves version 1 untouched", async () => {
    const first = await publishNew("discover", "Problem", { pain: "Late to class" });
    const second = await republish(first.logicalId, "discover", "Problem", {
      pain: "Late and broke",
    });
    expect(second).toMatchObject({ logicalId: first.logicalId, version: 2 });

    const history = await twin.history(S, first.logicalId);
    expect(history.map((h) => [h.version, h.data.pain])).toEqual([
      [1, "Late to class"],
      [2, "Late and broke"],
    ]);
    const events = await twin.decisions(S);
    expect(events.map((e) => [e.fromVersion, e.toVersion])).toEqual([
      [null, 1],
      [1, 2],
    ]);
    expect((await twin.approved(S))[0]?.version).toBe(2);
  });

  it("rolls back everything if a publish fails half-way", async () => {
    const d = await twin.saveDraft({
      startupId: S,
      pillar: "discover",
      type: "Problem",
      data: { pain: "x" },
      evidenceLabel: "ASSUMED",
      createdBy: "FOUNDER",
      schemaVersion: "0.1.0",
    });
    const original = store.insertDecisionEvent.bind(store);
    store.insertDecisionEvent = async () => {
      throw new Error("disk full");
    };
    await expect(
      twin.publish({ startupId: S, draftId: d.id, approval: approval() }),
    ).rejects.toThrow("disk full");
    store.insertDecisionEvent = original;
    expect(store.versions).toHaveLength(0);
    expect(await twin.drafts(S)).toHaveLength(1);
  });

  it("refuses to publish a draft that doesn't exist", async () => {
    await expect(
      twin.publish({ startupId: S, draftId: "nope", approval: approval() }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("changes ripple, entity by entity (§5.5)", () => {
  it("marks only the entities built from a changed one as 'May be outdated'", async () => {
    const problem = await publishNew("discover", "Problem", { pain: "Late to class" });
    const students = await publishNew(
      "customers",
      "Segment",
      { name: "Students far from campus" },
      [problem.logicalId],
    );
    const staff = await publishNew("customers", "Segment", { name: "Campus staff" });

    const preview = await (async () => {
      const d = await twin.saveDraft({
        startupId: S,
        pillar: "discover",
        type: "Problem",
        logicalId: problem.logicalId,
        data: { pain: "Late and broke" },
        evidenceLabel: "ASSUMED",
        createdBy: "FOUNDER",
        schemaVersion: "0.1.0",
      });
      return twin.previewPublish(S, d.id);
    })();
    expect(preview).toMatchObject({ isNew: false, fromVersion: 1, affectedPillars: ["customers"] });
    expect(preview.affected.map((a) => a.logicalId)).toEqual([students.logicalId]);

    const result = await twin.publish({
      startupId: S,
      draftId: preview.draft.id,
      approval: approval(),
    });
    expect(result.staleMarked.map((a) => a.logicalId)).toEqual([students.logicalId]);

    const { entities, pillars } = await twin.statuses(S);
    expect(entities[students.logicalId]?.status).toBe("MAY_BE_OUTDATED");
    expect(entities[staff.logicalId]?.status).toBe("APPROVED");
    expect(entities[problem.logicalId]?.status).toBe("APPROVED");
    expect(pillars.customers.status).toBe("needs_review");

    // Refreshing the outdated segment clears the mark; the earlier version stays in history.
    await republish(students.logicalId, "customers", "Segment", {
      name: "Students 3–8 km from campus",
    });
    expect((await twin.statuses(S)).entities[students.logicalId]?.status).toBe("APPROVED");
    expect(await twin.history(S, students.logicalId)).toHaveLength(2);
  });

  it("doesn't mark anything when a brand-new entity is published", async () => {
    const r = await publishNew("discover", "Problem", { pain: "x" });
    expect(r.staleMarked).toEqual([]);
  });
});

describe("hub statuses (§6.1)", () => {
  it("rolls up not started, draft and approved", async () => {
    expect((await twin.statuses(S)).pillars.discover.status).toBe("not_started");
    await twin.saveDraft({
      startupId: S,
      pillar: "build",
      type: "Feature",
      data: { name: "Book a bike" },
      evidenceLabel: "ASSUMED",
      createdBy: "FOUNDER",
      schemaVersion: "0.1.0",
    });
    await publishNew("discover", "Problem", { pain: "x" });
    const { pillars } = await twin.statuses(S);
    expect(pillars.build).toMatchObject({ status: "draft", drafts: 1 });
    expect(pillars.discover).toMatchObject({ status: "approved", approved: 1 });
    expect(pillars.market.status).toBe("not_started");
  });

  it("keeps each startup's statuses separate (G11)", async () => {
    await publishNew("discover", "Problem", { pain: "x" });
    expect((await twin.statuses("startup-2")).pillars.discover.status).toBe("not_started");
    expect(await twin.approved("startup-2")).toEqual([]);
  });
});

describe("proposals (§3.1 feedback rule)", () => {
  it("waits for review on the owning pillar, then publishes through it", async () => {
    const p = await twin.propose({
      startupId: S,
      fromPillar: "run-grow",
      targetPillar: "customers",
      entityType: "Need",
      targetLogicalId: null,
      payload: { statement: "Bikes that are always charged" },
      reason: "Churn reasons mention flat batteries",
    });
    expect((await twin.statuses(S)).pillars.customers.status).toBe("needs_review");

    const r = await twin.acceptProposal({
      startupId: S,
      proposalId: p.id,
      approval: approval(),
      schemaVersion: "0.1.0",
    });
    const [need] = await twin.approved(S, ["Need"]);
    expect(need).toMatchObject({
      logicalId: r.logicalId,
      ownerPillar: "customers",
      createdBy: "SYSTEM",
    });
    expect((await twin.proposals(S))[0]?.status).toBe("accepted");
    expect((await twin.statuses(S)).pillars.customers.status).toBe("approved");
  });

  it("can't target a pillar that doesn't own the type", async () => {
    await expect(
      twin.propose({
        startupId: S,
        fromPillar: "run-grow",
        targetPillar: "market",
        entityType: "Need",
        targetLogicalId: null,
        payload: {},
        reason: "x",
      }),
    ).rejects.toBeInstanceOf(SingleWriterError);
  });

  it("needs approval to reject, too", async () => {
    const p = await twin.propose({
      startupId: S,
      fromPillar: "run-grow",
      targetPillar: "gtm",
      entityType: "PricePlan",
      targetLogicalId: null,
      payload: { method: "value-based" },
      reason: "x",
    });
    await expect(
      twin.rejectProposal({ startupId: S, proposalId: p.id, approval: approval("stranger") }),
    ).rejects.toBeInstanceOf(ApprovalRequiredError);
    await twin.rejectProposal({ startupId: S, proposalId: p.id, approval: approval() });
    expect((await twin.proposals(S))[0]?.status).toBe("rejected");
  });
});

describe("assumptions register and snapshots", () => {
  it("registers each changed founder assumption, untested", async () => {
    const r = await publishNew("discover", "Problem", { pain: "Late to class", who: "Students" });
    await republish(r.logicalId, "discover", "Problem", {
      pain: "Late to class",
      who: "Students 3–8 km away",
    });
    const rows = await twin.assumptions(S);
    expect(rows.map((a) => [a.field, a.value]).sort()).toEqual([
      ["pain", "Late to class"],
      ["who", "Students"],
      ["who", "Students 3–8 km away"],
    ]);
    expect(rows.every((a) => a.status === "untested" && a.label === "ASSUMED")).toBe(true);
  });

  it("freezes the current versions in a snapshot", async () => {
    const a = await publishNew("discover", "Problem", { pain: "x" });
    await republish(a.logicalId, "discover", "Problem", { pain: "y" });
    const b = await publishNew("build", "Feature", { name: "Book" });
    const snap = await twin.snapshot(S);
    expect(snap.versionMap).toEqual({ [a.logicalId]: 2, [b.logicalId]: 1 });
  });
});
