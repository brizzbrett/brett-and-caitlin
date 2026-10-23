# Brett & Caitlin wedding website: plan

## Context
Brett and Caitlin marry on **Sunday, May 2, 2027 at Dover Hall**, 1500 Manakin Rd, Manakin-Sabot, VA 23103 (Goochland County, near Richmond). The ceremony and reception are both at the venue. They want a wedding website with every common section:
- countdown
- our story
- schedule
- travel and hotels
- an RSVP that collects responses
- registry
- FAQ
- photo gallery

The vibe is **Midsommar, the Swedish festival look, not the film**, inspired by the venue's own "Midsummer at Dover Hall" styled event.

Hosting is **GitHub Pages for now, moving to their own domain later**, set up like `troop-master-site`.

Timing: save-the-dates usually go out 6–8 months ahead, which is now, so the site should be live early in the work, with "coming soon" states for details that aren't decided yet.

**Decisions made:**
- **Look:** the "Blend" direction.
- **RSVP:** a Google Sheet and Apps Script backend.
- **Privacy:** noindex only, with no guest data in the repo.
- **Repo:** `brizzbrett/brett-and-caitlin`, served at `https://brizzbrett.github.io/brett-and-caitlin/`.

## Research findings that shape the site
- **The venue is English Tudor-style, not Georgian:** red-brown brick, half-timber, a fieldstone tower, Gothic arched windows, a dark-oak ballroom and oxblood velvet. It was built in 2000 on 55 acres and has been an event venue since 2014. The design borrows **arched photo masks** from the windows.
- **The venue's Midsummer event, the source of the look:**
  - a ribbon maypole hung from a wreath over the fireplace
  - mismatched **block-print tablecloths** in tangerine, lemon, cobalt, chartreuse, leaf green and pink
  - moss runners with poppies, ranunculus and cosmos
  - black-and-white scalloped plates
  - **flat die-cut paper flowers** with white linework as place cards (Matisse crossed with Marimekko)

  The photos are © Abby Jiu Photography and are used for inspiration only. Every ornament on the site is drawn from scratch.
- **The calendar:** May 2 isn't midsummer. Swedish Midsummer 2027 is June 25, and the wedding falls in **Valborg** weekend, Sweden's April 30 bonfire welcome to spring. This is offered as an optional copy hook, for example a Valborg-themed welcome party, not forced into the site.
- **The seven flowers:** on Midsummer night, Swedes pick seven wildflowers to dream of their future spouse. The site has **exactly seven pages**, so each page gets one flower icon: ox-eye daisy, cornflower, buttercup, clover, wood cranesbill, harebell, poppy.
- **Guest logistics:**
  - **Getting there:** RIC airport is about 35–45 minutes away. Amtrak **Staples Mill Road** is about 25 minutes away; point guests there, not to Main St. CHO is about 1 hr 20, and DCA/IAD are 2.5–3 hrs.
  - **Parking:** free, up to 175 cars, no valet. Cars can stay overnight but must be collected by 11am. Uber and Lyft need scheduling ahead.
  - **Accessibility:** ADA accessible with an elevator.
  - **Rain plan:** the Grand Ballroom. The call is made by noon the day before.
  - **Evening:** sunset is about 8:00 PM, highs are about 75°F and lows about 53°F, so a cool evening; suggest a layer.
  - **Footwear:** there's gravel and lawn underfoot, so suggest block heels.
  - **End time:** about 11pm.
- **Hotels:** the venue's partner rates are with **Hyatt House Short Pump, Aloft Richmond West and Residence Inn Richmond Northwest**. Other options:
  - Residence Inn at the Notch, about 11 minutes, the closest
  - Hilton Short Pump
  - in town: The Jefferson and Quirk, about 30 minutes
- **Things to do:** VMFA, Maymont, Lewis Ginter, Belle Isle and the James River, Carytown, Scott's Addition breweries, Hardywood West Creek about 4 miles away, and nearby wineries. 7 Lady Vineyards' tasting room on the estate may be open by then.
- **To confirm with the Dover Hall Event Manager, so it isn't published yet:**
  - the GPS entrance (Millers Ln?)
  - the on-site room count (10 suites or 5 bedrooms?)
  - the music cutoff
  - whether 7 Lady will be open

## Tech (reusing the troop-master-site setup)
- **Eleventy v3 with Nunjucks**, plain CSS and a little vanilla JS. `@11ty/eleventy-img` makes responsive WebP images. `HtmlBasePlugin` handles the `/brett-and-caitlin/` path prefix. All of this is copied from `troop-master-site/eleventy.config.js`, minus the RSS feed.
- **Copied and adapted from `troop-master-site/`:**
  - `.github/workflows/pages.yml`, unchanged
  - `package.json` scripts (`build`, `build:pages`, `start`, `check`)
  - `.htmlvalidate.json`
  - `tools/shoot.mjs`, `serve.mjs`, `check-links.mjs`, `lighthouse.mjs`
  - `make-brand.mjs`, adapted for the favicon and the 1200×630 share card shown when the link is texted
