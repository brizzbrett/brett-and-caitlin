// Checks every internal link in the built site: href, src and srcset on every page must resolve to a real file,
// and every #fragment must match an id on the target page. Run after `npm run build` (no path prefix).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../_site");
const pages = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p); else if (e.name.endsWith(".html")) pages.push(p);
});
walk(siteDir);

const idsCache = new Map();
const idsOf = (file) => {
  if (!idsCache.has(file)) idsCache.set(file, new Set([...fs.readFileSync(file, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return idsCache.get(file);
};
const resolveFile = (urlPath) => {
  let f = path.join(siteDir, decodeURIComponent(urlPath));
  if (urlPath.endsWith("/")) f = path.join(f, "index.html");
  else if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  return fs.existsSync(f) ? f : null;
};

const problems = [];
let checked = 0;
for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  const pageUrl = "/" + path.relative(siteDir, page).replace(/\\/g, "/").replace(/index\.html$/, "");
  const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]+)"/g)) refs.push(...m[1].split(",").map((s) => s.trim().split(/\s+/)[0]));
  for (const ref of refs) {
    if (/^(https?:|mailto:|data:)/.test(ref)) continue;
    checked++;
    const url = new URL(ref, "http://site" + pageUrl);
    const target = resolveFile(url.pathname);
    if (!target) { problems.push(`${pageUrl}: missing ${ref}`); continue; }
    if (url.hash && target.endsWith(".html") && !idsOf(target).has(url.hash.slice(1))) problems.push(`${pageUrl}: no #${url.hash.slice(1)} on ${url.pathname}`);
  }
}
console.log(`${pages.length} pages, ${checked} internal links checked`);
console.log(problems.length ? problems.join("\n") : "no broken links");
process.exit(problems.length ? 1 : 0);
