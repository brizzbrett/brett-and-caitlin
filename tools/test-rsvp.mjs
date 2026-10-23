// Tests the RSVP backend (apps-script/Code.gs, run in Node against an in-memory stand-in for the Google Sheet)
// and the RSVP form in a real browser talking to it. Usage: node tools/test-rsvp.mjs
// The guests here are made up; no real guest data is ever used or committed.
import vm from "node:vm";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const code = fs.readFileSync(path.join(root, "apps-script/Code.gs"), "utf8");
let failures = 0;
const check = (label, cond, detail = "") => {
  console.log(`${cond ? "ok  " : "FAIL"} ${label}${!cond && detail ? `\n     ${detail}` : ""}`);
  if (!cond) failures++;
};

// ---------- An in-memory spreadsheet with just the calls Code.gs makes ----------
function makeBackend({ deadline }) {
  const tabs = {
    Guests: [
      ["Party", "Name", "Also known as", "Plus-one"],
      ["P01", "Ada Lovelace", "Augusta Lovelace", "Y"],
      ["P02", "Grace Hopper", "", ""],
      ["P02", "Vincent Hopper", "Vince Hopper", ""],
      ["P03", "José Núñez", "", ""],
      ["P04", "Sam Lee", "", ""],
      ["P05", "Sam Lee", "", ""],
    ],
    Responses: [["Updated", "Party", "Guest", "Kind", "Attending", "Meal", "Dietary needs", "Song request", "Note", "Email"]],
    Settings: [["Deadline", deadline], ["Notify email", "couple@example.com"]],
  };
  const sheet = (name) => ({
    getDataRange: () => ({ getValues: () => tabs[name].map((r) => [...r]) }),
    getRange: (row, col, nr, nc) => ({ setValues: (vals) => { vals.forEach((v, i) => { tabs[name][row - 1 + i] = [...v]; }); } }),
    appendRow: (r) => tabs[name].push([...r]),
  });
  const mail = [];
  const ctx = {
    console: { log: console.log, error() {} }, // the script logs the errors it turns into { error: "server" }
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: (n) => (tabs[n] ? sheet(n) : null) }) },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: (s) => ({ body: s, setMimeType() { return this; } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    MailApp: { sendEmail: (to, subject, body) => mail.push({ to, subject, body }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => "owner@example.com" }) },
    Utilities: { formatDate: (d) => d.toISOString().slice(0, 10) },
  };
  vm.createContext(ctx);
  // Date objects must come from the script's own realm for `instanceof Date` to hold, as in Apps Script.
  tabs.Settings[0][1] = vm.runInContext(`new Date(${deadline.getFullYear()}, ${deadline.getMonth()}, ${deadline.getDate()})`, ctx);
  vm.runInContext(code, ctx);
  const get = (name) => JSON.parse(ctx.doGet({ parameter: { name } }).body);
  const post = (obj) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(obj) } }).body);
  return { tabs, mail, get, post, ctx };
}

const future = new Date(Date.now() + 30 * 864e5);
const past = new Date(Date.now() - 2 * 864e5);

