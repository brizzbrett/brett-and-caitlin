// The RSVP form. Step 1 finds the guest's party by name; step 2 asks each person in the party;
// step 3 confirms. Talks to the Google Apps Script web app named in data-endpoint (see apps-script/).
// Requests are "simple" CORS requests (a GET, and a POST with a text/plain body) because Apps Script
// can't answer a preflight; fetch follows Google's redirect to the response.

const root = document.querySelector("[data-rsvp]");
if (root) {
  const endpoint = root.dataset.endpoint;
  const meals = JSON.parse(root.dataset.meals || "[]");
  const find = root.querySelector("[data-rsvp-find]");
  const reply = root.querySelector("[data-rsvp-reply]");
  const done = root.querySelector("[data-rsvp-done]");
  const findStatus = root.querySelector("[data-rsvp-find-status]");
  const replyStatus = root.querySelector("[data-rsvp-reply-status]");
  const guestsBox = root.querySelector("[data-rsvp-guests]");
  const plusOne = root.querySelector("[data-rsvp-plusone]");
  let current = null; // { lookupName, party, openedAt }

  const MESSAGES = {
    full_name: "Please enter both your first and last name.",
    not_found: "We couldn't find that name. Try it exactly as it's written on your invitation envelope.",
    ambiguous: "More than one invitation matches that name. Try your full name as it's written on your invitation.",
    too_fast: "Please check your answers, then send again.",
    server: "Something went wrong saving your RSVP. Please try again in a minute.",
    network: "We couldn't reach the RSVP service. Check your connection and try again.",
  };
  const say = (el, text, isError) => { el.textContent = text; el.classList.toggle("error", Boolean(isError)); };
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "text") n.textContent = v; else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : v);
    }
    n.append(...kids);
    return n;
  };
  const fillMeals = (select) => {
    select.replaceChildren(el("option", { value: "", text: "Choose one" }), ...meals.map((m) => el("option", { value: m, text: m })));
  };
  const call = async (init, query = "") => {
    let res;
    try { res = await fetch(endpoint + query, init); } catch { return { ok: false, error: "network" }; }
    try { return await res.json(); } catch { return { ok: false, error: "server" }; }
  };

  // One card per person in the party, with "accepts" / "declines" and, if attending, dinner and dietary needs.
  // Children are tagged and skip the dinner choice (the kids' meal is set with the caterer).
  const guestCard = (name, i, prior, child) => {
    const id = `g${i}`;
    const choice = (value, label) => el("label", { class: "choice" },
      el("input", { type: "radio", name: `${id}-attending`, value, checked: prior?.attending === (value === "yes" ? "Yes" : "No") }),
      el("span", { text: label }));
    const card = el("div", { class: "guest", "data-guest": name, "data-child": child },
      el("h3", {}, name, child ? el("span", { class: "tag", text: "Child" }) : ""),
      el("div", { class: "field" },
        el("span", { class: "visually-hidden", id: `${id}-q`, text: `Will ${name} be there?` }),
        el("div", { class: "choices", role: "radiogroup", "aria-labelledby": `${id}-q` },
          choice("yes", "Joyfully accepts"), choice("no", "Regretfully declines"))),
      el("div", { class: "if-attending" },
        meals.length && !child ? el("div", { class: "field" }, el("label", { for: `${id}-meal`, text: "Dinner" }), el("select", { id: `${id}-meal`, "data-meal": "" })) : "",
        el("div", { class: "field" }, el("label", { for: `${id}-dietary`, text: "Allergies or dietary needs" }),
          el("input", { id: `${id}-dietary`, type: "text", "data-dietary": "", value: prior?.dietary || false }))));
    const select = card.querySelector("[data-meal]");
    if (select) { fillMeals(select); select.value = prior?.meal || ""; }
    const sync = () => card.toggleAttribute("data-declined", card.querySelector(`input[name="${id}-attending"]:checked`)?.value === "no");
    card.addEventListener("change", sync);
    sync();
    return card;
  };

  const showReply = (data, lookupName) => {
    current = { lookupName, party: data.party, openedAt: Date.now() };
    const prior = (kind, name) => data.responses.find((r) => r.kind === kind && (kind === "Plus-one" || r.guest === name));
    const children = data.party.children || [];
    guestsBox.replaceChildren(...data.party.guests.map((g, i) => guestCard(g, i, prior("Guest", g), children.includes(g))));
    plusOne.hidden = !data.party.plusOne;
    if (data.party.plusOne) {
      const p = prior("Plus-one");
      const yes = p?.attending === "Yes";
      plusOne.querySelector(`input[name="po-attending"][value="${yes ? "yes" : "no"}"]`).checked = true;
      plusOne.querySelector("#po-name").value = yes ? p.guest : "";
      plusOne.querySelector("#po-dietary").value = yes ? p.dietary : "";
      const mealField = plusOne.querySelector("[data-meal-field]");
      mealField.hidden = !meals.length;
      if (meals.length) { fillMeals(plusOne.querySelector("#po-meal")); plusOne.querySelector("#po-meal").value = yes ? p.meal : ""; }
      plusOne.toggleAttribute("data-declined", !yes);
    }
    const first = data.responses[0];
    reply.querySelector("#rsvp-song").value = first?.song || "";
    reply.querySelector("#rsvp-note").value = first?.note || "";
    reply.querySelector("#rsvp-email").value = first?.email || "";
    say(replyStatus, data.responses.length ? "We have your earlier reply. Change anything you like and send it again." : "");
    find.hidden = true;
    reply.hidden = false;
    guestsBox.querySelector("h3")?.setAttribute("tabindex", "-1");
    guestsBox.querySelector("h3")?.focus();
  };

  // An error message goes away as soon as the guest changes an answer.
  reply.addEventListener("change", () => { if (replyStatus.classList.contains("error")) say(replyStatus, ""); });

  plusOne.addEventListener("change", () => {
    plusOne.toggleAttribute("data-declined", plusOne.querySelector('input[name="po-attending"]:checked').value === "no");
  });

  find.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = find.querySelector("#rsvp-name").value.trim();
    if (name.split(/\s+/).length < 2) return say(findStatus, MESSAGES.full_name, true);
    const button = find.querySelector("button");
    button.disabled = true;
    say(findStatus, "Looking for your invitation…");
    const data = await call({ method: "GET" }, `?name=${encodeURIComponent(name)}`);
    button.disabled = false;
    if (!data.ok) return say(findStatus, MESSAGES[data.error] || MESSAGES.server, true);
    if (data.closed) return say(findStatus, "RSVPs are closed. If your plans have changed, please get in touch with us directly.", true);
    say(findStatus, "");
    showReply(data, name);
  });

  root.querySelector("[data-rsvp-restart]").addEventListener("click", () => {
    reply.hidden = true;
    find.hidden = false;
    current = null;
    find.querySelector("#rsvp-name").select();
    find.querySelector("#rsvp-name").focus();
  });

  reply.addEventListener("submit", async (e) => {
    e.preventDefault();
    const guests = [...guestsBox.querySelectorAll("[data-guest]")].map((card) => ({
      name: card.dataset.guest,
      attending: card.querySelector("input[type=radio]:checked")?.value,
      meal: card.querySelector("[data-meal]")?.value || "",
      dietary: card.querySelector("[data-dietary]").value,
    }));
    const missing = guests.find((g) => !g.attending);
    if (missing) return say(replyStatus, `Please let us know whether ${missing.name} can make it.`, true);
    const noMeal = meals.length && guests.find((g, i) => g.attending === "yes" && !g.meal && !guestsBox.children[i].hasAttribute("data-child"));
    if (noMeal) return say(replyStatus, `Please choose a dinner for ${noMeal.name}.`, true);
    let po = null;
    if (!plusOne.hidden) {
      po = {
        attending: plusOne.querySelector('input[name="po-attending"]:checked').value,
        name: plusOne.querySelector("#po-name").value.trim(),
        meal: meals.length ? plusOne.querySelector("#po-meal").value : "",
        dietary: plusOne.querySelector("#po-dietary").value,
      };
      if (po.attending === "yes" && po.name.split(/\s+/).length < 2) return say(replyStatus, "Please add your guest's first and last name.", true);
      if (po.attending === "yes" && meals.length && !po.meal) return say(replyStatus, "Please choose a dinner for your guest.", true);
    }

    const button = reply.querySelector("button[type=submit]");
    button.disabled = true;
    say(replyStatus, "Sending your RSVP…");
    const data = await call({
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        party: current.party.id,
        lookupName: current.lookupName,
        guests,
        plusOne: po,
        song: reply.querySelector("#rsvp-song").value,
        note: reply.querySelector("#rsvp-note").value,
        email: reply.querySelector("#rsvp-email").value,
        website: reply.querySelector("#rsvp-website").value,
        elapsed: Date.now() - current.openedAt,
      }),
    });
    button.disabled = false;
    if (!data.ok) {
      const msg = data.error === "closed" ? "RSVPs are closed. If your plans have changed, please get in touch with us directly." : MESSAGES[data.error] || MESSAGES.server;
      return say(replyStatus, msg, true);
    }
    const saved = data.saved || [];
    const coming = saved.filter((s) => s.attending === "Yes").length;
    done.querySelector("[data-rsvp-done-text]").textContent = coming
      ? "Your RSVP is in. We can't wait to celebrate with you."
      : "Your RSVP is in. We'll miss you, and we're grateful you let us know.";
    done.querySelector("[data-rsvp-summary]").replaceChildren(
      ...saved.map((s) => el("li", { text: `${s.guest}: ${s.attending === "Yes" ? "coming" : "not coming"}` })));
    reply.hidden = true;
    done.hidden = false;
    done.focus();
  });
}
