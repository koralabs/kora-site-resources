import { test } from "node:test";
import assert from "node:assert/strict";
import { renderKoraButton } from "../lib/ssr/index.js";

// Feature under test: the server renderer emits a self-contained, SSR-marked <kora-button>
// whose attributes carry state and whose inner markup the client can adopt verbatim.
test("renderKoraButton emits an SSR-marked host with matching inner markup", () => {
    const html = renderKoraButton({ label: "Mint", variant: "primary" });
    assert.match(html, /^<kora-button [^>]*data-kora-ssr/); // marker present → client adopts
    assert.match(html, /variant="primary"/);
    assert.match(html, /class="kora-btn kora-btn--primary"/);
    assert.match(html, /<span class="kora-btn__label">Mint<\/span>/);
    // Failure mode caught: spinner must be hidden when not loading.
    assert.match(html, /class="kora-btn__spinner" hidden/);
});

// Feature: loading state implies a disabled button + visible spinner, and labels are escaped.
test("renderKoraButton reflects loading/disabled and escapes the label", () => {
    const html = renderKoraButton({ label: 'a<b>&"', loading: true });
    assert.match(html, /\sloading(>|\s)/); // host carries the loading attribute
    assert.match(html, /<button[^>]* disabled/); // loading ⇒ disabled
    assert.match(html, /class="kora-btn__spinner" aria-hidden/); // spinner NOT hidden
    assert.match(html, /a&lt;b&gt;&amp;/); // label text escaped
    // Negative control: a broken escaper would let the raw injected tag through.
    assert.doesNotMatch(html, /<b>/);
});
