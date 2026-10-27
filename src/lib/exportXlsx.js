import * as XLSX from "xlsx";
import { aggregate } from "./analyse.js";
import { isMoneyHeader, isoToSerial } from "./format.js";

/** Build the downloadable workbook: Clean Data, Summary and What Changed sheets. */
export function buildWorkbook(res, view, fileName) {
  const { headers: H, types, rows } = res;
  const wb = XLSX.utils.book_new();

  // 1. Clean data (dates written as real Excel dates)
  const aoa = [H, ...rows.map((row) => row.map((v, k) => (v != null && types[k] === "date" ? isoToSerial(v) : v)))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  types.forEach((t, k) => {
    for (let i = 1; i < aoa.length; i++) {
      const cell = ws[XLSX.utils.encode_cell({ r: i, c: k })];
      if (!cell) continue;
      if (t === "date") cell.z = "dd-mmm-yyyy";
      else if (t === "number") cell.z = isMoneyHeader(H, k) ? "#,##0.00" : "#,##0.##";
    }
  });
  ws["!cols"] = H.map((h, k) => ({
    wch: Math.min(40, rows.reduce((w, row) => Math.max(w, row[k] == null ? 0 : String(row[k]).length), h.length) + 3),
  }));
  ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: H.length - 1 } }) };
  XLSX.utils.book_append_sheet(wb, ws, "Clean Data");

  // 2. Summary
  const m = view.measure;
  const sum = [[`Summary of ${fileName}`], [], ["Records", rows.length]];
  if (m >= 0) {
    const vals = rows.map((x) => x[m]).filter((v) => v != null);
    const total = vals.reduce((a, b) => a + b, 0);
    sum.push([`Total ${H[m]}`, total], [`Average ${H[m]}`, vals.length ? total / vals.length : null]);
  }
  [view.dimA, view.dimB, view.statusCol].forEach((d, i, arr) => {
    if (d < 0 || arr.indexOf(d) !== i) return;
    sum.push([], [H[d], m >= 0 ? `Total ${H[m]}` : "Records", "Records"]);
    aggregate(res, d, m).forEach((x) => sum.push([x.k, x.v, x.n]));
  });
  const ws2 = XLSX.utils.aoa_to_sheet(sum);
  ws2["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Summary");

  // 3. Change log
  const lg = [["Step", "Count", "What it means"], ...res.log.map((e) => [e.title, e.count, e.desc])];
  const ws3 = XLSX.utils.aoa_to_sheet(lg);
  ws3["!cols"] = [{ wch: 42 }, { wch: 8 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(wb, ws3, "What Changed");
  return wb;
}

export function downloadClean(res, view, fileName) {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "_") || "data";
  XLSX.writeFile(buildWorkbook(res, view, fileName), `clean_${base}.xlsx`);
}

/** Read an uploaded file into { sheetNames, workbook }. */
export async function readWorkbook(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  return { wb, sheetNames: wb.SheetNames.slice() };
}

export function sheetToRows(wb, name) {
  return XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: true, defval: null, blankrows: true });
}
