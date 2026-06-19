import { test } from "node:test";
import assert from "node:assert/strict";
import { renderKoraLoader, renderKoraTooltip } from "../lib/ssr/index.js";
import "../lib/components/feedback/kora-loader/index.js";
import "../lib/components/feedback/kora-tooltip/index.js";

const tick = () => new Promise((resolve) => queueMicrotask(resolve));

// Feature: loader renders two rings, exposes a status role, and sizes via the `size` attribute.
test("kora-loader renders rings and applies size", async () => {
    assert.match(renderKoraLoader({ size: 32 }), /--kora-loader-size:32px/);

    const el = document.createElement("kora-loader");
    el.setAttribute("size", "64");
    document.body.appendChild(el);
    await tick();
    assert.equal(el.querySelectorAll(".kora-loader__ring").length, 2);
    assert.equal(el.getAttribute("role"), "status");
    assert.equal(el.style.getPropertyValue("--kora-loader-size"), "64px");
});

// Feature: tooltip keeps its slotted trigger and renders a role=tooltip bubble with the text.
test("kora-tooltip keeps the trigger and shows the text bubble", async () => {
    const html = renderKoraTooltip({ text: "Why?", position: "right", trigger: "<button>?</button>" });
    assert.match(html, /position="right"/);
    assert.match(html, /role="tooltip">Why\?</);

    document.body.innerHTML = "";
    const el = document.createElement("kora-tooltip");
    el.setAttribute("text", "Helpful hint");
    const trigger = document.createElement("button");
    trigger.textContent = "?";
    el.appendChild(trigger);
    document.body.appendChild(el);
    await tick();

    assert.equal(el.querySelector(".kora-tooltip__trigger > button"), trigger); // trigger preserved
    assert.equal(el.querySelector(".kora-tooltip__bubble").textContent, "Helpful hint");

    el.setAttribute("text", "Updated");
    await tick();
    assert.equal(el.querySelector(".kora-tooltip__bubble").textContent, "Updated");
});
