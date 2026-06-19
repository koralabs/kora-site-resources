import { test } from "node:test";
import assert from "node:assert/strict";
import { renderKoraHeader, renderKoraFooter, renderKoraDrawer } from "../lib/ssr/index.js";
import "../lib/components/chrome/kora-header/index.js";
import "../lib/components/chrome/kora-footer/index.js";
import "../lib/components/overlay/kora-drawer/index.js";

const tick = () => new Promise((resolve) => queueMicrotask(resolve));

// Feature: header projects default children into nav and slot="actions" children into the actions
// region, and renders a configurable brand.
test("kora-header slots nav + actions and renders the brand", async () => {
    document.body.innerHTML = "";
    const el = document.createElement("kora-header");
    el.setAttribute("brand-label", "H.A.L.");
    const navLink = document.createElement("a");
    navLink.textContent = "Mint";
    const action = document.createElement("button");
    action.setAttribute("slot", "actions");
    action.textContent = "Connect";
    el.append(navLink, action);
    document.body.appendChild(el);
    await tick();

    assert.equal(el.querySelector(".kora-header__nav > a"), navLink); // nav child projected
    assert.equal(el.querySelector(".kora-header__actions > button"), action); // actions child routed by slot
    assert.equal(el.querySelector("kora-brand .kora-brand__label").textContent, "H.A.L."); // brand rendered
    // Negative control: a broken slot router would leave the action in nav (or drop it).
});

// Feature: header SSR output carries the brand label so the client adopts it without re-rendering.
test("renderKoraHeader embeds brand + nav + actions markup", () => {
    const html = renderKoraHeader({
        brandLabel: "H.A.L.",
        nav: '<a href="/mint">Mint</a>',
        actions: "<span>x</span>",
    });
    assert.match(html, /brand-label="H\.A\.L\."/);
    assert.match(html, /<a href="\/mint">Mint<\/a>/);
    assert.match(html, /data-kora-slot="actions"><span>x<\/span>/);
});

// Feature: footer projects authored link children into the centered row.
test("kora-footer projects link children", async () => {
    document.body.innerHTML = "";
    const el = document.createElement("kora-footer");
    const a = document.createElement("a");
    a.href = "/terms";
    a.textContent = "Terms";
    el.append(a);
    document.body.appendChild(el);
    await tick();
    assert.equal(el.querySelector(".kora-footer > a"), a);

    // SSR convenience builds links from data.
    const html = renderKoraFooter({ links: [{ label: "Docs", href: "/docs", external: true }] });
    assert.match(html, /<a class="kora-footer__link" href="\/docs" target="_blank"/);
});

// Feature: drawer toggles via the `open` property and emits kora-drawer-close on Escape.
test("kora-drawer open property and close event", async () => {
    document.body.innerHTML = "";
    const el = document.createElement("kora-drawer");
    el.setAttribute("title", "Wallet & Handles");
    const content = document.createElement("p");
    content.textContent = "hello";
    el.append(content);
    document.body.appendChild(el);
    await tick();

    assert.equal(el.querySelector(".kora-drawer__title").textContent, "Wallet & Handles");
    assert.equal(el.querySelector(".kora-drawer__body > p"), content); // slotted body content

    assert.equal(el.open, false);
    el.open = true;
    assert.equal(el.hasAttribute("open"), true);

    let closed = false;
    el.addEventListener("kora-drawer-close", () => (closed = true));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    assert.equal(el.open, false); // Escape cleared open
    assert.equal(closed, true); // and fired the close event
});