- **New local folder:** `D:/Desktop/Software Dev/brett-and-caitlin`, linked to a new **public** repo `brizzbrett/brett-and-caitlin`. Creating the repo is the one outward-facing step, and approving this plan covers it.
- **`src/_data/site.json` holds all settings in one place:**
  - the names, date and time, and venue
  - `url`
  - `rsvpEndpoint`, `rsvpDeadline` and `meals`, any of which can be null
  - `registries[]`
  - `hotelBlocks[]`
  - `contactEmail`

  Any value left null shows a styled "Details coming soon" note instead of a broken or empty section, the same pattern as `kitFormId` in the troop site.
- **Privacy:** `<meta name="robots" content="noindex,nofollow">` on every page, plus a `robots.txt` that disallows all crawlers. **No guest names, addresses or parties anywhere in the repo or the build.** `.gitignore` covers `*.csv` and `guests*`.
- **Custom domain later:** add a `CNAME` file and change `site.json.url`. That's a one-edit switch, noted in the README.

## Design: the "Blend" direction
- **Palette:** an airy meadow base with block-print accents.

  | Name | Hex | Use |
  |---|---|---|
  | Linen | `#FBF7EE` | background |
  | Birch ink | `#23302A` | body text, 12.9:1 |
  | Fern | `#2F5D3A` | headings and buttons |
  | Cornflower | `#3A57A6` | links |
  | Poppy | `#B23A1C` (`#C8401F` for large text and fills) | |
  | Buttercup | `#F2C230` | fills only |
  | Clover | `#F4C3CB` | fills only |
  | Sky | `#DCE8F2` | section background |

  Every pairing is checked for at least 4.5:1 contrast.
- **Dark mode, "Ljusa natten" (the light night):** dusk navy `#1B2440` with cream text `#F3EEDF`, buttercup and clover accents, and light cornflower `#9DB4EA` for links. It follows `prefers-color-scheme`.
- **Type:** **Fraunces** for display, using the variable SOFT and WONK axes, with italic for the names. **Schibsted Grotesk** for body text; it was designed for Swedish publisher Schibsted. Both are OFL and self-hosted through `@fontsource-variable`, with the licenses copied in.
- **Ornaments, all hand-built inline SVG:**
  - the seven paper-cut flower icons: flat fill with white linework
  - a maypole monogram, also used as the favicon
  - **block-print pattern bands** between sections, one "tablecloth" colorway per page, with a 1px misregistration for a hand-printed feel
  - wavy ribbon dividers
  - scalloped buttons and cards, taken from the umbrella and the plates
  - **arched photo masks**
- **Signature moment:** the Home hero **maypole raises itself**:
  1. the pole draws in with an SVG stroke animation
  2. the two wreaths bloom flower by flower
  3. six ribbons unfurl, the last pointing to RSVP

  The countdown sits in a flower ring below it. Under `prefers-reduced-motion` it shows fully drawn.
- **Avoid:** Dala horses everywhere, blue-and-yellow flags, fake umlauts, runes, and anything from the film (blackletter type, the temple, the flower-mound dress, a bleached film-still look).
- I'll load the `frontend-design` skill before building the design system.

## Pages (7, one flower each)
1. **Home** (ox-eye daisy)
   - Hero: the maypole, the names, "Sunday, May 2, 2027 · Dover Hall · Manakin-Sabot, Virginia", and the countdown.
   - **Add to calendar:** a static `.ics` file plus a Google Calendar link.
   - Teaser cards linking to the other pages, and an RSVP button. The button shows the deadline, or "RSVP opens soon".
2. **Our Story** (cornflower): how we met, the proposal, and the wedding party (optional). The **photo gallery** has engagement photos in arched and masonry crops with a lightbox; wedding photos are added after May 2.
3. **Schedule** (buttercup):
   - Ceremony, cocktail hour, reception and send-off. Times are TBD and show as "Times coming soon" until set.
   - Optional rows for a Saturday welcome party and the rehearsal.
   - Map link, rain plan line, and the sunset photo note.
4. **Travel & Stay** (clover):
   - Airports and trains with drive times.
   - Driving directions from I-64/288 and Short Pump.
   - Hotel cards: room-block code and cutoff when they have them; partner hotels otherwise.
   - Parking and rideshare.
   - **Things to Do in Richmond.**
5. **RSVP** (wood cranesbill): the party-lookup form, described in the next section.
6. **Registry** (harebell): one card per store from `registries[]`, plus a short gifts note and an optional honeyfund link.
7. **FAQ** (poppy): an accordion covering:
   - arrival time and dress code (outdoor lawn, block heels, a layer for after sunset)
   - kids and plus-ones (a policy to set)
   - unplugged ceremony, accessibility, parking and rideshare
   - weather and rain plan
   - the Sunday wedding and Monday travel
   - dietary needs (handled in the RSVP), gifts, and who to contact

