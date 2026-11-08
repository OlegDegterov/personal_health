// Reports the size of the single-file tablet build and fails above the limit.
// Limit: SIZE_LIMIT_KB env (default 450). Writes a Markdown table to $GITHUB_STEP_SUMMARY in CI.
import { appendFileSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const FILE = "dist/tablet/garmin-dashboard.html";
const limitKb = Number(process.env.SIZE_LIMIT_KB || 450);

let buf;
try {
  buf = readFileSync(FILE);
} catch {
  console.error(`${FILE} not found — run "npm run build" first`);
  process.exit(1);
}

const kb = (n) => (n / 1024).toFixed(1);
const rawKb = buf.length / 1024;
const gzKb = gzipSync(buf, { level: 9 }).length / 1024;
const ok = rawKb <= limitKb;

console.log(
  `${FILE}: ${kb(buf.length)} KB raw, ${gzKb.toFixed(1)} KB gzip, limit ${limitKb} KB → ${ok ? "OK" : "TOO BIG"}`,
);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [
      "### Bundle size",
      "",
      "| File | Raw | Gzip | Limit | Status |",
      "| --- | ---: | ---: | ---: | :---: |",
      `| \`garmin-dashboard.html\` | ${rawKb.toFixed(1)} KB | ${gzKb.toFixed(1)} KB | ${limitKb} KB | ${ok ? "✅" : "❌"} |`,
      "",
    ].join("\n"),
  );
}

if (!ok) process.exit(1);
