export default function FileSummary({ source, res, message, onSheet, onDownload }) {
  const s = res?.stats;
  const minutes = s ? Math.max(1, Math.round((s.cellFixes * 4 + s.rowFixes * 10) / 60)) : 0;

  return (
    <div className="card flex flex-col gap-2.5" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2 font-semibold [overflow-wrap:anywhere]">
        <span>{source.fileName}</span>
        {source.isSample && <span className="tag border-warn text-warn">Sample data</span>}
      </div>

      {source.sheetNames.length > 1 && (
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <label htmlFor="sheetSel">Sheet</label>
          <select id="sheetSel" className="field" value={source.sheet} onChange={(e) => onSheet(e.target.value)}>
            {source.sheetNames.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>
      )}

      {res?.error && <p className="text-bad">{res.error}</p>}
      {message && <p className="text-bad">{message}</p>}

      {s && (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 tabular-nums">
            <Stat n={s.rowsIn} label="rows in the sheet" />
            <span className="text-muted">→</span>
            <Stat n={s.rowsOut} label="clean records" />
            <div className="ml-3">
              <Stat n={s.cellFixes + s.rowFixes} label="fixes made" />
            </div>
          </div>
          <p className="text-muted">
            About {minutes} min of manual cleanup saved (estimate at 4 sec per cell and 10 sec per row).
          </p>
          <div>
            <button type="button" className="btn btn-primary" onClick={onDownload}>
              Download clean Excel
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div>
      <div className="font-display text-[26px] font-bold">{n}</div>
      <small className="block text-xs leading-tight text-muted">{label}</small>
    </div>
  );
}
