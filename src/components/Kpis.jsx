import { aggregate, isMoney } from "../lib/analyse.js";
import { fmtShort, fmtVal, grp } from "../lib/format.js";

export default function Kpis({ res, view }) {
  const { headers: H, rows, stats } = res;
  const m = view.measure;
  const money = isMoney(res, m);
  const tiles = [];

  if (m >= 0) {
    const vals = rows.map((r) => r[m]).filter((v) => v != null);
    const total = vals.reduce((a, b) => a + b, 0);
    tiles.push([`Total ${H[m]}`, fmtVal(total, money, true), `${vals.length} of ${rows.length} records have a value`]);
    tiles.push(["Records", grp(rows.length), `${stats.cols} columns`]);
    tiles.push(["Average per record", fmtVal(vals.length ? total / vals.length : null, money, true), `largest ${fmtVal(vals.length ? Math.max(...vals) : null, money, true)}`]);
  } else {
    tiles.push(["Records", grp(rows.length), ""], ["Columns", String(stats.cols), ""], ["Blank cells", String(stats.blanksLeft), ""]);
  }

  if (view.dimA >= 0) {
    const ag = aggregate(res, view.dimA, m);
    const total = ag.reduce((a, b) => a + b.v, 0);
    tiles.push([`Top ${H[view.dimA]}`, ag[0].k, total ? `${Math.round((ag[0].v / total) * 100)}% of ${m >= 0 ? "total" : "records"}` : ""]);
  } else if (view.dateCol >= 0) {
    const ds = rows.map((r) => r[view.dateCol]).filter(Boolean).sort();
    tiles.push(["Date range", ds.length ? `${fmtShort(ds[0])} to ${fmtShort(ds[ds.length - 1])}` : "—", ds[0]?.slice(0, 4) ?? ""]);
  } else {
    tiles.push(["Cleaned columns", String(stats.cols), ""]);
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map(([label, value, sub]) => (
        <div key={label} className="card">
          <div className="font-data text-[11px] uppercase tracking-wider text-muted">{label}</div>
          <div className="mt-1 font-display text-[22px] font-bold tracking-tight tabular-nums [overflow-wrap:anywhere] sm:text-[28px]">{value}</div>
          <div className="text-xs text-muted">{sub}</div>
        </div>
      ))}
    </div>
  );
}
