import { test } from "node:test";
import assert from "node:assert/strict";
import { renderKoraHeader, renderKoraFooter, renderKoraDrawer } from "../lib/ssr/index.js";
import "../lib/components/chrome/kora-header/index.js";
import "../lib/components/chrome/kora-footer/index.js";
import "../lib/components/overlay/kora-drawer/index.js";

const tick = () => new Promise((resolve) => queueMicrotask(resolve));

// Feature: header projects default children into nav and slot="actions" children into the actions
// region, and renders a configurable brand.
test("kora-header renders the default global nav, then appends site links + routes actions", async () => {
    document.body.innerHTML = "";
    const el = document.createElement("kora-header");
    el.setAttribute("brand-label", "H.A.L.");
    const navLink = document.createElement("a");
    navLink.textContent = "Create policy";
    const action = document.createElement("button");
    action.setAttribute("slot", "actions");
    action.textContent = "Connect";
    el.append(navLink, action);
    document.body.appendChild(el);
    await tick();

    const navLabels = [...el.querySelectorAll(".kora-header__nav > a")].map((a) => a.textContent);
    // Shared global trio is present BY DEFAULT, with the site's own link appended after.
    assert.deepEqual(navLabels, ["Mint", "H.A.L.", "Merch", "Create policy"]);
    assert.equal(el.querySelector(".kora-header__nav > a:last-child"), navLink); // site link projected last
    assert.equal(el.querySelector(".kora-header__actions > button"), action); // actions routed by slot
    assert.equal(el.querySelector("kora-brand .kora-brand__label").textContent, "H.A.L."); // brand rendered
});

// Feature: default-nav="false" omits the shared trio (site provides its own nav entirely).
test("kora-header default-nav=false omits the shared trio", async () => {
    document.body.innerHTML = "";
    const el = document.createElement("kora-header");
    el.setAttribute("default-nav", "false");
    const only = document.createElement("a");
    only.textContent = "Only";
    el.append(only);
    document.body.appendChild(el);
    await tick();
    assert.deepEqual([...el.querySelectorAll(".kora-header__nav > a")].map((a) => a.textContent), ["Only"]);
});

// Feature: header SSR renders the default trio + appended site nav + routed actions.
test("renderKoraHeader embeds brand + default trio + site nav + actions", () => {
    const html = renderKoraHeader({
        brandLabel: "H.A.L.",
        env: "mainnet",
        nav: '<a href="#/create">Create policy</a>',
        actions: "<span>x</span>",
    });
    assert.match(html, /brand-label="H\.A\.L\."/);
    assert.match(html, /href="https:\/\/mint\.handle\.me"/); // default trio present
    assert.match(html, /<a href="#\/create">Create policy<\/a>/); // site link appended
    assert.match(html, /data-kora-slot="actions"><span>x<\/span>/);
});

// Feature: footer renders the shared default links by default, then appends authored children.
test("kora-footer renders defaults then appends authored links", async () => {
    document.body.innerHTML = "";
    const el = document.createElement("kora-footer");
    const a = document.createElement("a");
    a.href = "/about";
    a.textContent = "About";
    el.append(a);
    document.body.appendChild(el);
    await tick();

    const labels = [...el.querySelectorAll(".kora-footer > a, .kora-footer > button")].map((n) => n.textContent);
    assert.deepEqual(labels, ["How to Integrate", "Terms of use", "Verified integration", "Clear site data", "About"]);
    assert.equal(el.querySelector(".kora-footer > a:last-of-type"), a); // site link appended last
    // The clear-site-data default is a marked action button (wired by the component).
    assert.ok(el.querySelector('[data-kora-action="clear-site-data"]'));
});

// Feature: default-links="false" omits the shared defaults (site provides the whole footer).
test("kora-footer default-links=false omits the shared defaults", async () => {
    document.body.innerHTML = "";
    const el = document.createElement("kora-footer");
    el.setAttribute("default-links", "false");
    const a = document.createElement("a");
    a.href = "/only";
    a.textContent = "Only";
    el.append(a);
    document.body.appendChild(el);
    await tick();
    assert.deepEqual([...el.querySelectorAll(".kora-footer > a, .kora-footer > button")].map((n) => n.textContent), ["Only"]);

    // SSR: defaults + appended extras.
    const html = renderKoraFooter({ env: "mainnet", links: [{ label: "Docs", href: "/docs", external: true }] });
    assert.match(html, />How to Integrate</); // default present
    assert.match(html, /<a class="kora-footer__link" href="\/docs" target="_blank"/); // extra appended
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
