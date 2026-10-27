/** Colors are CSS variables (see src/index.css) so light and dark themes share one set of class names. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        line: "var(--line)",
        soft: "var(--soft)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        "accent-soft": "var(--accent-soft)",
        good: "var(--good)",
        warn: "var(--warn)",
        bad: "var(--bad)",
        neutral: "var(--neutral)",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"IBM Plex Sans"', "system-ui", "sans-serif"],
        body: ['"IBM Plex Sans"', "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
        data: ['"IBM Plex Mono"', "ui-monospace", "Menlo", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
