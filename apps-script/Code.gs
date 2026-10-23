/**
 * Brett & Caitlin: RSVP backend.
 *
 * A Google Apps Script web app bound to the RSVP Google Sheet. The website calls it two ways:
 *   GET  ?name=First Last     finds the guest's party and returns only that party's names and any earlier answers
 *   POST {JSON as text/plain} saves the party's answers (one row per person, updated in place on a resubmit)
 *
 * The sheet has three tabs (see SETUP.md):
 *   Guests     Party | Name | Also known as | Plus-one
 *   Responses  Updated | Party | Guest | Kind | Attending | Meal | Dietary needs | Song request | Note | Email
 *   Settings   Deadline | <date>      Notify email | <address>   (column A is the label, column B the value)
 *
 * The guest list never leaves the sheet: a lookup must match a full first and last name, and returns
 * nothing about anyone outside that one party.
 */

var GUESTS = "Guests";
var RESPONSES = "Responses";
var SETTINGS = "Settings";
var RESPONSE_HEADERS = ["Updated", "Party", "Guest", "Kind", "Attending", "Meal", "Dietary needs", "Song request", "Note", "Email"];
var MAX_TEXT = 500;
var MIN_FILL_MS = 2500; // a person takes longer than this to fill in the form; a bot doesn't

function doGet(e) {
  return respond_(function () { return lookup_((e && e.parameter && e.parameter.name) || ""); });
}

function doPost(e) {
  return respond_(function () { return submit_(JSON.parse(e.postData.contents)); });
}

