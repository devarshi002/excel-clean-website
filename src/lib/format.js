export const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Columns whose header looks like money get a rupee sign. */
export const MONEY_RE = /amount|\brs\b|inr|₹|revenue|sales|salary|price|cost|value|pay|fee|expense|income|total/i;

export function grp(n, dec = 0) {
  return n.toLocaleString("en-IN", { maximumFractionDigits: dec, minimumFractionDigits: dec });
}

/** Indian-style number: 12,34,567 and compact Lakh / Crore for big values. */
export function fmtVal(n, money = false, compact = false) {
  if (n == null || Number.isNaN(n)) return "—";
  const pre = money ? "₹" : "";
  const a = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (compact) {
    if (a >= 1e7) return `${sign}${pre}${(a / 1e7).toFixed(2)} Cr`;
    if (a >= 1e5) return `${sign}${pre}${(a / 1e5).toFixed(2)} L`;
  }
  return `${sign}${pre}${grp(a, a % 1 ? 2 : 0)}`;
}

export function fmtDate(iso) {
  const [y, m, d] = iso.split("-");
  return `${+d} ${MON[+m - 1]} ${y}`;
}

export function fmtShort(iso) {
  const [, m, d] = iso.split("-");
  return `${+d} ${MON[+m - 1]}`;
}

/** Excel stores dates as day counts since 1899-12-30. */
export function isoToSerial(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 864e5;
}

export function isMoneyHeader(headers, k) {
  return k >= 0 && MONEY_RE.test(headers[k] ?? "");
}
