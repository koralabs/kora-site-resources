import { test } from "node:test";
import assert from "node:assert/strict";
import { renderKoraIcon } from "../lib/ssr/index.js"; // pure (no DOM)
import { registerKoraIcons, getKoraIcon, koraIconNames } from "../lib/icons/index.js";

const tick = () => new Promise((r) => queueMicrotask(r));

// Feature: the curated set is seeded; renderKoraIcon emits a 24×24 currentColor svg, decorative by default.
test("curated set + renderKoraIcon (SSR, no DOM)", () => {
    assert.ok(getKoraIcon("wallet"), "wallet is in the curated set");
    assert.ok(koraIconNames().length >= 30, "curated set seeded");

    const html = renderKoraIcon("wallet");
    assert.match(html, /^<kora-icon name="wallet" aria-hidden="true">/);
    assert.match(html, /<svg [^>]*viewBox="0 0 24 24"[^>]*stroke="currentColor"/);
    assert.match(html, /<path /);

    assert.match(renderKoraIcon("wallet", { label: "Wallet" }), /role="img" aria-label="Wallet"/);
    assert.match(renderKoraIcon("wallet", { size: 20 }), /--kora-icon-size:20px/);
    assert.match(renderKoraIcon("wallet", { size: "1.5rem" }), /--kora-icon-size:1\.5rem/);
});

// Feature: registerKoraIcons accepts Lucide-shaped data (so any Lucide icon registers as-is).
test("registerKoraIcons accepts Lucide-shaped icon data", () => {
    registerKoraIcons({ "test-thing": [["circle", { cx: 12, cy: 12, r: 9 }]] });
    assert.ok(getKoraIcon("test-thing"));
    assert.match(renderKoraIcon("test-thing"), /<circle cx="12" cy="12" r="9"\/>/);
});

// Feature: <kora-icon> renders the named icon, reacts to attribute changes, sizes + labels.
test("<kora-icon> element renders and reacts", async () => {
    await import("../lib/icons/kora-icon.js");
    document.body.innerHTML = "";
    const el = document.createElement("kora-icon");
    el.setAttribute("name", "wallet");
    document.body.appendChild(el);
    await tick();

    assert.ok(el.querySelector("svg path"), "wallet svg rendered");
    assert.equal(el.getAttribute("aria-hidden"), "true"); // decorative by default

    el.setAttribute("name", "search");
    assert.ok(el.querySelector("svg"), "re-rendered for new name");

    el.setAttribute("label", "Search");
    assert.equal(el.getAttribute("role"), "img");
    assert.equal(el.getAttribute("aria-label"), "Search");
    assert.equal(el.hasAttribute("aria-hidden"), false);

    el.setAttribute("size", "32");
    assert.equal(el.style.getPropertyValue("--kora-icon-size"), "32px");

    el.setAttribute("name", "definitely-not-an-icon");
    assert.equal(el.querySelector("svg"), null); // unknown name → empty, no crash
});