function respond_(fn) {
  var out;
  try {
    out = fn();
  } catch (err) {
    console.error(err);
    out = { ok: false, error: "server" };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- Names ----------

// "  José O'Brien-Smith " -> "jose obrien smith"
function norm_(s) {
  return String(s == null ? "" : s)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim();
}

// A typed name matches a listed one if it's the same, or has the same first and last word
// ("Mary Ellen Smith" matches "Mary Smith").
function nameMatches_(typed, listed) {
  var a = norm_(typed), b = norm_(listed);
  if (!a || !b) return false;
  if (a === b) return true;
  var ta = a.split(" "), tb = b.split(" ");
  return ta.length > 1 && tb.length > 1 && ta[0] === tb[0] && ta[ta.length - 1] === tb[tb.length - 1];
}

// ---------- Sheet access ----------

function sheet_(name) {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) throw new Error("Missing tab: " + name);
  return sh;
}

function guests_() {
  var rows = sheet_(GUESTS).getDataRange().getValues().slice(1);
  var out = [];
  rows.forEach(function (r) {
    var party = String(r[0]).trim(), name = String(r[1]).trim();
    if (!party || !name) return;
    var aliases = String(r[2] || "").split(",").map(function (s) { return s.trim(); }).filter(String);
    out.push({ party: party, name: name, names: [name].concat(aliases), plusOne: /^(y|yes|true|1)$/i.test(String(r[3]).trim()) });
  });
  return out;
}

function settings_() {
  var out = {};
  sheet_(SETTINGS).getDataRange().getValues().forEach(function (r) { out[norm_(r[0])] = r[1]; });
  return out;
}

// RSVPs close at the end of the deadline day (the script's time zone is America/New_York).
function isClosed_(settings) {
  var d = settings["deadline"];
  if (!(d instanceof Date)) return false;
  var end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  return new Date() >= end;
}

function findParty_(typedName) {
  var all = guests_();
  var hits = all.filter(function (g) { return g.names.some(function (n) { return nameMatches_(typedName, n); }); });
  var parties = hits.map(function (g) { return g.party; }).filter(function (p, i, a) { return a.indexOf(p) === i; });
  if (parties.length !== 1) return { error: parties.length ? "ambiguous" : "not_found" };
  return { id: parties[0], members: all.filter(function (g) { return g.party === parties[0]; }) };
}

function existing_(partyId) {
  var rows = sheet_(RESPONSES).getDataRange().getValues().slice(1);
  return rows.filter(function (r) { return String(r[1]) === partyId; }).map(function (r) {
    return { guest: String(r[2]), kind: String(r[3]), attending: String(r[4]), meal: String(r[5]), dietary: String(r[6]), song: String(r[7]), note: String(r[8]), email: String(r[9]) };
  });
}

// ---------- Lookup ----------

function lookup_(typedName) {
  if (norm_(typedName).split(" ").length < 2) return { ok: false, error: "full_name" };
  var settings = settings_();
  var party = findParty_(typedName);
  if (party.error) return { ok: false, error: party.error };
  var deadline = settings["deadline"] instanceof Date ? Utilities.formatDate(settings["deadline"], "America/New_York", "yyyy-MM-dd") : null;
  return {
    ok: true,
    closed: isClosed_(settings),
    deadline: deadline,
    party: {
      id: party.id,
      guests: party.members.map(function (g) { return g.name; }),
      plusOne: party.members.some(function (g) { return g.plusOne; }),
    },
    responses: existing_(party.id),
  };
}

// ---------- Submit ----------

// Plain text, trimmed and capped. A leading = + - @ would make Sheets treat it as a formula, so it's escaped.
function clean_(s) {
  var t = String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function attending_(v) {
  if (v === "yes" || v === "no") return v === "yes" ? "Yes" : "No";
  throw new Error("bad attending value");
}

function submit_(body) {
  body = body || {};
  // The hidden "website" field is only ever filled in by bots: accept quietly, save nothing.
  if (body.website) return { ok: true };
  if (typeof body.elapsed !== "number" || body.elapsed < MIN_FILL_MS) return { ok: false, error: "too_fast" };

  var settings = settings_();
  if (isClosed_(settings)) return { ok: false, error: "closed" };

  var party = findParty_(body.lookupName || "");
  if (party.error || party.id !== body.party) return { ok: false, error: "not_found" };

  var answers = Array.isArray(body.guests) ? body.guests : [];
  var rows = [];
  party.members.forEach(function (m) {
    var a = answers.filter(function (x) { return x && x.name === m.name; })[0];
    if (!a) throw new Error("missing answer for a party member");
    var yes = attending_(a.attending) === "Yes";
    rows.push({ guest: m.name, kind: "Guest", attending: yes ? "Yes" : "No", meal: yes ? clean_(a.meal) : "", dietary: yes ? clean_(a.dietary) : "" });
  });
  var allowsPlusOne = party.members.some(function (m) { return m.plusOne; });
  if (allowsPlusOne && body.plusOne && body.plusOne.attending === "yes" && clean_(body.plusOne.name)) {
    rows.push({ guest: clean_(body.plusOne.name), kind: "Plus-one", attending: "Yes", meal: clean_(body.plusOne.meal), dietary: clean_(body.plusOne.dietary) });
  } else if (allowsPlusOne) {
    rows.push({ guest: "", kind: "Plus-one", attending: "No", meal: "", dietary: "" });
  }

  var song = clean_(body.song), note = clean_(body.note), email = clean_(body.email);
  var now = new Date();

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = sheet_(RESPONSES);
    var values = sh.getDataRange().getValues();
    if (values.length === 0 || String(values[0][0]) !== RESPONSE_HEADERS[0]) {
      sh.getRange(1, 1, 1, RESPONSE_HEADERS.length).setValues([RESPONSE_HEADERS]);
      values = sh.getDataRange().getValues();
    }
    // One row per party member, plus one for the plus-one; a resubmit overwrites the same rows.
    var keyOf = function (partyId, kind, guest) { return partyId + "|" + kind + "|" + (kind === "Plus-one" ? "" : norm_(guest)); };
    var at = {};
    for (var i = 1; i < values.length; i++) at[keyOf(String(values[i][1]), String(values[i][3]), String(values[i][2]))] = i + 1;
    rows.forEach(function (r) {
      var line = [now, party.id, r.guest, r.kind, r.attending, r.meal, r.dietary, song, note, email];
      var rowNum = at[keyOf(party.id, r.kind, r.guest)];
      if (rowNum) sh.getRange(rowNum, 1, 1, line.length).setValues([line]);
      else sh.appendRow(line);
    });
  } finally {
    lock.releaseLock();
  }

  notify_(settings, party.id, rows, song, note, email);
  return { ok: true, saved: rows.filter(function (r) { return r.guest; }).map(function (r) { return { guest: r.guest, attending: r.attending }; }) };
}

function notify_(settings, partyId, rows, song, note, email) {
  var to = String(settings["notify email"] || "").trim() || Session.getEffectiveUser().getEmail();
  if (!to) return;
  var yes = rows.filter(function (r) { return r.attending === "Yes"; }).length;
  var no = rows.filter(function (r) { return r.attending === "No" && r.guest; }).length;
  var lines = rows.filter(function (r) { return r.guest; }).map(function (r) {
    return "- " + r.guest + (r.kind === "Plus-one" ? " (plus-one)" : "") + ": " + (r.attending === "Yes" ? "coming" : "not coming") +
      (r.meal ? ", meal: " + r.meal : "") + (r.dietary ? ", dietary: " + r.dietary : "");
  });
  if (song) lines.push("", "Song request: " + song);
  if (note) lines.push("", "Note: " + note);
  if (email) lines.push("", "Email: " + email);
  try {
    MailApp.sendEmail(to, "RSVP from " + rows[0].guest + " (" + yes + " coming, " + no + " not)", lines.join("\n"));
  } catch (err) {
    console.error(err); // the RSVP is saved even if the email can't go out (e.g. the daily quota is used up)
  }
}
