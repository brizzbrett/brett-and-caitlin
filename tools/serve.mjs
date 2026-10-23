// Serves the built site (_site) on a fixed local port for the checkers. Usage: node tools/serve.mjs [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../_site");
const port = Number(process.argv[2] ?? 8089);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp",
  ".png": "image/png", ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".xml": "application/xml",
  ".zip": "application/zip", ".txt": "text/plain" };

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  let file = path.join(siteDir, p);
  if (!file.startsWith(siteDir)) { res.writeHead(400); return res.end(); }
  if (!fs.existsSync(file) && fs.existsSync(file + "/index.html")) file += "/index.html";
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { "Content-Type": types[".html"] });
    return fs.createReadStream(path.join(siteDir, "404.html")).pipe(res);
  }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(port, "127.0.0.1", () => console.log(`serving _site on http://127.0.0.1:${port}/`));
