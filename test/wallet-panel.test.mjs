import { test } from "node:test";
import assert from "node:assert/strict";
import { WalletStore } from "../lib/wallet/index.js";
import "../lib/components/wallet/kora-wallet-panel/index.js";

const tick = () => new Promise((resolve) => queueMicrotask(resolve));
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

const fakeWallet = {
    name: "Eternl",
    icon: "",
    enable: async () => ({
        getNetworkId: async () => 1,
        getChangeAddress: async () => "01changehexaddressvalue0000",
        getRewardAddresses: async () => ["e1stakehex"],
        getUsedAddresses: async () => ["01usedhexaddressvalue1111111"],
        getBalance: async () => "1a002dc6c0",
        signTx: async (t) => t,
        submitTx: async () => "tx",
    }),
};

async function mountConnectedPanel() {
    document.body.innerHTML = "";
    const store = new WalletStore();
    const panel = document.createElement("kora-wallet-panel");
    panel.store = store;
    panel.setAttribute("env", "mainnet");
    document.body.appendChild(panel);
    await tick();
    await store.connect("eternl");
    await flush();
    panel.handles = [{ name: "amber" }, { name: "apprentices" }, { name: "sub@hal", virtual: true }];
    panel.selected = "amber";
    return { store, panel };
}

// Feature: the profile shows the selected handle, the address, and env-aware action links.
test("kora-wallet-panel renders the profile + action links", async () => {
    await withFakeCardano({ eternl: fakeWallet }, async () => {
        const { panel } = await mountConnectedPanel();
        assert.equal(panel.querySelector('[data-ref="handle"]').textContent, "amber");
        assert.ok(panel.querySelector('[data-ref="addr"]').textContent.length > 0, "address shown");
        assert.equal(panel.querySelector('[data-ref="portal"]').getAttribute("href"), "https://handle.me/amber");
        assert.equal(
            panel.querySelector('[data-ref="personalize"]').getAttribute("href"),
            "https://handle.me/~/amber/personalization",
        );
    });
});

// Feature: the list shows the other handles (excluding the selected one) with Virtual badges.
test("kora-wallet-panel lists other handles with badges", async () => {
    await withFakeCardano({ eternl: fakeWallet }, async () => {
        const { panel } = await mountConnectedPanel();
        const names = [...panel.querySelectorAll(".kora-wallet-panel__row")].map((r) => r.dataset.name);
        assert.deepEqual(names, ["apprentices", "sub@hal"]); // 'amber' (selected) excluded
        const virtualRow = panel.querySelector('.kora-wallet-panel__row[data-name="sub@hal"]');
        assert.match(virtualRow.querySelector(".kora-wallet-panel__badge").textContent, /Virtual/);
    });
});

// Feature: the search box filters the list.
test("kora-wallet-panel search filters the list", async () => {
    await withFakeCardano({ eternl: fakeWallet }, async () => {
        const { panel } = await mountConnectedPanel();
        const search = panel.querySelector('[data-ref="search"]');
        search.value = "app";
        search.dispatchEvent(new Event("input"));
        const names = [...panel.querySelectorAll(".kora-wallet-panel__row")].map((r) => r.dataset.name);
        assert.deepEqual(names, ["apprentices"]);
    });
});

// Feature: selecting a handle emits kora-handle-select and makes it the selected one.
test("kora-wallet-panel emits kora-handle-select on row click", async () => {
    await withFakeCardano({ eternl: fakeWallet }, async () => {
        const { panel } = await mountConnectedPanel();
        let picked = null;
        panel.addEventListener("kora-handle-select", (e) => (picked = e.detail.name));
        panel.querySelector('.kora-wallet-panel__row[data-name="apprentices"]').click();
        assert.equal(picked, "apprentices");
        assert.equal(panel.selected, "apprentices");
        assert.equal(panel.querySelector('[data-ref="handle"]').textContent, "apprentices");
    });
});

// Feature: the disconnect button disconnects the store and emits kora-disconnect.
test("kora-wallet-panel disconnect button disconnects + emits", async () => {
    await withFakeCardano({ eternl: fakeWallet }, async () => {
        const { store, panel } = await mountConnectedPanel();
        let disconnected = false;
        panel.addEventListener("kora-disconnect", () => (disconnected = true));
        panel.querySelector('[data-ref="disconnect"]').click();
        assert.equal(disconnected, true);
        assert.equal(store.state.status, "disconnected");
    });
});
