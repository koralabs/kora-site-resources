import { test } from "node:test";
import assert from "node:assert/strict";
import { getEnvironment, siteUrl, koraUrl, portalUrl } from "../lib/env/index.js";
import { koraNavLinks, koraFooterLinks } from "../lib/env/links.js";

// Feature: environment is derived from the hostname (preview./preprod. prefix → that env, else mainnet).
test("getEnvironment parses the host's leading label", () => {
    assert.equal(getEnvironment("merch.handle.me"), "mainnet");
    assert.equal(getEnvironment("handle.me"), "mainnet");
    assert.equal(getEnvironment("preview.merch.handle.me"), "preview");
    assert.equal(getEnvironment("preprod.hal.handle.me"), "preprod");
    // Negative control: a non-env first label must NOT be treated as an environment.
    assert.equal(getEnvironment("mint.handle.me"), "mainnet");
});

// Feature: URLs prefix the env on preview/preprod and drop it on mainnet.
test("siteUrl/koraUrl apply the env prefix correctly", () => {
    assert.equal(siteUrl("merch", { env: "mainnet" }), "https://merch.handle.me");
    assert.equal(siteUrl("merch", { env: "preview" }), "https://preview.merch.handle.me");
    assert.equal(siteUrl("merch", { env: "preprod" }), "https://preprod.merch.handle.me");
    // Root (portal) has no subdomain label.
    assert.equal(koraUrl({ env: "preview" }), "https://preview.handle.me");
    assert.equal(koraUrl({ env: "mainnet" }), "https://handle.me");
    assert.equal(portalUrl("bigirishlion", { env: "preview" }), "https://preview.handle.me/bigirishlion");
});

// Feature: the top nav is the env-aware global destinations. Handle-scoped actions live in the
// drawer, not the nav — so Mint/H.A.L./Merch only, with H.A.L. and Merch env-prefixed (the
// handle.me hardcoded-bare bug fixed here).
test("koraNavLinks are the env-aware global destinations", () => {
    const links = koraNavLinks({ env: "preview" });
    assert.deepEqual(links.map((l) => l.label), ["Mint", "H.A.L.", "Merch"]);
    const byLabel = Object.fromEntries(links.map((l) => [l.label, l.href]));
    assert.equal(byLabel["Mint"], "https://preview.mint.handle.me");
    assert.equal(byLabel["H.A.L."], "https://preview.hal.handle.me");
    assert.equal(byLabel["Merch"], "https://preview.merch.handle.me");
    // mainnet drops the prefix
    assert.equal(koraNavLinks({ env: "mainnet" })[0].href, "https://mint.handle.me");
});

// Handle-scoped URL builders still exist (the drawer uses them) — just not in the top nav.
test("handle-scoped URL builders remain available for the drawer", () => {
    assert.equal(portalUrl("alice", { env: "preview" }), "https://preview.handle.me/alice");
});

// Feature: footer links point back to handle.me/docs (env-aware); the last is an action (no href).
test("koraFooterLinks target handle.me and include the clear action", () => {
    const links = koraFooterLinks({ env: "mainnet" });
    const integrate = links.find((l) => l.label === "How to Integrate");
    assert.match(integrate.href, /^https:\/\/docs\.handle\.me\/docs\/Handles/);
    assert.equal(links.find((l) => l.label === "Terms of use").href, "https://handle.me/$/tou");
    assert.equal(links.find((l) => l.label === "Clear site data").href, undefined); // action, not a link
});
