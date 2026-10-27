import { isMoneyHeader } from "./format.js";

/** Pick sensible default columns for the dashboard from the cleaned result. */
export function analyse(res) {
  const { headers: H, types: T, rows } = res;
  const numCols = [];
  const dimCols = [];
  let dateCol = -1;
  let statusCol = -1;

  T.forEach((t, k) => {
    if (t === "number") numCols.push(k);
    if (t === "date" && dateCol < 0) dateCol = k;
    if (t === "text") {
      const n = new Set(rows.map((r) => r[k]).filter((v) => v != null)).size;
      if (n >= 2 && n <= 25) dimCols.push(k);
      if (/status|stage|state/i.test(H[k]) && n >= 2 && n <= 8 && statusCol < 0) statusCol = k;
    }
  });

  const preferred = numCols.filter((k) => /amount|revenue|sales|total|salary|value|price|cost|qty|quantity/i.test(H[k]));
  const measure = preferred[0] ?? numCols[0] ?? -1;

  const pool = dimCols.filter((k) => k !== statusCol);
  const dimA = pool.find((k) => /dept|department|category|product|type|team/i.test(H[k])) ?? pool[0] ?? -1;
  const rest = pool.filter((k) => k !== dimA);
  const dimB =
    pool.find((k) => /region|city|location|branch|zone/i.test(H[k])) ??
    pool.find((k) => /name|employee|\bemp\b/i.test(H[k]) && k !== dimA) ??
    rest[0] ??
    -1;

  return { numCols, dimCols, dateCol, statusCol, measure, dimA, dimB };
}

/** Sum of a measure (or a record count when there is no measure) for each value of a column. */
export function aggregate(res, dim, meas) {
  const map = new Map();
  res.rows.forEach((row) => {
    const key = row[dim] ?? "(blank)";
    const e = map.get(key) ?? { k: key, sum: 0, n: 0 };
    e.n++;
    if (meas >= 0 && row[meas] != null) e.sum += row[meas];
    map.set(key, e);
  });
  return [...map.values()]
    .map((e) => ({ ...e, v: meas >= 0 ? e.sum : e.n }))
    .sort((a, b) => b.v - a.v);
}

/** Daily totals, or monthly totals when the data spans more than 45 days. */
export function trendPoints(res, dateCol, meas) {
  const byDay = {};
  res.rows.forEach((row) => {
    const d = row[dateCol];
    if (!d) return;
    byDay[d] = (byDay[d] || 0) + (meas >= 0 ? row[meas] || 0 : 1);
  });
  const days = Object.keys(byDay).sort();
  if (days.length > 45) {
    const byMonth = {};
    days.forEach((d) => {
      const k = d.slice(0, 7);
      byMonth[k] = (byMonth[k] || 0) + byDay[d];
    });
    return Object.keys(byMonth)
      .sort()
      .map((k) => ({ k, v: byMonth[k], monthly: true }));
  }
  return days.map((d) => ({ k: d, v: byDay[d], monthly: false }));
}

export function statusTone(label) {
  const l = label.toLowerCase();
  if (/paid|done|complete|approved|closed|won|active|delivered|present/.test(l)) return "good";
  if (/pending|open|progress|review|hold|partial/.test(l)) return "warn";
  if (/overdue|reject|fail|late|cancel|lost|absent|unpaid/.test(l)) return "bad";
  return "neutral";
}

export const isMoney = (res, k) => isMoneyHeader(res.headers, k);