// ---------- Backend rules ----------
{
  const b = makeBackend({ deadline: future });
  check("lookup needs a first and last name", b.get("Ada").error === "full_name");
  check("unknown name is not found", b.get("Charles Babbage").error === "not_found");
  const ada = b.get("  ada   LOVELACE ");
  check("lookup ignores case and spacing", ada.ok && ada.party.id === "P01");
  check("lookup returns only that party", ada.ok && ada.party.guests.length === 1 && ada.party.guests[0] === "Ada Lovelace");
  check("plus-one allowance is reported", ada.party.plusOne === true);
  check("alias matches", b.get("Augusta Lovelace").party?.id === "P01");
  check("middle name still matches", b.get("Grace Brewster Hopper").party?.id === "P02");
  check("accents are optional", b.get("Jose Nunez").party?.id === "P03");
  check("a name in two parties is ambiguous", b.get("Sam Lee").error === "ambiguous");
  const hop = b.get("vince hopper");
  check("nickname finds the whole party", hop.ok && hop.party.guests.join() === "Grace Hopper,Vincent Hopper");

  const base = { party: "P02", lookupName: "Vince Hopper", elapsed: 9000, song: "September", note: "=HYPERLINK(\"x\")", email: "g@example.com",
    guests: [{ name: "Grace Hopper", attending: "yes", meal: "", dietary: "no nuts" }, { name: "Vincent Hopper", attending: "no", meal: "", dietary: "ignored" }] };
  check("too-fast submit is refused", b.post({ ...base, elapsed: 500 }).error === "too_fast");
  check("honeypot submit is swallowed", b.post({ ...base, website: "spam" }).ok === true && b.tabs.Responses.length === 1);
  check("party/name mismatch is refused", b.post({ ...base, party: "P01" }).error === "not_found");
  check("missing a party member is an error", b.post({ ...base, guests: base.guests.slice(0, 1) }).error === "server");
  const r1 = b.post(base);
  check("submit saves one row per guest", r1.ok && b.tabs.Responses.length === 3, JSON.stringify(b.tabs.Responses));
  check("declined guest's dietary note is dropped", b.tabs.Responses[2][6] === "");
  check("formula-looking text is escaped", b.tabs.Responses[1][8].startsWith("'="));
  check("the couple gets an email", b.mail.length === 1 && b.mail[0].to === "couple@example.com" && /1 coming, 1 not/.test(b.mail[0].subject));
  const r2 = b.post({ ...base, guests: [{ ...base.guests[0], attending: "no" }, { ...base.guests[1], attending: "yes" }] });
  check("resubmit updates rows in place", r2.ok && b.tabs.Responses.length === 3 && b.tabs.Responses[1][4] === "No" && b.tabs.Responses[2][4] === "Yes");
  const again = b.get("Grace Hopper");
  check("lookup returns earlier answers", again.responses.length === 2 && again.responses.some((r) => r.guest === "Vincent Hopper" && r.attending === "Yes"));

  const adaBase = { party: "P01", lookupName: "Ada Lovelace", elapsed: 9000, guests: [{ name: "Ada Lovelace", attending: "yes" }] };
  b.post({ ...adaBase, plusOne: { attending: "yes", name: "Charles Babbage", meal: "", dietary: "" } });
  check("plus-one gets its own row", b.tabs.Responses.some((r) => r[1] === "P01" && r[3] === "Plus-one" && r[2] === "Charles Babbage"));
  b.post({ ...adaBase, plusOne: { attending: "no", name: "", meal: "", dietary: "" } });
  const p1 = b.tabs.Responses.filter((r) => r[1] === "P01" && r[3] === "Plus-one");
  check("plus-one change updates the same row", p1.length === 1 && p1[0][4] === "No" && p1[0][2] === "");
  b.post({ party: "P02", lookupName: "Grace Hopper", elapsed: 9000, guests: base.guests, plusOne: { attending: "yes", name: "Sneaky Extra" } });
  check("plus-one is ignored when not allowed", !b.tabs.Responses.some((r) => r[2] === "Sneaky Extra"));
  check("bad attending value is refused", b.post({ ...adaBase, guests: [{ name: "Ada Lovelace", attending: "maybe" }] }).error === "server");
}
{
  const b = makeBackend({ deadline: past });
  check("lookup after the deadline says closed", b.get("Ada Lovelace").closed === true);
  check("submit after the deadline is refused", b.post({ party: "P01", lookupName: "Ada Lovelace", elapsed: 9000, guests: [{ name: "Ada Lovelace", attending: "yes" }] }).error === "closed");
}
{
  const today = new Date();
  const b = makeBackend({ deadline: new Date(today.getFullYear(), today.getMonth(), today.getDate()) });
  check("the deadline day itself is still open", b.get("Ada Lovelace").closed === false);
}

// ---------- The form in a browser, against the backend ----------
const ENDPOINT = "https://script.google.com/macros/s/TEST/exec";
execSync("npx @11ty/eleventy --quiet", { cwd: root, env: { ...process.env, RSVP_ENDPOINT: ENDPOINT }, stdio: "inherit" });
const siteDir = path.join(root, "_site");
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(siteDir, p);
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": types[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(0);

