import "server-only";
import ExcelJS from "exceljs";
import type { DocContent } from "@/lib/pitch-doc-content";

/**
 * The Financial model workbook (decision 0012), from a stored snapshot.
 * Inputs are values with their evidence label; totals and unit economics are
 * live formulas, so founders can change an input and see the effect. AI
 * never predicts numbers here (AI rule 5): missing inputs stay empty.
 */
export async function renderXlsx(c: DocContent): Promise<Buffer> {
  const f = c.financials ?? {
    currency: c.startup.currency,
    assumptions: [],
    costs: [],
    months: [],
  };
  const wb = new ExcelJS.Workbook();
  wb.creator = "BluSlate";
  wb.created = new Date(c.generatedAt);
  const money = `"${f.currency} "#,##0`;
  const bold = { bold: true };
  const head = (ws: ExcelJS.Worksheet) => {
    const row = ws.getRow(1);
    row.font = { bold: true, color: { argb: "FFFFFFFF" } };
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF004BFC" } };
  };

  // Summary
  const sum = wb.addWorksheet("Summary");
  sum.columns = [{ width: 28 }, { width: 70 }];
  sum.addRow(["Financial model", c.startup.name]).font = { bold: true, size: 14 };
  sum.addRow(["Market", c.startup.market]);
  sum.addRow(["Currency", f.currency]);
  sum.addRow(["Generated", new Date(c.generatedAt).toUTCString()]);
  sum.addRow(["Steps included", c.sections.map((s) => s.title).join(", ") || "None yet"]);
  if (c.leftOut.length) sum.addRow(["Not included yet", c.leftOut.map((l) => l.name).join(", ")]);
  sum.addRow([]);
  sum.addRow([
    "How to read it",
    "Inputs come from your steps, each with its evidence label (ASSUMED your guess, ESTIMATE worked out, SYNTHETIC simulated). Totals are formulas. AI never fills numbers in here.",
  ]).alignment = { wrapText: true, vertical: "top" };

  // Assumptions
  if (f.assumptions.length) {
    const ws = wb.addWorksheet("Assumptions");
    ws.columns = [
      { header: "Input", key: "label", width: 34 },
      { header: "Value", key: "value", width: 18 },
      { header: "Unit", key: "unit", width: 10 },
      { header: "From step", key: "from", width: 22 },
      { header: "Evidence", key: "evidence", width: 12 },
    ];
    head(ws);
    for (const a of f.assumptions) {
      const row = ws.addRow(a);
      if (a.unit === f.currency) row.getCell("value").numFmt = money;
    }
  }

  // Costs
  if (f.costs.length) {
    const ws = wb.addWorksheet("Costs");
    ws.columns = [
      { header: "Cost", key: "name", width: 32 },
      { header: "Fixed or variable", key: "behaviour", width: 18 },
      { header: "Basis", key: "basis", width: 16 },
      { header: `Amount (${f.currency})`, key: "amount", width: 18 },
    ];
    head(ws);
    for (const cost of f.costs) ws.addRow(cost).getCell("amount").numFmt = money;
    const n = f.costs.length + 1;
    const fixed = ws.addRow({
      name: "Fixed costs a month",
      amount: { formula: `SUMIF(B2:B${n},"fixed",D2:D${n})` },
    });
    fixed.font = bold;
    fixed.getCell("amount").numFmt = money;
    const variable = ws.addRow({
      name: "Variable cost per unit",
      amount: { formula: `SUMIFS(D2:D${n},B2:B${n},"variable",C2:C${n},"per_unit")` },
    });
    variable.font = bold;
    variable.getCell("amount").numFmt = money;
  }

  // Unit economics (formulas over the inputs we have)
  const price = f.assumptions.find((a) => a.label === "Price")?.value;
  const contribution = f.assumptions.find((a) => a.label === "Contribution per unit")?.value;
  const fixedTotal = f.assumptions.find((a) => a.label.startsWith("Fixed costs"))?.value;
  const budget = f.assumptions.find((a) => a.label.startsWith("Marketing budget"))?.value;
  if (price !== undefined || contribution !== undefined) {
    const ws = wb.addWorksheet("Unit economics");
    ws.columns = [{ width: 34 }, { width: 18 }, { width: 50 }];
    ws.addRow(["Measure", "Value", "How it's worked out"]);
    head(ws);
    ws.addRow(["Price", price ?? null, "From Go-to-Market Plan"]);
    ws.addRow([
      "Contribution per unit",
      contribution ?? null,
      "Price after discount, fees and variable cost",
    ]);
    ws.addRow(["Margin", { formula: 'IF(B2>0,B3/B2,"")' }, "Contribution ÷ price"]);
    ws.addRow(["Fixed costs a month", fixedTotal ?? null, "From Operations Setup"]);
    ws.addRow(["Marketing a month", budget ?? null, "From Go-to-Market Plan"]);
    ws.addRow([
      "Break-even units a month",
      { formula: 'IF(B3>0,ROUNDUP((N(B5)+N(B6))/B3,0),"")' },
      "(Fixed + marketing) ÷ contribution",
    ]);
    for (const r of [2, 3, 5, 6]) ws.getCell(`B${r}`).numFmt = money;
    ws.getCell("B4").numFmt = "0%";
  }

  // Monthly projection
  if (f.months.length) {
    const ws = wb.addWorksheet("Projection");
    ws.columns = [
      { header: "Month", key: "month", width: 10 },
      { header: "Customers", key: "customers", width: 14 },
      { header: `Revenue (${f.currency})`, key: "revenue", width: 18 },
      { header: `Cash at month end (${f.currency})`, key: "cash", width: 24 },
    ];
    head(ws);
    for (const m of f.months) {
      const row = ws.addRow(m);
      row.getCell("revenue").numFmt = money;
      row.getCell("cash").numFmt = money;
    }
    const n = f.months.length + 1;
    const total = ws.addRow({ month: "Total", revenue: { formula: `SUM(C2:C${n})` } });
    total.font = bold;
    total.getCell("revenue").numFmt = money;
    ws.addRow([]);
    ws.addRow(["SYNTHETIC: simulated in Launch & Growth. Not a forecast."]).font = {
      italic: true,
      color: { argb: "FF7C3AED" },
    };
  }

  if (wb.worksheets.length === 1) {
    sum.addRow([]);
    sum.addRow([
      "Nothing to model yet",
      "Fill in Operations Setup (costs), Go-to-Market Plan (price, channels) or Launch & Growth (projection), then generate again.",
    ]).alignment = { wrapText: true, vertical: "top" };
  }
  return Buffer.from(await wb.xlsx.writeBuffer());
}
