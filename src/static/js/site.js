// Small enhancements: the countdown, the mobile menu, the photo lightbox. The RSVP form lives in rsvp.js.

// Countdown: whole days until midnight Eastern on the wedding day.
for (const el of document.querySelectorAll("[data-countdown]")) {
  const target = Date.parse(el.dataset.date + "T00:00:00-04:00");
  const days = Math.ceil((target - Date.now()) / 864e5);
  const num = el.querySelector("[data-countdown-num]");
  const label = el.querySelector("[data-countdown-label]");
  if (days > 1) { num.textContent = days; label.textContent = "days to go"; }
  else if (days === 1) { num.textContent = "1"; label.textContent = "day to go"; }
  else if (days > -1) { num.textContent = "Today"; label.textContent = "is the day"; }
  else { num.textContent = "Married"; label.textContent = "May 2, 2027"; }
}

// Mobile menu: a button opens the page list; choosing a page, Escape, or a click outside closes it.
const menuBtn = document.querySelector("[data-menu-btn]");
if (menuBtn) {
  const nav = document.getElementById(menuBtn.getAttribute("aria-controls"));
  const setOpen = (open) => {
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Close" : "Menu";
    nav.classList.toggle("open", open);
  };
  menuBtn.hidden = false;
  menuBtn.addEventListener("click", () => setOpen(menuBtn.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("open")) { setOpen(false); menuBtn.focus(); }
  });
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("open") && !nav.contains(e.target) && e.target !== menuBtn) setOpen(false);
  });
}

// Lightbox: shows the clicked photo large, with previous/next and Escape to close.
const box = document.querySelector("[data-lightbox]");
if (box) {
  const items = [...document.querySelectorAll("[data-gallery-item]")];
  const stage = box.querySelector("[data-lightbox-stage]");
  let at = 0;
  const show = (i) => {
    at = (i + items.length) % items.length;
    const pic = items[at].querySelector("picture, img").cloneNode(true);
    pic.querySelectorAll("source, img").forEach((el) => el.setAttribute("sizes", "96vw"));
    (pic.querySelector("img") ?? pic).loading = "eager";
    stage.replaceChildren(pic);
  };
  items.forEach((btn, i) => btn.addEventListener("click", () => { show(i); box.showModal(); }));
  box.querySelector("[data-lightbox-prev]").addEventListener("click", () => show(at - 1));
  box.querySelector("[data-lightbox-next]").addEventListener("click", () => show(at + 1));
  box.querySelector("[data-lightbox-close]").addEventListener("click", () => box.close());
  box.addEventListener("click", (e) => { if (e.target === box) box.close(); });
  box.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(at - 1);
    if (e.key === "ArrowRight") show(at + 1);
  });
}
