import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import App from "../src/App.jsx";

describe("App", () => {
  it("renders the sample dashboard on first load", () => {
    const html = renderToString(<App />);
    expect(html).toContain("Sheet Saaf");
    expect(html).toContain("Sample data");
    expect(html).toContain("48");
    expect(html).toContain("Download clean Excel");
    expect(html).toContain("Peak");
    expect(html).toMatch(/By\s*(<!-- -->)?\s*Status/);
    expect(html).toContain("Marketing");
  });
});
