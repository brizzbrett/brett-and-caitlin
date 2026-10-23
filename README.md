# Brett & Caitlin

The wedding website for Sunday, May 2, 2027 at Dover Hall. Built with Eleventy and deployed to GitHub Pages on every push to `main`.

- `npm start`: live preview at http://localhost:8080
- `npm run check`: build, link check, HTML validation
- `node tools/shoot.mjs [--dark] [--reduced] [page/ ...]`: desktop and phone screenshots into `shots/`
- `node tools/make-brand.mjs`: favicon PNGs and the social share card
- `node tools/test-rsvp.mjs`: the RSVP form and Apps Script backend tested together against a fake spreadsheet

Everything the couple decides lives in `src/_data/` (`site.json` for the date, times, RSVP and contacts; one file per page for the rest). A value left `null` shows a "coming soon" note on the site.

**No guest data goes in this repo.** It is public. The guest list and RSVPs live only in the Google Sheet (see `apps-script/SETUP.md`).

Moving to a custom domain: add `src/static/CNAME` containing the domain, set `url` in `site.json`, change `build:pages` to drop `--pathprefix`, and set the domain under the repo's Settings → Pages.
