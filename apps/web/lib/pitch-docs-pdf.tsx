import "server-only";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { DocContent, DocSection } from "@/lib/pitch-doc-content";
import { CANVAS_ORDER, CANVAS_TITLES } from "@/lib/pitch-doc-content";

/**
 * PDF pitch documents (decision 0012), rendered from a stored snapshot.
 * Uses the built-in Helvetica, so text is mapped to characters it can draw
 * (₹ becomes "Rs", ✓ becomes a word). AI predictions are always boxed and
 * labelled; nothing predicted is shown as the founder's work.
 */

const C = {
  ink: "#0f172a",
  muted: "#64748b",
  line: "#e2e8f0",
  blue: "#004bfc",
  blueSoft: "#eef3ff",
  green: "#15803d",
  greenSoft: "#e7f6ec",
  amber: "#b45309",
  purple: "#7c3aed",
  purpleSoft: "#f5f0ff",
};

const MAP: [RegExp, string][] = [
  [/₹\s?/g, "Rs "],
  [/[−–—]/g, "-"],
  [/[“”„]/g, '"'],
  [/[‘’]/g, "'"],
  [/×/g, "x"],
  [/÷/g, "/"],
  [/≈/g, "~"],
  [/≥/g, ">="],
  [/≤/g, "<="],
  [/✓/g, "yes"],
  [/✗/g, "no"],
  [/…/g, "..."],
  [/→/g, "->"],
  [/[·•]/g, "|"],
  [/\u00a0/g, " "],
];

/** Text Helvetica can draw (WinAnsi): map what we use, drop the rest. */
export function pdfText(input: string | null | undefined): string {
  let s = input ?? "";
  for (const [re, to] of MAP) s = s.replace(re, to);
  return s.replace(/[^\x20-\x7E\n]/g, "");
}
const t = pdfText;

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: C.ink, lineHeight: 1.4 },
  kicker: { fontSize: 8, color: C.blue, fontFamily: "Helvetica-Bold", letterSpacing: 1.2 },
  h1: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 4, lineHeight: 1.2 },
  h2: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  meta: { fontSize: 9, color: C.muted, marginTop: 2 },
  muted: { color: C.muted },
  rule: { borderBottomWidth: 1, borderBottomColor: C.line, marginVertical: 10 },
  headline: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  row: { flexDirection: "row", marginBottom: 2 },
  label: { width: 150, color: C.muted },
  value: { flex: 1 },
  badge: { fontSize: 6.5, color: C.muted, fontFamily: "Helvetica-Bold" },
  section: { marginBottom: 12 },
  predict: {
    marginTop: 6,
    padding: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: C.purple,
    backgroundColor: C.purpleSoft,
    borderRadius: 4,
  },
  predictTag: { fontSize: 7, color: C.purple, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 7,
    color: C.muted,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

const dateOf = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(iso),
  );

