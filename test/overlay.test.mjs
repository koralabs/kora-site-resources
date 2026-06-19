import { test } from "node:test";
import assert from "node:assert/strict";
import { renderKoraModal } from "../lib/ssr/index.js";
import "../lib/components/overlay/kora-modal/index.js";
import { koraToast } from "../lib/components/feedback/kora-toast/index.js";

const tick = () => new Promise((resolve) => queueMicrotask(resolve));

// Feature: modal slots body content, toggles via `open`, and emits kora-modal-close.
test("kora-modal opens, slots content, and closes", async () => {
    document.body.innerHTML = "";
    const el = document.createElement("kora-modal");
    el.setAttribute("title", "Migrate Handle");
    const body = document.createElement("p");
    body.textContent = "Are you sure?";
    el.append(body);
    document.body.appendChild(el);
    await tick();

    assert.equal(el.querySelector(".kora-modal__title").textContent, "Migrate Handle");
    assert.equal(el.querySelector(".kora-modal__body > p"), body); // slotted content preserved
    assert.equal(el.open, false);

    el.open = true;
    assert.equal(el.hasAttribute("open"), true);

    let closed = false;
    el.addEventListener("kora-modal-close", () => (closed = true));
    el.querySelector(".kora-modal__close").click();
    assert.equal(el.open, false);
    assert.equal(closed, true);
});

// Feature: modal SSR renders a dialog with a body slot.
test("renderKoraModal emits a dialog + body mount", () => {
    const html = renderKoraModal({ title: "Reset", body: "<p>x</p>" });
    assert.match(html, /role="dialog"/);
    assert.match(html, /data-kora-content><p>x<\/p>/);
});

// Feature: koraToast injects a toaster region and type-aware toasts; dismiss removes them.
test("koraToast shows and dismisses toasts", async () => {
    document.body.innerHTML = "";
    const id = koraToast.success("Minted!", { message: "Tx submitted", duration: 0 });
    const toaster = document.querySelector(".kora-toaster");
    assert.ok(toaster, "toaster region created");
    const toast = document.getElementById(id);
    assert.ok(toast.classList.contains("kora-toast--success"));
    assert.equal(toast.getAttribute("role"), "status");
    assert.match(toast.querySelector(".kora-toast__title").textContent, /Minted!/);

    const errId = koraToast.error("Failed", { duration: 0 });
    assert.equal(document.getElementById(errId).getAttribute("role"), "alert"); // errors assert
    assert.equal(document.querySelectorAll(".kora-toast").length, 2);

    koraToast.dismiss(id);
    await new Promise((r) => setTimeout(r, 320)); // allow removal fallback
    assert.equal(document.getElementById(id), null); // removed
});
