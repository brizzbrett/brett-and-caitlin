// Makes the brand images the site serves as-is (committed under src/static/brand/):
// the favicon PNGs from favicon.svg, and the 1200x630 social card shown when the link is shared in a text or chat.
// Run again only when the art changes: node tools/make-brand.mjs
import sharp from "sharp";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "src/static/brand");
const svg = fs.readFileSync(path.join(out, "favicon.svg"));
await sharp(svg, { density: 300 }).resize(32, 32).png().toFile(path.join(out, "favicon-32.png"));
await sharp(svg, { density: 600 }).resize(180, 180).png().toFile(path.join(out, "apple-touch-icon.png"));

// Build with the card page switched on, serve it, and photograph it with the animations finished.
execSync("npx @11ty/eleventy --quiet", { cwd: root, env: { ...process.env, BRAND: "1" }, stdio: "inherit" });
const siteDir = path.join(root, "_site");
const types = { ".html": "text/html", ".css": "text/css", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(siteDir, p);
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(0);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: "reduce" });
await page.goto(`http://127.0.0.1:${server.address().port}/_card/`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const png = await page.screenshot();
await browser.close();
server.close();
await sharp(png).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(out, "social-card.jpg"));
fs.rmSync(path.join(siteDir, "_card"), { recursive: true, force: true });
console.log("brand images written to", path.relative(root, out));