function Footer({ c }: { c: DocContent }) {
  return (
    <View style={s.footer} fixed>
      <Text>
        {t(`${c.startup.name} | ${c.title} | made with BluSlate on ${dateOf(c.generatedAt)}`)}
      </Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function Notes({ c }: { c: DocContent }) {
  return (
    <View style={{ marginTop: 6 }}>
      {c.aiFilled && (
        <Text style={{ fontSize: 8, color: C.purple }}>
          Boxes marked AI PREDICTION are AI&apos;s best guess for steps that aren&apos;t complete.
          Check them before you rely on them.
        </Text>
      )}
      {c.leftOut.length > 0 && (
        <Text style={{ fontSize: 8, color: C.muted }}>
          {t(
            `Not included yet (no work in these steps): ${c.leftOut.map((l) => l.name).join(", ")}.`,
          )}
        </Text>
      )}
    </View>
  );
}

function PredictionBox({ sec }: { sec: DocSection }) {
  if (!sec.prediction) return null;
  return (
    <View style={s.predict} wrap={false}>
      <Text style={s.predictTag}>AI PREDICTION | NOT YOUR DATA</Text>
      <Text style={{ fontFamily: "Helvetica-Bold" }}>{t(sec.prediction.headline)}</Text>
      {sec.prediction.points.map((p, i) => (
        <Text key={i}>{t(`- ${p}`)}</Text>
      ))}
    </View>
  );
}

function Lines({ sec, max }: { sec: DocSection; max?: number }) {
  return (
    <>
      {sec.lines.slice(0, max ?? sec.lines.length).map((l, i) => (
        <View key={i} style={s.row}>
          <Text style={s.label}>{t(l.label)}</Text>
          <Text style={s.value}>
            {t(l.value)}
            {l.evidence ? <Text style={s.badge}>{`  ${l.evidence}`}</Text> : null}
          </Text>
        </View>
      ))}
    </>
  );
}

function Header({ c, subtitle }: { c: DocContent; subtitle?: string }) {
  return (
    <View>
      <Text style={s.kicker}>{t(c.title.toUpperCase())}</Text>
      <Text style={s.h1}>{t(c.startup.name)}</Text>
      <Text style={s.meta}>
        {t(`${c.startup.market} | ${dateOf(c.generatedAt)}${subtitle ? ` | ${subtitle}` : ""}`)}
      </Text>
      {c.startup.idea && <Text style={{ marginTop: 6 }}>{t(`"${c.startup.idea}"`)}</Text>}
      <Notes c={c} />
      <View style={s.rule} />
    </View>
  );
}

function Empty() {
  return (
    <Text style={s.muted}>
      No steps have work in them yet, so there&apos;s nothing to put here. Fill in any step and
      generate again.
    </Text>
  );
}

// ─── One-page summary ───────────────────────────────────────────────────────

function Summary({ c }: { c: DocContent }) {
  return (
    <Document title={t(`${c.startup.name} - ${c.title}`)} author="BluSlate">
      <Page size="A4" style={s.page}>
        <Header c={c} />
        {c.sections.length === 0 && <Empty />}
        {c.sections.map((sec) => (
          <View key={sec.pillar} style={{ marginBottom: 8 }} wrap={false}>
            <Text style={{ fontSize: 10.5, fontFamily: "Helvetica-Bold", color: C.blue }}>
              {t(`${sec.number}. ${sec.title}`)}
            </Text>
            {sec.headline && <Text>{t(sec.headline)}</Text>}
            <Lines sec={sec} max={sec.headline ? 2 : 3} />
            {sec.prediction && (
              <Text style={{ color: C.purple }}>
                {t(`AI prediction: ${sec.prediction.headline}`)}
              </Text>
            )}
          </View>
        ))}
        <Footer c={c} />
      </Page>
    </Document>
  );
}

// ─── Business plan ──────────────────────────────────────────────────────────

function Plan({ c }: { c: DocContent }) {
  return (
    <Document title={t(`${c.startup.name} - ${c.title}`)} author="BluSlate">
      <Page size="A4" style={s.page}>
        <Header c={c} subtitle={`${c.sections.length} of 7 steps`} />
        <Text style={{ fontSize: 8, color: C.muted, marginBottom: 10 }}>
          Every value carries its label: ASSUMED your guess, ESTIMATE worked out from inputs, FIELD
          real research, SOURCED from a cited source, SYNTHETIC simulated or predicted.
        </Text>
        {c.sections.length === 0 && <Empty />}
        {c.sections.map((sec) => (
          <View key={sec.pillar} style={s.section}>
            <Text style={s.h2}>{t(`${sec.number}. ${sec.title}`)}</Text>
            <Text style={[s.muted, { marginBottom: 4 }]}>{t(sec.question)}</Text>
            {sec.headline && <Text style={s.headline}>{t(sec.headline)}</Text>}
            <Lines sec={sec} />
            {sec.goals.length > 0 && (
              <View style={{ marginTop: 6 }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9 }}>Goals</Text>
                {sec.goals.map((g, i) => (
                  <View key={i} style={s.row}>
                    <Text style={[s.label, { color: g.done ? C.green : C.muted }]}>
                      {t(`${g.done ? "[done] " : "[open] "}${g.title}`)}
                    </Text>
                    <Text style={s.value}>{t(g.value)}</Text>
                  </View>
                ))}
              </View>
            )}
            {sec.open.length > 0 && !sec.prediction && (
              <Text style={{ marginTop: 4, color: C.amber, fontSize: 9 }}>
                {t(`Still open: ${sec.open.join(", ")}`)}
              </Text>
            )}
            <PredictionBox sec={sec} />
            <View style={s.rule} />
          </View>
        ))}
        <Footer c={c} />
      </Page>
    </Document>
  );
}

// ─── Pitch deck (16:9) ──────────────────────────────────────────────────────

const SLIDE: [number, number] = [960, 540];
const d = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", color: C.ink, fontSize: 16, lineHeight: 1.35 },
  kicker: { fontSize: 12, color: C.blue, fontFamily: "Helvetica-Bold", letterSpacing: 1.5 },
  title: {
    fontSize: 34,
    fontFamily: "Helvetica-Bold",
    marginTop: 6,
    marginBottom: 6,
    lineHeight: 1.15,
  },
  question: { fontSize: 15, color: C.muted, marginTop: 4 },
  headline: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 22, marginBottom: 14 },
  bullet: { fontSize: 15, marginBottom: 6 },
  chip: {
    fontSize: 11,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  bar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 12, backgroundColor: C.blue },
  foot: { position: "absolute", bottom: 22, left: 48, right: 48, fontSize: 10, color: C.muted },
});

