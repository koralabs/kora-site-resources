import { test } from "node:test";
import assert from "node:assert/strict";
import { renderKoraMenu } from "../lib/ssr/index.js";
import "../lib/components/chrome/kora-menu/index.js";

const tick = () => new Promise((resolve) => queueMicrotask(resolve));

// Feature: SSR renders the shared default Resources links, env-aware, including the X icon link.
test("renderKoraMenu emits the shared default links (env-aware)", () => {
    const html = renderKoraMenu({ env: "preview" });
    assert.match(html, /data-kora-ssr/);
    assert.match(html, />DRep Dashboard</);
    assert.match(html, /href="https:\/\/preview\.handle\.me\/\$\/drep"/);
    assert.match(html, /href="https:\/\/preview\.docs\.handle\.me"/);
    assert.match(html, /href="https:\/\/x\.com\/adahandle"/); // social link present
});

// Feature: extra site links are appended after the shared defaults.
test("renderKoraMenu appends site-specific extra links", () => {
    const html = renderKoraMenu({ env: "mainnet", extra: [{ label: "Roadmap", href: "/roadmap" }] });
    assert.match(html, />DRep Dashboard</); // defaults kept
    assert.match(html, /href="\/roadmap"[^>]*>Roadmap</); // extra added
});

// Feature: the menu opens on trigger click and closes on Escape / outside click.
test("kora-menu toggles open/closed", async () => {
    document.body.innerHTML = "";
    const el = document.createElement("kora-menu");
    document.body.appendChild(el);
    await tick();

    const trigger = el.querySelector(".kora-menu__trigger");
    const panel = el.querySelector(".kora-menu__panel");
    assert.equal(panel.hidden, true); // closed initially
    assert.ok(el.querySelectorAll(".kora-menu__links > a").length >= 7, "default links rendered");

    trigger.click();
    await tick();
    assert.equal(panel.hidden, false);
    assert.equal(trigger.getAttribute("aria-expanded"), "true");

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await tick();
    assert.equal(panel.hidden, true); // Escape closed it
});

// Feature: a site can add links by slotting <a> children (kept alongside the defaults).
test("kora-menu projects slotted extra links after the defaults", async () => {
    document.body.innerHTML = "";
    const el = document.createElement("kora-menu");
    const extra = document.createElement("a");
    extra.href = "/custom";
    extra.textContent = "Custom";
    el.appendChild(extra);
    document.body.appendChild(el);
    await tick();

    const anchors = [...el.querySelectorAll(".kora-menu__links > a")];
    assert.ok(anchors.length >= 8, "defaults + the slotted extra");
    assert.ok(anchors.some((a) => a.textContent === "Custom"), "slotted link kept");
});