const methods = [];
const browser = await chromium.launch();
try {
  for (const [label, viewport] of [["desktop", { width: 1280, height: 900 }], ["phone", { width: 400, height: 860 }]]) {
    const b = makeBackend({ deadline: future }); // a fresh sheet for each run
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.route(ENDPOINT + "**", async (route) => {
      const req = route.request();
      methods.push(req.method());
      let json;
      if (req.method() === "GET") json = b.get(new URL(req.url()).searchParams.get("name"));
      else if (req.method() === "POST") json = b.post(JSON.parse(req.postData()));
      else return route.fulfill({ status: 405 });
      await route.fulfill({ status: 200, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(json) });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/rsvp/`);
    await page.fill("#rsvp-name", "Nobody Here");
    await page.click("text=Find my invitation");
    await page.waitForSelector("text=We couldn't find that name");
    check(`[${label}] unknown name shows a message`, true);

    await page.fill("#rsvp-name", "Ada Lovelace");
    await page.click("text=Find my invitation");
    await page.waitForSelector("[data-rsvp-reply]:not([hidden])");
    check(`[${label}] lookup opens the reply form`, await page.isVisible("text=Bringing a guest?"));
    await page.waitForTimeout(2600); // a person takes a moment to fill this in
    await page.click("[data-rsvp-reply] button[type=submit]");
    check(`[${label}] unanswered guest is caught`, await page.isVisible("text=Please let us know whether Ada Lovelace can make it."));
    await page.getByLabel("Joyfully accepts").check();
    await page.getByLabel("Yes, I'm bringing a guest").check();
    await page.fill("#po-name", "Charles Babbage");
    await page.fill("#g0-dietary", "vegetarian");
    await page.fill("#rsvp-song", "Dancing Queen");
    await page.screenshot({ path: path.join(root, "shots", `rsvp-form-${label}.png`), fullPage: true });
    await page.click("text=Send RSVP");
    await page.waitForSelector("[data-rsvp-done]:not([hidden])");
    check(`[${label}] confirmation lists the party`, (await page.textContent("[data-rsvp-summary]")).includes("Charles Babbage: coming"));
    await page.screenshot({ path: path.join(root, "shots", `rsvp-done-${label}.png`), fullPage: true });
    const rows = b.tabs.Responses.filter((r) => r[1] === "P01");
    check(`[${label}] the reply landed in the sheet`, rows.length === 2 && rows.some((r) => r[2] === "Ada Lovelace" && r[6] === "vegetarian"));

    // Coming back: the earlier answers are filled in, and sending again updates the same rows.
    await page.goto(`http://127.0.0.1:${server.address().port}/rsvp/`);
    await page.fill("#rsvp-name", "Ada Lovelace");
    await page.click("text=Find my invitation");
    await page.waitForSelector("[data-rsvp-reply]:not([hidden])");
    check(`[${label}] earlier answers are filled in`, (await page.inputValue("#po-name")) === "Charles Babbage" && (await page.getByLabel("Joyfully accepts").isChecked()));
    await page.waitForTimeout(2600);
    await page.getByLabel("No, just me").check();
    await page.click("text=Send RSVP");
    await page.waitForSelector("[data-rsvp-done]:not([hidden])");
    const after = b.tabs.Responses.filter((r) => r[1] === "P01");
    check(`[${label}] changing the reply updates rows in place`, after.length === 2 && after.some((r) => r[3] === "Plus-one" && r[4] === "No"));
    check(`[${label}] no console errors`, errors.length === 0, errors.join("\n"));
    await page.close();
  }
  check("no CORS preflight was ever sent", !methods.includes("OPTIONS"), methods.join(","));
} finally {
  await browser.close();
  server.close();
  execSync("npx @11ty/eleventy --quiet", { cwd: root, stdio: "inherit" }); // rebuild without the test endpoint
}

console.log(failures ? `\n${failures} failed` : "\nall RSVP checks passed");
process.exit(failures ? 1 : 0);
