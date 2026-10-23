// Screenshots of the built site (_site) at desktop and phone width, full page, into shots/.
// Usage: node tools/shoot.mjs [--dark] [--reduced] [path/ ...]   (defaults to the home page)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = path.join(root, "_site");
const outDir = path.join(root, "shots");
// Page paths may be given without the leading slash ("game/"), since Git Bash rewrites "/game/" into a Windows path.
const args = process.argv.slice(2);
const dark = args.includes("--dark"), reduced = args.includes("--reduced");
const paths = args.filter((a) => !a.startsWith("--"));
const pages = (paths.length ? paths : ["/"]).map((p) => (p.startsWith("/") ? p : "/" + p));
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp",
  ".png": "image/png", ".jpeg": "image/jpeg", ".woff2": "font/woff2", ".xml": "application/xml", ".svg": "image/svg+xml", ".ics": "text/calendar" };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(siteDir, p);
  if (!file.startsWith(siteDir) || !fs.existsSync(file)) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const problems = [];
for (const [label, viewport] of [["desktop", { width: 1440, height: 900 }], ["phone", { width: 400, height: 860 }]]) {
  const page = await browser.newPage({ viewport, colorScheme: dark ? "dark" : "light", reducedMotion: reduced ? "reduce" : "no-preference" });
  page.on("console", (m) => m.type() === "error" && problems.push(`${label} console: ${m.text()}`));
  page.on("requestfailed", (r) => problems.push(`${label} failed: ${r.url()}`));
  for (const p of pages) {
    await page.goto(base + p, { waitUntil: "networkidle" });
    // Load every lazy image before the full-page capture.
    await page.evaluate(async () => {
      document.querySelectorAll("img[loading=lazy]").forEach((i) => (i.loading = "eager"));
      await Promise.all([...document.images].map((i) => i.complete || new Promise((r) => (i.onload = i.onerror = r))));
    });
    // Scroll through once so every image is decoded and painted before the full-page capture.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
      window.scrollTo(0, 0);
    });
    // Let the maypole finish raising and the ribbons unfurl.
    await page.waitForTimeout(reduced ? 300 : 4500);
    const overflow =await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) problems.push(`${label} ${p}: page is ${overflow}px wider than the screen`);
    const name = (p === "/" ? "home" : p.replace(/^\/|\/$/g, "").replace(/\//g, "-")) + `-${label}${dark ? "-dark" : ""}${reduced ? "-still" : ""}.png`;
    await page.screenshot({ path: path.join(outDir, name), fullPage: true });
    console.log("shot", name);
  }
  await page.close();
}
await browser.close();
server.close();
console.log(problems.length ? problems.join("\n") : "no console errors, failed loads or sideways overflow");