function Deck({ c }: { c: DocContent }) {
  const open = c.sections.flatMap((sec) =>
    sec.prediction ? [] : sec.open.slice(0, 2).map((o) => `${sec.title}: ${o}`),
  );
  return (
    <Document title={t(`${c.startup.name} - ${c.title}`)} author="BluSlate">
      <Page
        size={SLIDE}
        style={[d.page, { backgroundColor: C.blueSoft, justifyContent: "center" }]}
      >
        <View style={d.bar} />
        <Text style={d.kicker}>PITCH</Text>
        <Text style={[d.title, { fontSize: 46 }]}>{t(c.startup.name)}</Text>
        {c.startup.idea && (
          <Text style={[d.question, { fontSize: 20, marginTop: 12 }]}>{t(c.startup.idea)}</Text>
        )}
        <Text style={[d.question, { marginTop: 24 }]}>
          {t(`${c.startup.market} | ${dateOf(c.generatedAt)}`)}
        </Text>
        {c.aiFilled && (
          <Text style={{ marginTop: 16, fontSize: 11, color: C.purple }}>
            Slides marked AI PREDICTION hold AI&apos;s best guess for steps that aren&apos;t
            complete.
          </Text>
        )}
      </Page>
      {c.sections.map((sec) => (
        <Page key={sec.pillar} size={SLIDE} style={d.page}>
          <View style={d.bar} />
          <Text style={d.kicker}>{t(`${sec.number} | ${sec.title.toUpperCase()}`)}</Text>
          <Text style={d.question}>{t(sec.question)}</Text>
          {sec.headline && <Text style={d.headline}>{t(sec.headline)}</Text>}
          {!sec.headline && sec.prediction && (
            <Text style={[d.headline, { color: C.purple }]}>{t(sec.prediction.headline)}</Text>
          )}
          {sec.lines.slice(0, 5).map((l, i) => (
            <Text key={i} style={d.bullet}>
              {t(`- ${l.label}: ${l.value}`)}
            </Text>
          ))}
          {sec.prediction && (
            <View style={[s.predict, { marginTop: 10 }]}>
              <Text style={[s.predictTag, { fontSize: 10 }]}>AI PREDICTION | NOT YOUR DATA</Text>
              {sec.headline && (
                <Text style={{ fontSize: 13, fontFamily: "Helvetica-Bold" }}>
                  {t(sec.prediction.headline)}
                </Text>
              )}
              {sec.prediction.points.slice(0, 4).map((p, i) => (
                <Text key={i} style={{ fontSize: 13 }}>
                  {t(`- ${p}`)}
                </Text>
              ))}
            </View>
          )}
          {sec.goals.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 14 }}>
              {sec.goals.slice(0, 6).map((g, i) => (
                <Text
                  key={i}
                  style={[
                    d.chip,
                    {
                      backgroundColor: g.done ? C.greenSoft : "#f1f5f9",
                      color: g.done ? C.green : C.ink,
                    },
                  ]}
                >
                  {t(`${g.title}: ${g.value}`)}
                </Text>
              ))}
            </View>
          )}
          <Text style={d.foot}>{t(`${c.startup.name} | ${sec.number} / 7`)}</Text>
        </Page>
      ))}
      <Page size={SLIDE} style={d.page}>
        <View style={d.bar} />
        <Text style={d.kicker}>WHAT&apos;S NEXT</Text>
        <Text style={d.title}>Next steps</Text>
        <View style={{ marginTop: 20 }}>
          {open.slice(0, 7).map((o, i) => (
            <Text key={i} style={d.bullet}>
              {t(`- ${o}`)}
            </Text>
          ))}
          {c.leftOut.length > 0 && (
            <Text style={[d.bullet, { color: C.muted }]}>
              {t(`- Still to explore: ${c.leftOut.map((l) => l.name).join(", ")}`)}
            </Text>
          )}
          {open.length === 0 && c.leftOut.length === 0 && c.sections.length > 0 && (
            <Text style={d.bullet}>Every step is complete. Time to test it in the real world.</Text>
          )}
          {c.sections.length === 0 && (
            <Text style={d.bullet}>Fill in any step, then generate the deck again.</Text>
          )}
        </View>
      </Page>
    </Document>
  );
}

