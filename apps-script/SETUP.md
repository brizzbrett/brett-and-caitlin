# Turning on RSVPs

The RSVP form on the site talks to a small script attached to a Google Sheet in your own Google account. The guest list and every reply stay in that Sheet; nothing about guests goes into this (public) repo. It takes about 15 minutes.

## 1. Make the Sheet

1. Go to https://sheets.new and name it something like **Wedding RSVPs**.
2. Rename the first tab to **Guests** and put these headers in row 1:

   | A | B | C | D | E |
   |---|---|---|---|---|
   | Party | Name | Also known as | Plus-one | Child |

   One row per invited person, never two names in one row. People who share an invitation share a **Party** code (any short label: `P01`, `Smiths`, …). Anyone in a party can look themselves up and reply for everyone in it, in one go.
   - **Name**: first and last, as on the invitation envelope. This is what guests type to find themselves.
   - **Also known as**: optional other names they might type, separated by commas (`Bill Smith, Will Smith`).
   - **Plus-one**: `Y` on any one row of a party lets that party bring a guest. Leave blank otherwise.
   - **Child**: `Y` for children. They're tagged on the form, skip the dinner choice, and are counted separately in Responses and in your emails.
   - Columns after E are yours for notes or formulas; the script ignores them. Don't put totals in rows under the list.

   Example:

   | Party | Name | Also known as | Plus-one | Child |
   |---|---|---|---|---|
   | P01 | Jordan Example | | Y | |
   | P02 | Alex Sample | Alexandra Sample | | |
   | P02 | Sam Sample | Samuel Sample | | |
   | P02 | Riley Sample | | | Y |

3. Add a second tab named **Responses**. Leave it empty; the script writes the headers on the first reply.
4. Add a third tab named **Settings**:

   | A | B |
   |---|---|
   | Deadline | 4/4/2027 |
   | Notify email | the address that should get an email for each RSVP |

   Make sure B1 is a real date (Format → Number → Date). RSVPs close at the end of that day, Eastern time.

## 2. Add the script

1. In the Sheet: **Extensions → Apps Script**.
2. Delete what's in `Code.gs` and paste in the whole of [`Code.gs`](Code.gs) from this folder.
3. Click the gear (**Project Settings**), tick **Show "appsscript.json" manifest file in editor**, then open `appsscript.json` in the editor and replace it with [`appsscript.json`](appsscript.json) from this folder. (This sets the time zone to Eastern and asks only for the permissions the script needs.)
4. Click **Save**.

## 3. Deploy it

1. **Deploy → New deployment**. Click the gear next to "Select type" and choose **Web app**.
2. Description: `RSVP`. **Execute as: Me**. **Who has access: Anyone**.
3. Click **Deploy**, then **Authorize access** and pick your Google account. Google warns that the app isn't verified, because you wrote it yourself: click **Advanced → Go to (project name) (unsafe)** and then **Allow**.
4. Copy the **Web app URL**. It ends in `/exec`.

## 4. Check it, then switch the site over

1. Open the URL with `?name=Jordan%20Example` (any name from your Guests tab) on the end. You should see a line of text starting `{"ok":true`. A name that isn't on the list gives `{"ok":false,"error":"not_found"}`.
2. Put the URL in `src/_data/site.json` as `"rsvpEndpoint"`, and set `"rsvpDeadline"` to the same date as the Sheet (`"2027-04-04"`). Commit and push, or send the URL to Claude.
3. Try it on the live site with a test row (for example `P99 | Test Guest`), then delete that row and its replies from both tabs.

## Changing the script later

Saving new code doesn't change what the website talks to. After any edit: **Deploy → Manage deployments → (pencil) Edit → Version: New version → Deploy**. The URL stays the same.

## Good to know

- Each RSVP emails you a summary. A personal Gmail account can send about 100 of these a day, which is plenty.
- A guest who replies again (to change an answer) updates their existing rows rather than adding new ones. The **Updated** column shows when.
- To see who hasn't replied yet, compare the two tabs, or ask Claude for a formula.
- Lookups need a full first and last name, and only ever return the one matching party, so nobody can browse the guest list.
