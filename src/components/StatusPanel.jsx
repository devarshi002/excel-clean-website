import { aggregate, isMoney, statusTone } from "../lib/analyse.js";
import { fmtVal } from "../lib/format.js";

const TONE = { good: "bg-good", warn: "bg-warn", bad: "bg-bad", neutral: "bg-neutral" };

export default function StatusPanel({ res, view }) {
  const m = view.measure;
  const rows = aggregate(res, view.statusCol, m);
  const total = rows.reduce((a, b) => a + b.v, 0) || 1;
  const money = isMoney(res, m);
  const name = res.headers[view.statusCol];

  return (
    <section className="card">
      <header className="mb-3">
        <h2 className="text-[17px]">By {name}</h2>
      </header>
      <div className="mb-3 flex h-4 gap-0.5 overflow-hidden rounded" role="img" aria-label={`Share by ${name}`}>
        {rows.map((x) => (
          <div key={x.k} className={`min-w-[3px] ${TONE[statusTone(x.k)]}`} style={{ width: `${(x.v / total) * 100}%` }} title={x.k} />
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((x) => (
          <div key={x.k} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-sm ${TONE[statusTone(x.k)]}`} />
            <span>{x.k}</span>
            <span className="text-right font-data text-[12.5px] tabular-nums text-muted">
              {x.n} records{m >= 0 ? ` · ${fmtVal(x.v, money, true)}` : ""}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
