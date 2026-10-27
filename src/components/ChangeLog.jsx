export default function ChangeLog({ res }) {
  if (!res.log.length) return <p className="p-6 text-center text-muted">This file was already clean. Nothing needed fixing.</p>;
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {res.log.map((e) => (
        <li key={e.key} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-md border border-line px-3 py-2.5">
          <div className="min-w-[34px] text-right font-display text-xl font-bold tabular-nums">{e.count}</div>
          <div>
            <div className="font-semibold">{e.title}</div>
            <div className="text-[13px] text-muted">{e.desc}</div>
            {e.ex.length > 0 && (
              <div className="mt-0.5 flex flex-wrap gap-x-3.5 gap-y-1 font-data text-xs text-muted">
                {e.ex.map(([a, b]) => (
                  <span key={a}>
                    {a} → <b className="font-medium text-fg">{b}</b>
                  </span>
                ))}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
