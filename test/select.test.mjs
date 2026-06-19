import { test } from "node:test";
import assert from "node:assert/strict";
import { renderKoraSelect } from "../lib/ssr/index.js";
import "../lib/components/forms/kora-select/index.js";

const tick = () => new Promise((resolve) => queueMicrotask(resolve));
const OPTS = [
    { value: "preview", label: "Preview" },
    { value: "preprod", label: "Preprod" },
    { value: "mainnet", label: "Mainnet" },
];

// Feature: SSR renders the trigger, the options, and a hidden input carrying the value+name.
test("renderKoraSelect emits trigger, options, and a form-submittable hidden input", () => {
    const html = renderKoraSelect({ options: OPTS, value: "mainnet", name: "network" });
    assert.match(html, /role="listbox"/);
    assert.match(html, /data-value="preprod"[^>]*>Preprod</);
    assert.match(html, /<input type="hidden"[^>]*name="network"[^>]*value="mainnet"/);
});

// Feature: opens on click, selecting an option updates value + hidden input and emits change.
test("kora-select opens, selects, and emits change", async () => {
    document.body.innerHTML = "";
    const el = document.createElement("kora-select");
    el.setAttribute("name", "network");
    el.options = OPTS;
    el.value = "preview";
    document.body.appendChild(el);
    await tick();

    const trigger = el.querySelector(".kora-select__trigger");
    const list = el.querySelector(".kora-select__list");
    assert.equal(list.hidden, true);
    assert.equal(el.querySelector(".kora-select__value").textContent, "Preview");

    trigger.click();
    await tick();
    assert.equal(list.hidden, false); // opened

    let changed = null;
    el.addEventListener("change", (e) => (changed = e.detail.value));
    el.querySelector('.kora-select__option[data-value="preprod"]').click();
    await tick();

    assert.equal(el.value, "preprod");
    assert.equal(changed, "preprod"); // change emitted with the value
    assert.equal(list.hidden, true); // closed after select
    assert.equal(el.querySelector(".kora-select__input").value, "preprod"); // hidden input synced
    assert.equal(el.querySelector(".kora-select__value").textContent, "Preprod");
});

// Feature: Escape closes the open list.
test("kora-select closes on Escape", async () => {
    document.body.innerHTML = "";
    const el = document.createElement("kora-select");
    el.options = OPTS;
    document.body.appendChild(el);
    await tick();
    el.querySelector(".kora-select__trigger").click();
    await tick();
    assert.equal(el.querySelector(".kora-select__list").hidden, false);
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await tick();
    assert.equal(el.querySelector(".kora-select__list").hidden, true);
});
