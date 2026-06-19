import { test } from "node:test";
import assert from "node:assert/strict";
import { renderKoraButton } from "../lib/ssr/index.js";
import "../lib/components/primitives/kora-button/index.js"; // defines <kora-button>

const tick = () => new Promise((resolve) => queueMicrotask(resolve));

// Feature: an element created client-side (no SSR markup) renders its light-DOM children fresh.
test("client-created element renders fresh light-DOM children", async () => {
    const el = document.createElement("kora-button");
    el.setAttribute("label", "Connect");
    document.body.appendChild(el);
    await tick();

    assert.ok(el.querySelector(".kora-btn"), "inner button was rendered");
    assert.equal(el.querySelector(".kora-btn__label").textContent, "Connect");
    // Negative control: if template()/hydrate() were broken there would be no .kora-btn child.
});

// Feature: when server markup is present the element ADOPTS it instead of re-rendering.
test("adopts SSR markup without clobbering it", async () => {
    document.body.innerHTML = renderKoraButton({ label: "Mint", variant: "secondary" });
    const el = document.querySelector("kora-button");
    const serverBtn = el.querySelector(".kora-btn"); // node created by the parser, pre-upgrade
    await tick();

    // Same node identity ⇒ connectedCallback adopted server DOM rather than running innerHTML=template().
    assert.equal(el.querySelector(".kora-btn"), serverBtn);
    assert.equal(el.hasAttribute("data-kora-ssr"), false); // marker consumed on adoption
    // Negative control: a re-render (innerHTML=template) would detach serverBtn, failing the identity check.
});

// Feature: mutating an attribute drives a Proxy-scheduled, targeted DOM update (no node replacement).
test("Proxy-driven reactive update mutates refs in place", async () => {
    const el = document.createElement("kora-button");
    el.setAttribute("label", "Sign");
    document.body.appendChild(el);
    await tick();

    const btn = el.querySelector(".kora-btn");
    assert.equal(btn.disabled, false);

    el.setAttribute("loading", ""); // → attributeChangedCallback → state.loading=true → Proxy schedules update
    await tick();

    assert.equal(btn.disabled, true); // loading ⇒ disabled
    assert.equal(el.querySelector(".kora-btn__spinner").hidden, false); // spinner shown
    assert.equal(el.querySelector(".kora-btn"), btn); // SAME node — targeted update, not a re-render
});
