import { test } from "node:test";
import assert from "node:assert/strict";
import {
    renderKoraBrand,
    renderKoraHandleIndicator,
    renderKoraBackground,
} from "../lib/ssr/index.js";
import "../lib/components/chrome/kora-brand/index.js";
import "../lib/components/chrome/kora-background/index.js";
import "../lib/components/wallet/kora-handle-indicator/index.js";

const tick = () => new Promise((resolve) => queueMicrotask(resolve));

// Feature: brand defaults to "$handle" (label "handle") and is re-labelable per site (e.g. H.A.L.).
test("kora-brand defaults to handle and rebrands via label", async () => {
    assert.match(renderKoraBrand(), /<span class="kora-brand__label">handle<\/span>/);
    assert.match(renderKoraBrand({ label: "H.A.L." }), /<span class="kora-brand__label">H\.A\.L\.<\/span>/);

    const el = document.createElement("kora-brand");
    el.setAttribute("label", "H.A.L.");
    document.body.appendChild(el);
    await tick();
    assert.equal(el.querySelector(".kora-brand__label").textContent, "H.A.L.");
    // Negative control: a broken label bridge would leave the default "handle".
});

// Feature: brand becomes a link only when href is set; toggling href mutates in place.
test("kora-brand toggles its href reactively", async () => {
    const el = document.createElement("kora-brand");
    el.setAttribute("label", "handle");
    document.body.appendChild(el);
    await tick();
    const anchor = el.querySelector(".kora-brand");
    assert.equal(anchor.hasAttribute("href"), false);

    el.setAttribute("href", "/");
    await tick();
    assert.equal(anchor.getAttribute("href"), "/");
    assert.equal(el.querySelector(".kora-brand"), anchor); // same node
});

// Feature: the chosen-handle pill shows the $ + handle and updates reactively.
test("kora-handle-indicator renders and updates the handle", async () => {
    const html = renderKoraHandleIndicator({ handle: "bigirishlion" });
    assert.match(html, /class="kora-handle-indicator__symbol">\$</);
    assert.match(html, /class="kora-handle-indicator__handle">bigirishlion</);

    const el = document.createElement("kora-handle-indicator");
    el.setAttribute("handle", "alice");
    document.body.appendChild(el);
    await tick();
    assert.equal(el.querySelector(".kora-handle-indicator__handle").textContent, "alice");

    el.setAttribute("handle", "bob");
    await tick();
    assert.equal(el.querySelector(".kora-handle-indicator__handle").textContent, "bob");
});

// Feature: background renders its layers; the grid layer presence is driven by the `grid` attribute.
test("kora-background layers render; grid attribute is reflected for CSS", async () => {
    assert.match(renderKoraBackground({ grid: true }), /<kora-background data-kora-ssr grid>/);
    assert.match(renderKoraBackground(), /<kora-background data-kora-ssr>/);

    const el = document.createElement("kora-background");
    document.body.appendChild(el);
    await tick();
    assert.ok(el.querySelector(".kora-bg__gradient"), "gradient layer present");
    assert.ok(el.querySelector(".kora-bg__grid"), "grid layer always present (CSS-gated)");
    assert.ok(el.querySelector(".kora-bg__blob--green"), "accent blob present");
});
