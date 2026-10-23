// The "Add to calendar" file. An all-day event until the times are set; then a timed one in Eastern time.
export const data = { permalink: "/brett-and-caitlin-wedding.ics", eleventyExcludeFromCollections: true };

const esc = (s) => String(s).replace(/[\\;,]/g, (c) => "\\" + c).replace(/\n/g, "\\n");

export function render({ site }) {
  const day = site.date.replace(/-/g, "");
  const next = new Date(Date.parse(site.date) + 864e5).toISOString().slice(0, 10).replace(/-/g, "");
  const v = site.venue;
  // ceremonyTime is "HH:MM" (24-hour) once known; the event then runs until 11 PM.
  const when = site.ceremonyTime
    ? [`DTSTART;TZID=America/New_York:${day}T${site.ceremonyTime.replace(":", "")}00`, `DTEND;TZID=America/New_York:${day}T230000`]
    : [`DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${next}`];
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Brett and Caitlin//Wedding//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:wedding-${day}@brett-and-caitlin`,
    "DTSTAMP:20261022T000000Z",
    ...when,
    `SUMMARY:${esc(`${site.names[0]} & ${site.names[1]}'s wedding`)}`,
    `LOCATION:${esc(`${v.name}, ${v.street}, ${v.city}, ${v.state} ${v.zip}`)}`,
    `DESCRIPTION:${esc(`Details and RSVP: ${site.url}/`)}`,
    `URL:${site.url}/`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
