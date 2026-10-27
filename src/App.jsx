import { useMemo, useState } from "react";
import { clean } from "./lib/cleaner.js";
import { analyse } from "./lib/analyse.js";
import { sampleAoa } from "./lib/sample.js";
import { downloadClean, readWorkbook, sheetToRows } from "./lib/exportXlsx.js";
import Dropzone from "./components/Dropzone.jsx";
import FileSummary from "./components/FileSummary.jsx";
import Kpis from "./components/Kpis.jsx";
import TrendChart from "./components/TrendChart.jsx";
import StatusPanel from "./components/StatusPanel.jsx";
import BarPanel from "./components/BarPanel.jsx";
import DataTable from "./components/DataTable.jsx";
import ChangeLog from "./components/ChangeLog.jsx";

const SAMPLE_NAME = "Sample: ABC Traders October sales";
const initial = { fileName: SAMPLE_NAME, isSample: true, wb: null, sheetNames: [], sheet: null, aoa: sampleAoa() };

export default function App() {
  const [source, setSource] = useState(initial);
  const [picked, setPicked] = useState({}); // dropdown choices made by the user
  const [tab, setTab] = useState("data");
  const [message, setMessage] = useState("");

  const res = useMemo(() => clean(source.aoa), [source]);
  const auto = useMemo(() => (res.error ? null : analyse(res)), [res]);
  const view = auto ? { ...auto, ...picked } : null;

  const load = (next) => {
    setSource(next);
    setPicked({});
    setMessage("");
  };

  async function handleFile(file) {
    try {
      const { wb, sheetNames } = await readWorkbook(file);
      load({ fileName: file.name, isSample: false, wb, sheetNames, sheet: sheetNames[0], aoa: sheetToRows(wb, sheetNames[0]) });
    } catch {
      setMessage("This file could not be opened. Try saving it again as .xlsx or .csv.");
    }
  }

  function handleSheet(name) {
    load({ ...source, sheet: name, aoa: sheetToRows(source.wb, name) });
  }

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-4 pb-12 pt-5">
      <header>
        <h1 className="text-[30px] tracking-tight">Sheet Saaf</h1>
        <p className="mt-1 max-w-[54ch] text-muted">
          Drop in a messy Excel file. Get a clean table, a dashboard and a fresh .xlsx back in seconds.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]" aria-label="Import">
        <Dropzone onFile={handleFile} onSample={() => load(initial)} />
        <FileSummary
          source={source}
          res={res}
          message={message}
          onSheet={handleSheet}
          onDownload={() => downloadClean(res, view, source.fileName)}
        />
      </section>

      {view && (
        <>
          <Kpis res={res} view={view} />

          {(view.dateCol >= 0 || view.statusCol >= 0) && (
            <div className={`grid gap-4 ${view.dateCol >= 0 && view.statusCol >= 0 ? "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]" : ""}`}>
              {view.dateCol >= 0 && <TrendChart res={res} view={view} onMeasure={(measure) => setPicked((p) => ({ ...p, measure }))} />}
              {view.statusCol >= 0 && <StatusPanel res={res} view={view} />}
            </div>
          )}

          {(view.dimA >= 0 || view.dimB >= 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {view.dimA >= 0 && (
                <BarPanel res={res} view={view} dim={view.dimA} selectId="dimASel" onDim={(dimA) => setPicked((p) => ({ ...p, dimA }))} />
              )}
              {view.dimB >= 0 && (
                <BarPanel res={res} view={view} dim={view.dimB} selectId="dimBSel" onDim={(dimB) => setPicked((p) => ({ ...p, dimB }))} />
              )}
            </div>
          )}

          <section aria-label="Details">
            <div className="flex gap-1 border-b border-line" role="tablist">
              {[
                ["data", "Clean data"],
                ["log", "What changed"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  type="button"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`-mb-px cursor-pointer border-b-2 px-3 py-2 font-medium ${
                    tab === id ? "border-accent text-fg" : "border-transparent text-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="pt-3">{tab === "data" ? <DataTable res={res} /> : <ChangeLog res={res} />}</div>
          </section>
        </>
      )}
    </div>
  );
}