// ─── Business Model Canvas ──────────────────────────────────────────────────

function Box({
  c,
  id,
  grow = 1,
}: {
  c: DocContent;
  id: (typeof CANVAS_ORDER)[number];
  grow?: number;
}) {
  const box = c.canvas?.find((b) => b.id === id);
  return (
    <View
      style={{
        flexGrow: grow,
        flexBasis: 0,
        borderWidth: 1,
        borderColor: box?.predicted ? C.purple : C.line,
        borderStyle: box?.predicted ? "dashed" : "solid",
        backgroundColor: box?.predicted ? C.purpleSoft : box ? "#ffffff" : "#f8fafc",
        padding: 8,
        margin: 3,
      }}
    >
      <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: box ? C.blue : C.muted }}>
        {t(CANVAS_TITLES[id])}
      </Text>
      {box?.predicted && <Text style={[s.predictTag, { marginTop: 2 }]}>AI PREDICTION</Text>}
      {(box?.items ?? []).map((item, i) => (
        <Text key={i} style={{ fontSize: 8.5, marginTop: 3 }}>
          {t(`- ${item}`)}
        </Text>
      ))}
    </View>
  );
}

function Canvas({ c }: { c: DocContent }) {
  return (
    <Document title={t(`${c.startup.name} - ${c.title}`)} author="BluSlate">
      <Page size="A4" orientation="landscape" style={[s.page, { padding: 28 }]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text style={s.kicker}>BUSINESS MODEL CANVAS</Text>
            <Text style={[s.h1, { fontSize: 16 }]}>{t(c.startup.name)}</Text>
          </View>
          <Text style={s.meta}>{t(`${c.startup.market} | ${dateOf(c.generatedAt)}`)}</Text>
        </View>
        <Notes c={c} />
        <View style={{ flexDirection: "row", flexGrow: 3, marginTop: 6 }}>
          <Box c={c} id="partners" />
          <View style={{ flexGrow: 1, flexBasis: 0 }}>
            <Box c={c} id="activities" />
            <Box c={c} id="resources" />
          </View>
          <Box c={c} id="value" />
          <View style={{ flexGrow: 1, flexBasis: 0 }}>
            <Box c={c} id="relationships" />
            <Box c={c} id="channels" />
          </View>
          <Box c={c} id="segments" />
        </View>
        <View style={{ flexDirection: "row", flexGrow: 1 }}>
          <Box c={c} id="costs" />
          <Box c={c} id="revenue" />
        </View>
        <Footer c={c} />
      </Page>
    </Document>
  );
}

export async function renderPdf(c: DocContent): Promise<Buffer> {
  const doc =
    c.kind === "summary" ? (
      <Summary c={c} />
    ) : c.kind === "deck" ? (
      <Deck c={c} />
    ) : c.kind === "canvas" ? (
      <Canvas c={c} />
    ) : (
      <Plan c={c} />
    );
  return renderToBuffer(doc);
}
