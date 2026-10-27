import { aggregate, isMoney } from "../lib/analyse.js";
import { fmtVal, grp } from "../lib/format.js";

export default function BarPanel({ res, view, dim, selectId, onDim }) {
  const m = view.measure;
  const money = isMoney(res, m);
  const all = aggregate(res, dim, m);
  const total = all.reduce((a, b) => a + b.v, 0) || 1;
  const bars = all.slice(0, 8);
  const rest = all.slice(8);
  if (rest.length) bars.push({ k: `Other (${rest.length})`, v: rest.reduce((a, b) => a + b.v, 0) });
  const max = Math.max(...bars.map((x) => x.v)) || 1;

  return (
    <section className="card">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[17px]">{m >= 0 ? res.headers[m] : "Records"} by</h2>
        <select id={selectId} className="field" aria-label="Group by" value={dim} onChange={(e) => onDim(+e.target.value)}>
          {view.dimCols.map((k) => (
            <option key={k} value={k}>
              {res.headers[k]}
            </option>
          ))}
        </select>
      </header>
      <div className="flex flex-col gap-2">
        {bars.map((x) => (
          <div key={x.k} className="grid grid-cols-[minmax(60px,1fr)_minmax(0,2fr)_auto] items-center gap-2.5 sm:grid-cols-[minmax(70px,0.9fr)_minmax(0,2fr)_auto]">
            <div className="truncate" title={x.k}>
              {x.k}
            </div>
            <div className="h-3.5 overflow-hidden rounded-sm bg-soft">
              <div className="h-full rounded-sm bg-accent" style={{ width: `${Math.max(1, (x.v / max) * 100)}%` }} />
            </div>
            <div className="whitespace-nowrap text-right font-data text-[12.5px] tabular-nums">
              {m >= 0 ? fmtVal(x.v, money, true) : grp(x.v)}
              <i className="ml-1.5 not-italic text-muted">{Math.round((x.v / total) * 100)}%</i>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
