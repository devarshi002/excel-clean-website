import { useRef, useState } from "react";

export default function Dropzone({ onFile, onSample }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);

  const stop = (e) => e.preventDefault();

  return (
    <div
      className={`flex min-w-0 cursor-pointer flex-col justify-center gap-2.5 rounded-lg border-[1.5px] border-dashed border-accent p-[18px] ${
        over ? "bg-soft" : "bg-accent-soft"
      }`}
      onClick={() => input.current?.click()}
      onDragEnter={(e) => (stop(e), setOver(true))}
      onDragOver={(e) => (stop(e), setOver(true))}
      onDragLeave={(e) => (stop(e), setOver(false))}
      onDrop={(e) => {
        stop(e);
        setOver(false);
        const f = e.dataTransfer?.files?.[0];
        if (f) onFile(f);
      }}
    >
      <strong className="font-display text-lg">Drop an Excel or CSV file here</strong>
      <span className="text-muted">.xlsx, .xls or .csv. The file is read in your browser and is not uploaded anywhere.</span>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-primary" onClick={(e) => (e.stopPropagation(), input.current?.click())}>
          Choose file
        </button>
        <button type="button" className="btn" onClick={(e) => (e.stopPropagation(), onSample())}>
          Load sample data
        </button>
      </div>
      <input
        ref={input}
        type="file"
        className="hidden"
        accept=".xlsx,.xls,.csv,.xlsm"
        aria-label="Choose an Excel or CSV file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