Plus a **404 page**, `robots.txt`, and a footer with "Made with love", the contact email and the date.

## RSVP: Google Sheet and Apps Script
- **Sheet in Brett's Google account:**
  - a `Guests` tab with party ID, guest name, alternate names, and plus-one allowed
  - a `Responses` tab with timestamp, party, guest, attending, meal, dietary needs, song request, and a note
  - a `Settings` tab with the deadline
- **`apps-script/Code.gs`** is committed to the repo. It contains code only, no data.
  - **`doGet?q=name`** normalizes the name and fuzzy-matches it, then returns **only that party's first names and full names**, never addresses or other parties.
  - **`doPost`** reads the body with `JSON.parse(e.postData.contents)`. It holds `LockService` while it **upserts** one row per guest, rejects the request after the deadline or for unknown names, and emails Brett through `MailApp`.
- **The client:**
  - Sends a `fetch` POST with `Content-Type: text/plain`. That avoids the CORS preflight, which Apps Script can't answer, and lets the request follow the 302 to `googleusercontent`.
  - Steps: find your invitation, answer for each person, review, confirm. Returning guests can look themselves up again to change answers.
  - Spam checks: a honeypot field and a minimum time to submit.
  - The meal question appears only when `site.json.meals` is set.
- **`apps-script/SETUP.md`** is a click-by-click guide for Brett:
  1. Make the Sheet from the template columns.
  2. Paste the script.
  3. Deploy with "Execute as: Me" and "Anyone".
  4. Send me the `/exec` URL.

  Each later code change needs a new deployment version; the guide says so.
- **Until `rsvpEndpoint` is set,** the RSVP page shows "RSVPs open with the invitations."
- **Default deadline:** about April 4, 2027 (4 weeks out), stored in `site.json` and the sheet's Settings tab so it's easy to change.

## Phases (a commit at the end of each; `PLAN.md` kept in the repo)
- **P0:** create the repo, scaffold Eleventy and `site.json`, add the base layout with nav, noindex and the Pages workflow, and deploy a "hello" page. Confirm the github.io URL loads.
- **P1:** **`CONTENT.md`**, the copy for every page as a table, with blanks marked **[ASK]**. It goes to Brett and Caitlin for review before anything is wired in. It includes a short questionnaire covering:
  - how they met and the proposal
  - the wedding party
  - kids, plus-ones and dress code
  - the meal format
  - the contact person
  - whether to use the Valborg welcome party idea
- **P2:** the design system (tokens, fonts, light and dark mode), the SVG ornament set (seven flowers, maypole, block-print bands, ribbon, scallops, arch mask), then the Home page with the maypole hero, countdown and `.ics`.
- **P3:** Our Story and the gallery, Schedule, Travel & Stay, Registry, FAQ and 404, with placeholder states wherever data is null.
- **P4:** RSVP: the Apps Script, `SETUP.md` and the form UI. Brett deploys the script, then an end-to-end test with a fake "Test Guest" party, which is deleted from the Sheet afterward.
- **P5:** the share card and favicon through `make-brand.mjs`, a polish pass, the full verification below, then go live and send the URL.

## Verification
- `npm run check`: the build, the link check (`tools/check-links.mjs`) and `html-validate`.
- `node tools/shoot.mjs <page/>` on every page, at 1440px and 400px wide, in light and dark mode and with reduced motion. I look at every screenshot before calling a page done.
- Lighthouse through `tools/serve.mjs` plus `tools/lighthouse.mjs`, aiming for 90 or higher on Performance, Accessibility and Best Practices. SEO will be low on purpose because of noindex.
- **Privacy grep:** search `_site` and the git history for any test or guest names. Confirm every page has the noindex tag and that `robots.txt` disallows all.
- **RSVP:**
  - `curl -L` a GET lookup and check it returns the test party only.
  - A Playwright run of the full form: lookup, answer, submit. Confirm the rows land in the Sheet and the notification email arrives.
  - Resubmit, and confirm the rows are updated rather than duplicated.
  - A submit after the deadline, and a submit with an unknown name, are both rejected.
- **Countdown:** check it reads correctly in the America/New_York timezone, and that the `.ics` file imports into Google Calendar.
- **Live:** load the github.io URL after P0 and P5.

## Brett & Caitlin's to-dos (outside the code)
- Answer the `CONTENT.md` questionnaire: your story, the wedding party, the policies, the meal format, the contact person.
- **Engagement photos.** Put the originals in a folder and point me to it.
- Your schedule times, once they're set.
- Hotel room blocks: book them, then send me the codes and cutoff dates.
- Your registry share URLs.
- Make the Google Sheet and deploy the script by following `SETUP.md`. I'll write it.
- Ask the Dover Hall Event Manager about the GPS entrance, the on-site rooms and the music cutoff.
- Later: buy the custom domain, and I'll switch the site over to it.
