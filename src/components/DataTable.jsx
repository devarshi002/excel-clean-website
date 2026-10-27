import { fmtDate, grp } from "../lib/format.js";

const TYPE_LABEL = { text: "Text", number: "Number", date: "Date", id: "ID" };
const LIMIT = 100;

export default function DataTable({ res }) {
  const { headers, types, rows, stats } = res;
  return (
    <>
      <div className="max-h-[460px] overflow-auto rounded-md border border-line">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {headers.map((h, k) => (
                <th key={h} className={`sticky top-0 z-[1] whitespace-nowrap border-b border-line bg-soft px-2.5 py-[7px] font-semibold ${types[k] === "number" ? "text-right" : "text-left"}`}>
                  {h}
                  <span className="tag ml-1.5">{TYPE_LABEL[types[k]]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, LIMIT).map((row, i) => (
              <tr key={i}>
                {row.map((v, k) => (
                  <Cell key={k} v={v} type={types[k]} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[12.5px] text-muted">
        {rows.length > LIMIT && `Showing the first ${LIMIT} of ${rows.length} records. The downloaded file has all of them. `}
        {stats.blanksLeft > 0 &&
          `Red dashes mark ${stats.blanksLeft} empty cells. They were blank or unreadable in the original and were not filled in.`}
      </p>
    </>
  );
}

function Cell({ v, type }) {
  const base = "whitespace-nowrap border-b border-line px-2.5 py-[7px]";
  const num = "text-right font-data tabular-nums";
  if (v == null) return <td className={`${base} font-data text-bad ${type === "number" ? "text-right" : ""}`}>{"—"}</td>;
  if (type === "number") return <td className={`${base} ${num}`}>{grp(v, v % 1 ? 2 : 0)}</td>;
  if (type === "id") return <td className={`${base} ${num}`}>{v}</td>;
  if (type === "date") return <td className={`${base} font-data`}>{fmtDate(v)}</td>;
  return <td className={base}>{v}</td>;
}
