import { isMoney, trendPoints } from "../lib/analyse.js";
import { fmtShort, fmtVal, MON } from "../lib/format.js";

const W = 640;
const H = 230;
const L = 54;
const R = 16;
const T = 18;
const B = 30;

function label(p) {
  return p.monthly ? `${MON[+p.k.slice(5) - 1]} ${p.k.slice(2, 4)}` : fmtShort(p.k);
}

export default function TrendChart({ res, view, onMeasure }) {
  const m = view.measure;
  const title = m >= 0 ? res.headers[m] : "Records";
  const pts = trendPoints(res, view.dateCol, m);
  const money = isMoney(res, m);

  return (
    <section className="card">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[17px]">{title} over time</h2>
        {view.numCols.length > 1 && (
          <div className="flex flex-wrap items-center gap-2.5 text-muted">
            <label htmlFor="measureSel">Measure</label>
            <select id="measureSel" className="field" value={m} onChange={(e) => onMeasure(+e.target.value)}>
              {view.numCols.map((k) => (
                <option key={k} value={k}>
                  {res.headers[k]}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>
      {pts.length < 2 ? <p className="p-6 text-center text-muted">Not enough dates to draw a trend.</p> : <Chart pts={pts} money={money} />}
    </section>
  );
}

function Chart({ pts, money }) {
  const max = Math.max(...pts.map((p) => p.v)) || 1;
  const step = Math.pow(10, Math.floor(Math.log10(max / 4)) || 0);
  const nice = [1, 2, 2.5, 5, 10].map((x) => x * step).find((x) => max / x <= 5) ?? step * 10;
  const top = Math.ceil(max / nice) * nice;
  const X = (i) => L + ((W - L - R) * i) / (pts.length - 1);
  const Y = (v) => T + (H - T - B) * (1 - v / top);

  const ticks = [];
  for (let v = 0; v <= top + 1e-9; v += nice) ticks.push(v);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(" ");
  const last = pts.length - 1;
  const peak = pts.reduce((best, p, i) => (p.v > pts[best].v ? i : best), 0);
  const px = X(peak);
  const labelCount = Math.min(6, pts.length);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Trend over time">
      {ticks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke="var(--line)" />
          <text x={L - 8} y={Y(v) + 4} textAnchor="end" fill="var(--muted)" fontSize="11" fontFamily="IBM Plex Mono, monospace">
            {fmtVal(v, false, true).replace(/\.00/, "")}
          </text>
        </g>
      ))}
      <path d={`${line} L${X(last).toFixed(1)} ${Y(0)} L${X(0).toFixed(1)} ${Y(0)} Z`} fill="var(--accent)" fillOpacity="0.14" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
      {Array.from({ length: labelCount }, (_, t) => {
        const i = Math.round((t * (pts.length - 1)) / (labelCount - 1));
        return (
          <text
            key={t}
            x={X(i)}
            y={H - 8}
            textAnchor={t === 0 ? "start" : t === labelCount - 1 ? "end" : "middle"}
            fill="var(--muted)"
            fontSize="11"
            fontFamily="IBM Plex Mono, monospace"
          >
            {label(pts[i])}
          </text>
        );
      })}
      <circle cx={X(last)} cy={Y(pts[last].v)} r="4.5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />
      {peak !== last && <circle cx={px} cy={Y(pts[peak].v)} r="4" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2" />}
      <text
        x={px}
        y={Y(pts[peak].v) - 10}
        textAnchor={px > W - 90 ? "end" : px < L + 60 ? "start" : "middle"}
        fill="var(--fg)"
        fontSize="11"
        fontFamily="IBM Plex Mono, monospace"
      >
        Peak {fmtVal(pts[peak].v, money, true)} ({label(pts[peak])})
      </text>
    </svg>
  );
}
