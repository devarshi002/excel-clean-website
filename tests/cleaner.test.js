import { describe, expect, it } from "vitest";
import { clean, toISO, toNum } from "../src/lib/cleaner.js";
import { analyse, aggregate } from "../src/lib/analyse.js";
import { sampleAoa } from "../src/lib/sample.js";

describe("toISO", () => {
  it("reads common date styles as day-first", () => {
    expect(toISO("05/10/2026")).toBe("2026-10-05");
    expect(toISO("5-Oct-26")).toBe("2026-10-05");
    expect(toISO("2026-10-05")).toBe("2026-10-05");
    expect(toISO("05.10.2026")).toBe("2026-10-05");
    expect(toISO("Oct 5, 2026")).toBe("2026-10-05");
  });
  it("rejects impossible dates", () => {
    expect(toISO("31/02/2026")).toBeNull();
    expect(toISO("hello")).toBeNull();
  });
  it("reads Excel serial numbers only when asked", () => {
    expect(toISO(46300, true)).toMatch(/^2026-/);
    expect(toISO(46300, false)).toBeNull();
  });
});

describe("toNum", () => {
  it("strips currency and commas", () => {
    expect(toNum("Rs. 12,500").v).toBe(12500);
    expect(toNum("₹1200").v).toBe(1200);
    expect(toNum("(500)").v).toBe(-500);
  });
  it("treats NA as missing and text as unreadable", () => {
    expect(toNum("NA").missing).toBe(true);
    expect(toNum("abc").ok).toBe(false);
  });
});

describe("clean (sample sheet)", () => {
  const res = clean(sampleAoa());

  it("finds the real header and removes junk rows", () => {
    expect(res.headers).toEqual(["Sr", "Emp Name", "Dept", "Region", "Date", "Amount (Rs)", "Status"]);
    expect(res.types).toEqual(["id", "text", "text", "text", "date", "number", "text"]);
    expect(res.rows.length).toBe(48);
    expect(res.stats.rowsIn).toBe(60);
  });

  it("merges spelling variants", () => {
    const depts = new Set(res.rows.map((r) => r[2]));
    expect([...depts].sort()).toEqual(["Finance", "Marketing", "Operations", "Sales"]);
    const regions = new Set(res.rows.map((r) => r[3]));
    expect(regions.has("Bangalore")).toBe(false);
    expect(regions.has("Bengaluru")).toBe(true);
  });

  it("stores dates as ISO and amounts as numbers", () => {
    res.rows.forEach((r) => {
      expect(r[4]).toMatch(/^2026-10-\d{2}$/);
      expect(r[5] === null || typeof r[5] === "number").toBe(true);
    });
  });

  it("builds sensible dashboard defaults", () => {
    const a = analyse(res);
    expect(res.headers[a.measure]).toBe("Amount (Rs)");
    expect(res.headers[a.dateCol]).toBe("Date");
    expect(res.headers[a.statusCol]).toBe("Status");
    expect(res.headers[a.dimA]).toBe("Dept");
    expect(res.headers[a.dimB]).toBe("Region");
    const byDept = aggregate(res, a.dimA, a.measure);
    expect(byDept.reduce((s, x) => s + x.n, 0)).toBe(48);
  });
});

describe("clean (edge cases)", () => {
  it("returns an error for an empty sheet", () => {
    expect(clean([[], [null]]).error).toBeTruthy();
  });
});
