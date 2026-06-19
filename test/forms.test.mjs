import { test } from "node:test";
import assert from "node:assert/strict";
import { renderKoraCheckbox, renderKoraSwitch, renderKoraInput } from "../lib/ssr/index.js";
import "../lib/components/forms/kora-checkbox/index.js";
import "../lib/components/forms/kora-radio/index.js";
import "../lib/components/forms/kora-switch/index.js";
import "../lib/components/forms/kora-input/index.js";

const tick = () => new Promise((resolve) => queueMicrotask(resolve));

// Feature: checkbox wraps a real input, reflects `checked`, and `change` bubbles natively.
test("kora-checkbox wraps a native input and bubbles change", async () => {
    assert.match(renderKoraCheckbox({ checked: true, label: "Agree" }), /type="checkbox"[^>]*checked/);

    document.body.innerHTML = "";
    const el = document.createElement("kora-checkbox");
    el.setAttribute("label", "Agree");
    document.body.appendChild(el);
    await tick();
    const input = el.querySelector(".kora-checkbox__input");
    assert.ok(input && input.type === "checkbox");
    assert.equal(el.querySelector(".kora-checkbox__label").textContent, "Agree");

    let bubbled = false;
    el.addEventListener("change", () => (bubbled = true));
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    assert.equal(bubbled, true); // native change bubbles out of the light-DOM host
    assert.equal(el.checked, true); // property reflects the input
});

// Feature: radios with the same name are mutually exclusive (native grouping, free).
test("kora-radio group is mutually exclusive by name", async () => {
    document.body.innerHTML = "";
    const a = document.createElement("kora-radio");
    a.setAttribute("name", "g");
    a.setAttribute("value", "a");
    const b = document.createElement("kora-radio");
    b.setAttribute("name", "g");
    b.setAttribute("value", "b");
    document.body.append(a, b);
    await tick();

    a.querySelector(".kora-radio__input").checked = true;
    assert.equal(a.checked, true);
    b.querySelector(".kora-radio__input").checked = true; // native radio unchecks the other
    assert.equal(b.checked, true);
    assert.equal(a.checked, false);
});

// Feature: switch toggles its native checkbox via the `checked` property/attribute.
test("kora-switch reflects checked", async () => {
    assert.match(renderKoraSwitch({ checked: true }), /role="switch"[^>]*checked/);

    document.body.innerHTML = "";
    const el = document.createElement("kora-switch");
    document.body.appendChild(el);
    await tick();
    assert.equal(el.checked, false);
    el.checked = true;
    assert.equal(el.querySelector(".kora-switch__input").checked, true);
});

// Feature: input exposes value, renders label/placeholder, and flags errors.
test("kora-input exposes value and error state", async () => {
    assert.match(renderKoraInput({ label: "Handle", placeholder: "name", error: "Taken" }), /aria-invalid="true"/);

    document.body.innerHTML = "";
    const el = document.createElement("kora-input");
    el.setAttribute("label", "Handle");
    el.setAttribute("placeholder", "your handle");
    document.body.appendChild(el);
    await tick();
    const field = el.querySelector(".kora-input__field");
    assert.equal(field.placeholder, "your handle");
    el.value = "bigirishlion";
    assert.equal(field.value, "bigirishlion");
    assert.equal(el.value, "bigirishlion");

    el.setAttribute("error", "Already taken");
    await tick();
    assert.equal(el.querySelector(".kora-input__error").textContent, "Already taken");
    assert.equal(field.getAttribute("aria-invalid"), "true");
});
