import { HtmlBasePlugin } from "@11ty/eleventy";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import crypto from "node:crypto";
import fs from "node:fs";

export default function (eleventyConfig) {
  // Rewrites root-relative URLs ("/rsvp/") to include the GitHub Pages path prefix.
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // Every <img> in the output becomes a <picture> with WebP + a fallback, sized and lazy-loaded.
  // Inline SVG and images under /brand/ are left alone.
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp", "auto"],
    widths: ["auto"],
    urlPath: "/img/",
    outputDir: "./_site/img/",
    htmlOptions: {
      imgAttributes: { loading: "lazy", decoding: "async" },
      pictureAttributes: {},
    },
  });

  // Dates are written as calendar days; format them in UTC so they never shift a day.
  const fmt = (d, opts) => new Date(d).toLocaleDateString("en-US", { ...opts, timeZone: "UTC" });
  eleventyConfig.addFilter("longDate", (d) => fmt(d, { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
  eleventyConfig.addFilter("monthDay", (d) => fmt(d, { month: "long", day: "numeric" }));
  eleventyConfig.addFilter("compactDate", (d) => d.replace(/-/g, ""));
  // The day after a YYYY-MM-DD date, for all-day calendar events (end date is exclusive).
  eleventyConfig.addFilter("nextDay", (d) => new Date(Date.parse(d) + 864e5).toISOString().slice(0, 10));

  // Whole days from now until midnight Eastern on a YYYY-MM-DD date (site.js keeps it current in the browser).
  eleventyConfig.addFilter("daysUntil", (d) => Math.max(0, Math.ceil((Date.parse(d + "T00:00:00-04:00") - Date.now()) / 864e5)));
  // "16:30" -> "4:30 PM"
  eleventyConfig.addFilter("clock", (t) => {
    const [h, m] = t.split(":").map(Number);
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  });
  // "/css/site.css" -> "/css/site.css?v=1a2b3c4d": a new URL whenever the file changes, so browsers don't keep
  // serving a stale copy for the 10 minutes GitHub Pages lets them cache it.
  eleventyConfig.addFilter("bust", (url) => {
    const hash = crypto.createHash("md5").update(fs.readFileSync("./src/static" + url)).digest("hex").slice(0, 8);
    return `${url}?v=${hash}`;
  });
  eleventyConfig.addFilter("navItem", (nav, url) => nav.find((n) => n.url === url));

  eleventyConfig.addPassthroughCopy({ "src/static": "/" });
  eleventyConfig.addWatchTarget("src/static/");

  return {
    dir: { input: "src", output: "_site" },
    templateFormats: ["njk", "md", "html", "11ty.js"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
