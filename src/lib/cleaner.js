import { fmtDate } from "./format.js";

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const MISSING = /^(na|n\/a|nil|none|null|nan|-+|—|tbd|\?)$/i;
const DATE_HEAD = /date|\bday\b|dob|joined|period|month/i;
const ID_HEAD = /^(sr|s\.?\s?no|id|#|index|sl|srno|emp\s?id)\b|\b(id|code|phone|mobile|pin)$/i;

/** Known alternate spellings. Extend this list with your own company's names. */
export const ALIAS = {
  bangalore: "Bengaluru",
  bengaluru: "Bengaluru",
  blr: "Bengaluru",
  bombay: "Mumbai",
  "new delhi": "Delhi",
  ops: "Operations",
  hyd: "Hyderabad",
};

const isEmpty = (v) => v == null || (typeof v === "string" && v.trim() === "");
const countFilled = (row) => row.reduce((n, v) => n + (isEmpty(v) ? 0 : 1), 0);

function isoOf(y, m, d) {
  if (y < 100) y += 2000;
  const dt = new Date(Date.UTC(y, m, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

/** Convert many date styles to YYYY-MM-DD. Day-first (Indian) order is assumed for 05/10/2026. */
export function toISO(v, dateHeader = false) {
  let m;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const d = new Date(v.getTime() + 12 * 36e5); // noon shift avoids timezone off-by-one
    return isoOf(d.getFullYear(), d.getMonth(), d.getDate());
  }
  if (typeof v === "number") {
    if (dateHeader && v > 20000 && v < 80000) {
      return new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5).toISOString().slice(0, 10);
    }
    return null;
  }
  if (typeof v !== "string") return null;
  const s = v.trim();
  if ((m = s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/))) return isoOf(+m[1], +m[2] - 1, +m[3]);
  if ((m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/))) {
    let a = +m[1];
    let b = +m[2];
    if (b > 12 && a <= 12) [a, b] = [b, a];
    return isoOf(+m[3], b - 1, a);
  }
  if ((m = s.match(/^(\d{1,2})[\s\-/]([A-Za-z]{3,9})\.?[\s\-/,]+(\d{2,4})$/))) {
    const mo = MONTHS[m[2].slice(0, 3).toLowerCase()];
    return mo === undefined ? null : isoOf(+m[3], mo, +m[1]);
  }
  if ((m = s.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})$/))) {
    const mo = MONTHS[m[1].slice(0, 3).toLowerCase()];
    return mo === undefined ? null : isoOf(+m[3], mo, +m[2]);
  }
  return null;
}

/** Read numbers written like "Rs. 12,500", "₹1200", "(500)". Placeholders such as NA come back as missing. */
export function toNum(v) {
  if (typeof v === "number") return { ok: true, v };
  if (typeof v !== "string") return { ok: false };
  let s = v.trim();
  if (MISSING.test(s)) return { ok: true, v: null, missing: true };
  let neg = false;
  if (/^\(.*\)$/.test(s)) {
    neg = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/rs\.?|inr|₹|\$|€|£/gi, "").replace(/[,\s]/g, "");
  if (/^-?\d+(\.\d+)?$/.test(s) || /^\.\d+$/.test(s)) {
    const n = parseFloat(s);
    return { ok: true, v: neg ? -n : n };
  }
  return { ok: false };
}

