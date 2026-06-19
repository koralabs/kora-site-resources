import { test } from "node:test";
import assert from "node:assert/strict";
import { WalletStore, listAvailableWallets } from "../lib/wallet/index.js";

const tick = () => new Promise((resolve) => queueMicrotask(resolve));

/** Inject a fake CIP-30 namespace into window.cardano for the duration of the test. */
function withFakeCardano(namespace, fn) {
    const prev = globalThis.cardano;
    globalThis.cardano = namespace;
    return Promise.resolve(fn()).finally(() => {
        globalThis.cardano = prev;
    });
}

function fakeWallet(overrides = {}) {
    const api = {
        getNetworkId: async () => 1,
        getChangeAddress: async () => "01changehex",
        getRewardAddresses: async () => ["e1stakehex"],
        getUsedAddresses: async () => ["01usedhex"],
        getBalance: async () => "1a002dc6c0",
        signTx: async (tx) => `signed:${tx}`,
        submitTx: async () => "txid123",
        ...overrides,
    };
    return { name: "Eternl", icon: "data:eternl", apiVersion: "1.0", enable: async () => api };
}

// Feature: discovery lists only objects exposing a CIP-30 `enable` function.
test("listAvailableWallets discovers injected wallets", async () => {
    await withFakeCardano({ eternl: fakeWallet(), notAWallet: { foo: 1 } }, () => {
        const wallets = listAvailableWallets();
        assert.equal(wallets.length, 1);
        assert.deepEqual(wallets[0], { key: "eternl", name: "Eternl", icon: "data:eternl", apiVersion: "1.0" });
    });
});

// Feature: connect() enables the wallet, populates raw CIP-30 state, and notifies subscribers.
test("WalletStore.connect populates state and notifies", async () => {
    await withFakeCardano({ eternl: fakeWallet() }, async () => {
        const store = new WalletStore();
        const seen = [];
        store.subscribe((s) => seen.push(s.status));

        await store.connect("eternl");
        await tick();

        assert.equal(store.state.status, "connected");
        assert.equal(store.state.walletName, "Eternl");
        assert.equal(store.state.networkId, 1);
        assert.equal(store.state.changeAddressHex, "01changehex");
        assert.equal(store.state.rewardAddressHex, "e1stakehex");
        assert.equal(store.state.balanceCbor, "1a002dc6c0");
        assert.ok(seen.includes("connected"), "subscriber saw the connected status");

        // signing delegates to the live api
        assert.equal(await store.signTx("abc"), "signed:abc");
    });
});

// Feature: a failed enable lands the store in an error state, not a half-connected one.
test("WalletStore.connect surfaces enable failures", async () => {
    const broken = { enable: async () => { throw new Error("user declined"); }, name: "Broken" };
    await withFakeCardano({ broken }, async () => {
        const store = new WalletStore();
        await store.connect("broken");
        assert.equal(store.state.status, "error");
        assert.equal(store.state.error, "user declined");
        assert.equal(store.api, null);
        // Negative control: a swallowed error would leave status "connecting" or "connected".
    });
});

// Feature: disconnect clears all wallet state.
test("WalletStore.disconnect resets state", async () => {
    await withFakeCardano({ eternl: fakeWallet() }, async () => {
        const store = new WalletStore();
        await store.connect("eternl");
        store.disconnect();
        assert.equal(store.state.status, "disconnected");
        assert.equal(store.state.walletKey, null);
        assert.equal(store.state.rewardAddressHex, null);
        await assert.rejects(() => store.signTx("abc"), /not connected/);
    });
});
