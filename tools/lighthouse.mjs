// Runs Lighthouse (mobile) on a few pages and prints the four category scores plus each failed audit.
// Usage: node tools/lighthouse.mjs <base-url> [page ...]   e.g. node tools/lighthouse.mjs http://127.0.0.1:8089 / game/ press/
import { chromium } from "playwright";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const base = (process.argv[2] ?? "http://127.0.0.1:8089").replace(/\/$/, "");
const pages = (process.argv.slice(3).length ? process.argv.slice(3) : ["/"]).map((p) => (p.startsWith("/") ? p : "/" + p));

const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ["--headless=new"] });
try {
  for (const p of pages) {
    const { lhr } = await lighthouse(base + p, {
      port: chrome.port, output: "json", logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    });
    const scores = Object.values(lhr.categories).map((c) => `${c.title} ${Math.round(c.score * 100)}`).join(" · ");
    console.log(`\n${p}  ${scores}`);
    const m = lhr.audits;
    console.log(`  LCP ${m["largest-contentful-paint"].displayValue} · CLS ${m["cumulative-layout-shift"].displayValue} · TBT ${m["total-blocking-time"].displayValue}`);
    for (const cat of Object.values(lhr.categories)) {
      for (const ref of cat.auditRefs) {
        const a = m[ref.id];
        if (ref.weight > 0 && a.score !== null && a.score < 0.9) {
          console.log(`  [${cat.title}] ${a.title}${a.displayValue ? ` (${a.displayValue})` : ""}`);
          for (const item of (a.details?.items ?? []).slice(0, 6)) {
            const n = item.node ?? item;
            if (n?.snippet || n?.url) console.log(`      ${(n.snippet ?? n.url).slice(0, 140)}${item.node?.explanation ? "  -- " + item.node.explanation.split("\n").pop().slice(0, 90) : ""}`);
          }
        }
      }
    }
  }
} finally {
  await chrome.kill();
}
