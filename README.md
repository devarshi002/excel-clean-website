# Sheet Saaf

Upload a messy Excel or CSV file and get back:

- a **clean table** (real header found, junk rows removed, one style for dates, amounts and spellings)
- an **auto-built dashboard** (KPIs, trend over time, status split, two ranked charts)
- a **fresh .xlsx** with three sheets: Clean Data, Summary and What Changed

Everything runs in the browser. Files are never uploaded to a server.

Built with React 18, Vite, Tailwind CSS 3 and SheetJS (`xlsx`).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # cleaning engine tests
npm run build      # production build in dist/
npm run preview    # serve the production build locally
```

## What the cleaner does

| Problem in the sheet | What happens |
| --- | --- |
| Title or notes above the table | Removed, the real header row is detected |
| Blank rows, repeated heading rows | Removed |
| Subtotal, total and footnote rows | Removed |
| Exact duplicate rows | Removed |
| `05/10/2026`, `5-Oct-26`, `2026-10-05`, Excel serials | One standard date (day-first order assumed) |
| `Rs. 12,500`, `₹1200`, `(500)` | Real numbers |
| `sales`, `SALES `, `Sales` | One spelling, whitespace trimmed |
| `NA`, `-`, unreadable text | Left blank. Nothing is guessed |

Every fix is counted and shown in the **What changed** tab with before and after examples.

## Project layout

```
src/
  App.jsx                    page layout and state
  lib/
    cleaner.js               the cleaning engine (pure functions, tested)
    analyse.js               picks dashboard columns, aggregates, trend points
    format.js                Indian number format (Lakh / Crore), dates
    exportXlsx.js            reads uploads and writes the clean workbook
    sample.js                a deliberately messy demo sheet
  components/                Dropzone, FileSummary, Kpis, TrendChart,
                             StatusPanel, BarPanel, DataTable, ChangeLog
tests/cleaner.test.js
```

## Customise

- **Merge your own names.** Add entries to `ALIAS` in `src/lib/cleaner.js`, for example `"blr": "Bengaluru"`.
- **Currency.** Change the rupee sign and Lakh/Crore formatting in `src/lib/format.js`.
- **Which headers count as money, dates, IDs.** Regular expressions at the top of `cleaner.js` and `format.js`.
- **Colors and fonts.** CSS variables in `src/index.css`. Light and dark themes are both defined there.

## Deploy

It is a static site, so any static host works.

**Netlify or Vercel:** connect the repo. Build command `npm run build`, output directory `dist`.

**GitHub Pages:** run `npm run build` and publish the `dist` folder. If the site lives under a sub-path (`/repo-name/`), set `base: "/repo-name/"` in `vite.config.js`.

**Your own server:** copy the `dist` folder to any web root (nginx, Apache, S3 + CloudFront).

## Known limits

- Dates like `05/10/2026` are read as day/month/year. US-style month-first files need a small change in `toISO`.
- Only values that are the same word written differently are merged. Real misspellings (`Bangalor`) are not detected unless added to `ALIAS`.
- Very large files (hundreds of thousands of rows) will be slow because everything is processed in the browser tab.
- The preview table shows the first 100 rows. The downloaded file has all rows.
