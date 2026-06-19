import { test } from "node:test";
import assert from "node:assert/strict";
import { renderKoraWalletButton } from "../lib/ssr/index.js";
import { WalletStore } from "../lib/wallet/index.js";
import "../lib/components/wallet/kora-wallet-button/index.js";

const tick = () => new Promise((resolve) => queueMicrotask(resolve));
// Flush the async connect chain (enable → CIP-30 calls → store notify → component update).
const flush = async (n = 12) => {
    for (let i = 0; i < n; i++) await new Promise((resolve) => setTimeout(resolve, 0));
};

function withFakeCardano(namespace, fn) {
    const prev = globalThis.cardano;
    globalThis.cardano = namespace;
    return Promise.resolve(fn()).finally(() => {
        globalThis.cardano = prev;
    });
}

function fakeWallet(name) {
    const api = {
        getNetworkId: async () => 1,
        getChangeAddress: async () => "01changehex",
        getRewardAddresses: async () => ["e1stakehex"],
        getUsedAddresses: async () => ["01usedhex"],
        getBalance: async () => "1a002dc6c0",
        signTx: async (tx) => `signed:${tx}`,
        submitTx: async () => "txid",
    };
    return { name, icon: "", enable: async () => api };
}

// Feature: SSR renders the disconnected "Connect Wallet" affordance (indicator hidden).
test("renderKoraWalletButton SSRs the disconnected state", () => {
    const html = renderKoraWalletButton();
    assert.match(html, /data-kora-ssr/);
    assert.match(html, /class="kora-wallet__connect"[^>]*>Connect Wallet</);
    assert.match(html, /kora-handle-indicator[^>]*hidden/); // indicator hidden until connected
});

// Feature: clicking connect with one installed wallet connects and swaps in the handle indicator.
test("kora-wallet-button connects and shows the indicator", async () => {
    await withFakeCardano({ eternl: fakeWallet("Eternl") }, async () => {
        document.body.innerHTML = "";
        const el = document.createElement("kora-wallet-button");
        el.store = new WalletStore(); // isolate from the shared singleton
        document.body.appendChild(el);
        await tick();

        const connectBtn = el.querySelector(".kora-wallet__connect");
        const indicator = el.querySelector(".kora-wallet__indicator");
        assert.equal(connectBtn.hidden, false);
        assert.equal(indicator.hidden, true);

        connectBtn.click();
        await flush();

        assert.equal(el.store.state.status, "connected");
        assert.equal(connectBtn.hidden, true);
        assert.equal(indicator.hidden, false);
        // No resolved handle supplied → shows the wallet name (real, not mocked).
        assert.equal(indicator.getAttribute("handle"), "Eternl");
    });
});

// Feature: when several wallets are installed, the picker lists them; choosing one connects it.
test("kora-wallet-button shows a picker for multiple wallets", async () => {
    await withFakeCardano({ eternl: fakeWallet("Eternl"), nami: fakeWallet("Nami") }, async () => {
        document.body.innerHTML = "";
        const el = document.createElement("kora-wallet-button");
        el.store = new WalletStore();
        document.body.appendChild(el);
        await tick();

        el.querySelector(".kora-wallet__connect").click();
        const options = el.querySelectorAll(".kora-wallet__option");
        assert.equal(options.length, 2);
        assert.equal(el.querySelector(".kora-wallet__picker").hidden, false);

        options[1].click(); // Nami
        await flush();
        assert.equal(el.store.state.status, "connected");
        assert.equal(el.querySelector(".kora-wallet__indicator").getAttribute("handle"), "Nami");
    });
});

// Feature: a resolved handle (set via attribute) is shown with the $ symbol.
test("kora-wallet-button prefers a resolved handle when provided", async () => {
    await withFakeCardano({ eternl: fakeWallet("Eternl") }, async () => {
        document.body.innerHTML = "";
        const el = document.createElement("kora-wallet-button");
        el.store = new WalletStore();
        el.setAttribute("handle", "bigirishlion");
        document.body.appendChild(el);
        await tick();
        await el.store.connect("eternl");
        await flush();

        const indicator = el.querySelector(".kora-wallet__indicator");
        assert.equal(indicator.getAttribute("handle"), "bigirishlion");
        assert.equal(indicator.getAttribute("symbol"), "$");
    });
});