function titleCase(s) {
  if (s === s.toLowerCase() || (s === s.toUpperCase() && s.length > 3)) {
    return s.toLowerCase().replace(/(^|[\s\-/(])([a-z])/g, (_, p, c) => p + c.toUpperCase());
  }
  return s;
}

/**
 * Clean a sheet given as an array of rows (what XLSX.utils.sheet_to_json({header:1}) returns).
 * Returns { headers, types, rows, log, stats } or { error }.
 */
export function clean(aoa) {
  const log = {};
  const note = (key, title, desc) => (log[key] ||= { key, title, desc, count: 0, ex: [] });
  const hit = (key, title, desc, a, b) => {
    const e = note(key, title, desc);
    e.count++;
    if (a !== undefined && e.ex.length < 3 && String(a) !== String(b) && !e.ex.some((x) => x[0] === String(a))) {
      e.ex.push([String(a), b == null ? "(blank)" : String(b)]);
    }
  };
  const D = {
    trim: ["Extra spaces trimmed", "Leading, trailing or double spaces removed."],
    case: ["Spelling and capitalisation unified", "Same value written in different ways was merged into one form (for example sales, SALES and Sales)."],
    date: ["Dates written one way", "Different date styles were converted to one standard date (day, month, year)."],
    num: ["Amounts converted to numbers", "Currency signs, commas and text were stripped so the values can be added up."],
    missing: ["Placeholders turned into blanks", "Values like NA or - are left empty instead of being treated as data."],
    bad: ["Unreadable values left blank", "Text that could not be read was left empty. Nothing was guessed."],
  };
  const h = (key, a, b) => hit(key, D[key][0], D[key][1], a, b);

  const rowsIn = aoa.length;
  let blanks = 0;
  const rows = [];
  aoa.forEach((r) => {
    if (!r || countFilled(r) === 0) blanks++;
    else rows.push(r);
  });
  const maxFill = rows.reduce((m, r) => Math.max(m, countFilled(r)), 0);
  if (!rows.length || maxFill < 2) {
    return { error: "No table found in this sheet. A table needs at least two filled columns." };
  }

  // header row = first text-only row that is nearly as full as the fullest row
  let hi = -1;
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const r = rows[i];
    if (countFilled(r) >= Math.ceil(maxFill * 0.6) && r.every((v) => isEmpty(v) || typeof v === "string")) {
      hi = i;
      break;
    }
  }
  if (hi < 0) hi = 0;
  const above = hi;
  const rawHead = rows[hi];
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);

  const cols = [];
  for (let c = 0; c < width; c++) {
    const hasHead = !isEmpty(rawHead[c]);
    const hasData = rows.slice(hi + 1).some((r) => !isEmpty(r[c]));
    if (hasHead || hasData) cols.push(c);
  }
  const headers = [];
  const seen = {};
  cols.forEach((c, k) => {
    let name = isEmpty(rawHead[c]) ? `Column ${k + 1}` : String(rawHead[c]).replace(/\s+/g, " ").trim();
    name = titleCase(name);
    if (seen[name]) {
      seen[name]++;
      name = `${name} ${seen[name]}`;
    } else seen[name] = 1;
    headers.push(name);
  });
  const headLow = cols.map((c) => String(rawHead[c] ?? "").trim().toLowerCase());

  // drop repeated heading rows, totals and footnotes
  const body = [];
  let repeated = 0;
  let junk = 0;
  const junkEx = [];
  rows.slice(hi + 1).forEach((r) => {
    const vals = cols.map((c) => r[c]);
    let same = 0;
    vals.forEach((v, k) => {
      if (headLow[k] !== "" && String(v ?? "").trim().toLowerCase() === headLow[k]) same++;
    });
    if (same >= Math.ceil(cols.length * 0.6)) {
      repeated++;
      return;
    }
    const first = String(vals[0] ?? "").trim();
    if (countFilled(vals) < Math.ceil(cols.length * 0.5) || /^(sub\s*)?total|^grand total/i.test(first)) {
      junk++;
      if (junkEx.length < 3) junkEx.push([first || "(row)", "removed"]);
      return;
    }
    body.push(vals);
  });

  // guess each column's type
  const types = headers.map((name, k) => {
    const vals = body.map((r) => r[k]).filter((v) => !isEmpty(v));
    const dateHead = DATE_HEAD.test(name);
    let nums = 0;
    let dates = 0;
    let miss = 0;
    vals.forEach((v) => {
      const n = toNum(v);
      if (n.ok && n.missing) miss++;
      else if (n.ok && !(typeof v === "number" && dateHead && v > 20000 && v < 80000)) nums++;
      if (toISO(v, dateHead)) dates++;
    });
    const n = Math.max(1, vals.length - miss);
    let t = "text";
    if (dateHead && dates / n >= 0.6) t = "date";
    else if (nums / n >= 0.7) t = "number";
    else if (dates / n >= 0.7) t = "date";
    if (t === "number" && ID_HEAD.test(name)) t = "id";
    return t;
  });

  // clean values column by column
  const out = body.map((r) => r.slice());
  headers.forEach((name, k) => {
    const t = types[k];
    if (t === "text") {
      out.forEach((r) => {
        const v = r[k];
        if (isEmpty(v)) return void (r[k] = null);
        const o = String(v);
        const s = o.replace(/\s+/g, " ").trim();
        if (s !== o) h("trim", JSON.stringify(o), JSON.stringify(s));
        if (MISSING.test(s)) {
          h("missing", s, null);
          return void (r[k] = null);
        }
        r[k] = s;
      });
      const vals = out.map((r) => r[k]).filter((v) => v != null);
      const distinct = new Set(vals.map((v) => v.toLowerCase())).size;
      const nameLike = /name|employee|\bemp\b/i.test(name);
      if (distinct <= Math.max(12, vals.length * 0.4) || nameLike) {
        const forms = {};
        vals.forEach((v) => {
          const key = v.toLowerCase();
          const f = ALIAS[key] || titleCase(v);
          forms[key] ||= {};
          forms[key][f] = (forms[key][f] || 0) + 1;
        });
        const canon = {};
        Object.keys(forms).forEach((key) => {
          let best = null;
          let bc = -1;
          Object.entries(forms[key]).forEach(([f, c]) => {
            if (c > bc) {
              bc = c;
              best = f;
            }
          });
          canon[key] = ALIAS[key] || best;
        });
        out.forEach((r) => {
          const v = r[k];
          if (v == null) return;
          const f = canon[v.toLowerCase()];
          if (f !== v) {
            h("case", v, f);
            r[k] = f;
          }
        });
      }
    } else if (t === "number" || t === "id") {
      out.forEach((r) => {
        const v = r[k];
        if (isEmpty(v)) return void (r[k] = null);
        const n = toNum(v);
        if (!n.ok) {
          h("bad", v, null);
          return void (r[k] = null);
        }
        if (n.missing) {
          h("missing", String(v).trim(), null);
          return void (r[k] = null);
        }
        if (typeof v === "string") h("num", v.trim(), n.v);
        r[k] = n.v;
      });
    } else if (t === "date") {
      const dh = DATE_HEAD.test(name);
      out.forEach((r) => {
        const v = r[k];
        if (isEmpty(v)) return void (r[k] = null);
        const iso = toISO(v, dh);
        if (!iso) {
          if (typeof v === "string" && MISSING.test(v.trim())) h("missing", v, null);
          else h("bad", v, null);
          return void (r[k] = null);
        }
        if (typeof v === "string" && v.trim() !== iso) h("date", v.trim(), fmtDate(iso));
        else if (typeof v === "number") h("date", v, fmtDate(iso));
        r[k] = iso;
      });
    }
  });

  // remove exact duplicates
  const seenKeys = new Set();
  const final = [];
  let dups = 0;
  const dupEx = [];
  out.forEach((r) => {
    const key = JSON.stringify(r);
    if (seenKeys.has(key)) {
      dups++;
      if (dupEx.length < 3) dupEx.push([String(r[1] ?? r[0]), "duplicate"]);
      return;
    }
    seenKeys.add(key);
    final.push(r);
  });

  const list = [];
  const push = (key, title, desc, count, ex = []) => {
    if (count > 0) list.push({ key, title, desc, count, ex });
  };
  push("above", "Title lines above the table removed", "Report titles and notes sitting above the real column headings.", above);
  push("blank", "Empty rows removed", "Blank rows that split the table into pieces.", blanks);
  push("rephead", "Repeated heading rows removed", "The column heading row appeared again further down the sheet.", repeated);
  push("junk", "Subtotal and note rows removed", "Rows that were totals or footnotes and not real records.", junk, junkEx);
  push("dups", "Duplicate rows removed", "Rows that were exact copies of an earlier row.", dups, dupEx);
  const cellKeys = ["trim", "case", "date", "num", "missing", "bad"];
  cellKeys.forEach((k) => log[k] && list.push(log[k]));

  const cellFixes = cellKeys.reduce((n, k) => n + (log[k]?.count ?? 0), 0);
  const rowFixes = above + blanks + repeated + junk + dups;
  const blanksLeft = final.reduce((n, r) => n + r.filter((v) => v == null).length, 0);

  return {
    headers,
    types,
    rows: final,
    log: list,
    stats: { rowsIn, rowsOut: final.length, cellFixes, rowFixes, blanksLeft, cols: headers.length },
  };
}
