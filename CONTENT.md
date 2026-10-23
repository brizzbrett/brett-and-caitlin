# What the site still needs from Brett & Caitlin

The site is live with "coming soon" notes wherever something isn't decided. Each item below says where it goes. You can edit the file yourself, or just send Claude the answers.

## Things only you can write

| What | Where it goes | Until then the site shows |
|---|---|---|
| How you met, the proposal (a few short paragraphs each, a photo optional) | `src/_data/story.json` → `chapters` | "Our story is on its way" |
| Engagement photos (originals are fine; they're resized automatically) | put files in `src/assets/photos/`, list them in `src/_data/gallery.json` as `{ "file": "name.jpg", "alt": "what's in the photo" }` | "Engagement photos are coming" |
| Wedding party: names, roles, optional photos | `src/_data/story.json` → `party` | (section hidden) |
| A contact email for guest questions | `src/_data/site.json` → `contactEmail` | (FAQ question and footer line hidden) |

## Decisions

| Question | Where | Until then |
|---|---|---|
| Ceremony time, and the times of the other parts of the day | `site.json` → `ceremonyTime` (`"16:30"` style), `schedule.json` → `day[].time` | "Time to come"; the calendar file is an all-day event |
| Any weekend events (welcome party Saturday, rehearsal dinner, Monday brunch)? One idea: Saturday May 1 falls on Valborg weekend, Sweden's bonfire welcome to spring, which would make a natural welcome-party theme | `schedule.json` → `weekend` | (section hidden) |
| Dress code | the "What should I wear?" answer in `faq.json` | "We'll share the dress code with the invitations" |
| Plus-ones: only named guests, or some parties? | the "Can I bring a date?" answer in `faq.json`, plus the `Plus-one` column in the Sheet | (question hidden) |
| Kids invited? | the "Are kids invited?" answer in `faq.json` | (question hidden) |
| Unplugged ceremony? | the "Can I take photos during the ceremony?" answer in `faq.json` | (question hidden) |
| Dinner choices to ask about in the RSVP (plated) or none (buffet/stations) | `site.json` → `meals`, e.g. `["Beef", "Fish", "Vegetarian"]` | no meal question |
| Wedding hashtag | `site.json` → `hashtag` | none |
| Registry links | `src/_data/registries.json`: `{ "name": "Zola", "url": "...", "note": "optional" }`. Use each store's public share link, not the one in your browser bar | "Our registry is coming" |
| Hotel room blocks | `travel.json` → `hotelBlocks`: `{ "name", "address", "drive", "code", "cutoff": "2027-04-01", "url" }` | "Room blocks are coming" plus the list of nearby hotels |

## Assumptions to confirm (already on the site)

- **RSVP deadline: Sunday, April 4, 2027** (four weeks out, so the caterer gets a count about two weeks before). Change it in `site.json` → `rsvpDeadline` and in the Sheet's Settings tab.
- "Please arrive about 30 minutes early" (Schedule, FAQ).
- "The night wraps up around 11 PM" (Schedule). That's Dover Hall's usual end time.
- Accessibility: "let us know in your RSVP and we'll make sure someone's there to help" (FAQ).
- The hotel list and drive times are from public listings and a routing estimate without traffic. Hyatt House Short Pump, Aloft Richmond West and Residence Inn Richmond Northwest are tagged as Dover Hall partner hotels, from Dover Hall's FAQ.
- "Things to do" is a starter list (VMFA, Maymont, Lewis Ginter, Belle Isle, Carytown, Scott's Addition, Hardywood West Creek, Hollywood Cemetery). Swap in your own favorites.

## To ask your Dover Hall event manager

- Which entrance guests should put in their GPS (the routing suggests Millers Lane). The site currently says to use 1500 Manakin Rd.
- The music cutoff (the FAQ says 11 PM; elsewhere it says there's no end time inside).
- Whether 7 Lady Vineyards' tasting room on the estate will be open by May 2027 (it would be a great "things to do" entry).

## Turning on RSVPs

Follow `apps-script/SETUP.md` (about 15 minutes). It needs your Google account, so it's the one step Claude can't do for you.
