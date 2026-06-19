import { test } from "node:test";
import assert from "node:assert/strict";
import { renderKoraTabs, renderKoraCollapsible } from "../lib/ssr/index.js";
import "../lib/components/navigation/kora-tabs/index.js";
import "../lib/components/navigation/kora-collapsible/index.js";

const tick = () => new Promise((resolve) => queueMicrotask(resolve));
const TABS = [
    { id: "normal", label: "Normal" },
    { id: "demi", label: "DeMi" },
];

// Feature: tabs render a tablist, mark the active tab, and emit kora-tab-change on selection.
test("kora-tabs selects + emits change", async () => {
    assert.match(renderKoraTabs({ tabs: TABS, active: "demi" }), /data-id="demi"[^>]*aria-selected="true"/);

    document.body.innerHTML = "";
    const el = document.createElement("kora-tabs");
    el.tabs = TABS;
    document.body.appendChild(el);
    await tick();

    const tabs = el.querySelectorAll(".kora-tabs__tab");
    assert.equal(tabs.length, 2);
    assert.equal(tabs[0].getAttribute("aria-selected"), "true"); // first active by default

    let changed = null;
    el.addEventListener("kora-tab-change", (e) => (changed = e.detail.id));
    tabs[1].click();
    await tick();
    assert.equal(changed, "demi");
    assert.equal(el.active, "demi");
    assert.equal(el.querySelector('.kora-tabs__tab[data-id="demi"]').getAttribute("aria-selected"), "true");
    assert.equal(el.querySelector('.kora-tabs__tab[data-id="normal"]').getAttribute("aria-selected"), "false");
});

// Feature: collapsible toggles `open` + aria-expanded and keeps slotted body content.
test("kora-collapsible toggles open and slots content", async () => {
    document.body.innerHTML = "";
    const el = document.createElement("kora-collapsible");
    el.setAttribute("title", "Advanced");
    const body = document.createElement("p");
    body.textContent = "details";
    el.append(body);
    document.body.appendChild(el);
    await tick();

    assert.equal(el.querySelector(".kora-collapsible__title").textContent, "Advanced");
    assert.equal(el.querySelector(".kora-collapsible__inner > p"), body); // slotted content preserved
    const trigger = el.querySelector(".kora-collapsible__trigger");
    assert.equal(trigger.getAttribute("aria-expanded"), "false");

    let toggled = null;
    el.addEventListener("kora-toggle", (e) => (toggled = e.detail.open));
    trigger.click();
    await tick();
    assert.equal(el.open, true);
    assert.equal(trigger.getAttribute("aria-expanded"), "true");
    assert.equal(toggled, true);
});

// Feature: collapsible SSR carries the open attribute + body.
test("renderKoraCollapsible reflects open + body", () => {
    const html = renderKoraCollapsible({ title: "FAQ", open: true, body: "<p>answer</p>" });
    assert.match(html, /<kora-collapsible [^>]*open/);
    assert.match(html, /data-kora-content><p>answer<\/p>/);
});
