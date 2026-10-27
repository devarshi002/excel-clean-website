/** A deliberately messy sheet: title lines, blank rows, repeated headings, mixed date styles, duplicates. */
export function sampleAoa() {
  let s = 11;
  const rnd = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const p2 = (n) => (n < 10 ? "0" : "") + n;

  const names = ["Rahul Sharma", "priya nair", "Amit Verma", "Sneha Reddy", "  Karan Mehta", "Anjali Gupta", "VIKRAM SINGH", "Neha Joshi"];
  const depts = ["Sales", "sales", "SALES ", "Marketing", "marketing", "Operations", "Ops", "Finance"];
  const regions = ["Bengaluru", "bangalore", "Mumbai", "Delhi", "delhi ", "Chennai", "Hyderabad", "Pune"];
  const status = ["Paid", "paid", "Paid", "PENDING", "Pending", "Overdue", "overdue"];

  const rows = [];
  for (let i = 1; i <= 48; i++) {
    const d = 1 + Math.floor(rnd() * 26);
    const f = Math.floor(rnd() * 4);
    const date = f === 0 ? `${p2(d)}/10/2026` : f === 1 ? `${d}-Oct-26` : f === 2 ? `2026-10-${p2(d)}` : `${p2(d)}.10.2026`;
    const amt = 800 + Math.floor(rnd() * 94000);
    const k = Math.floor(rnd() * 6);
    let a = k === 0 ? amt.toLocaleString("en-IN") : k === 1 ? `Rs. ${amt.toLocaleString("en-IN")}` : k === 2 ? `₹${amt}` : amt;
    const r = rnd();
    if (r < 0.06) a = "NA";
    else if (r < 0.1) a = null;
    rows.push([i, pick(names), pick(depts), pick(regions), date, a, pick(status)]);
  }

  const head = ["Sr", "Emp Name", "dept", "Region", "Date", "Amount (Rs)", "Status"];
  const out = [
    ["ABC Traders Pvt Ltd - Monthly Sales Report", null, null, null, null, null, null],
    ["Prepared by: Accounts   |   Do not share", null, null, null, null, null, null],
    [],
    head,
  ];
  rows.slice(0, 24).forEach((r) => out.push(r));
  out.push([], ["Subtotal (approx)", null, null, null, null, "see below", null], [], head);
  rows.slice(24).forEach((r) => out.push(r));
  out.push(rows[3].slice(), rows[10].slice(), [], ["Note: figures not verified"]);
  return out;
}
