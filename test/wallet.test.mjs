import { test } from "node:test";
import assert from "node:assert/strict";
import { WalletStore, listAvailableWallets, forgetHandle } from "../lib/wallet/index.js";

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
        store.autoResolve = false; // exercise connection only; handle resolution covered separately
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

// Feature: the enabled wallet is returned VERBATIM (no wrapper), so CIP-8 signData is available —
// both on store.api and via the store.signData convenience.
test("WalletStore exposes the wallet's CIP-8 signData", async () => {
    const wallet = fakeWallet({
        signData: async (addr, payload) => ({ signature: `sig:${addr}:${payload}`, key: "cosekey" }),
    });
    await withFakeCardano({ eternl: wallet }, async () => {
        const store = new WalletStore();
        store.autoResolve = false;
        await store.connect("eternl");
        // The raw enabled API carries signData (we don't strip it).
        assert.equal(typeof store.api.signData, "function");
        const sig = await store.signData("addrhex", "deadbeef");
        assert.deepEqual(sig, { signature: "sig:addrhex:deadbeef", key: "cosekey" });
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
        store.autoResolve = false;
        await store.connect("eternl");
        store.disconnect();
        assert.equal(store.state.status, "disconnected");
        assert.equal(store.state.walletKey, null);
        assert.equal(store.state.rewardAddressHex, null);
        assert.deepEqual(store.state.handles, []);
        assert.equal(store.state.selectedHandle, null);
        await assert.rejects(() => store.signTx("abc"), /not connected/);
    });
});

// Feature: connect() derives a friendly bech32 address from the change-address hex.
test("WalletStore.connect derives a friendly bech32 address", async () => {
    const mainnetBase = `01${"0".repeat(112)}`; // header 0x01 = base address, network id 1 (mainnet)
    const wallet = fakeWallet({ getChangeAddress: async () => mainnetBase });
    await withFakeCardano({ eternl: wallet }, async () => {
        const store = new WalletStore();
        store.autoResolve = false;
        await store.connect("eternl");
        assert.match(store.state.address, /^addr1/, "change address encoded as addr1…");
    });
});

// Feature: connect() auto-resolves the wallet's handles from the API and auto-selects a default.
test("WalletStore.connect auto-resolves handles + selects a default", async () => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () =>
        new Response(
            JSON.stringify([
                { name: "amber", handle_type: "handle", image: "ipfs://cidA" },
                { name: "sub@amber", handle_type: "virtual_subhandle", image: "ipfs://cidB" },
            ]),
            { status: 200, headers: { "content-type": "application/json" } },
        );
    try {
        forgetHandle(); // no remembered handle → default is the first non-virtual
        await withFakeCardano({ eternl: fakeWallet() }, async () => {
            const store = new WalletStore(); // autoResolve defaults true
            await store.connect("eternl");
            assert.equal(store.state.handles.length, 2);
            assert.equal(store.state.handles[0].name, "amber");
            assert.equal(store.state.handles[0].image, "ipfs://cidA");
            assert.equal(store.state.handles[1].virtual, true);
            assert.equal(store.state.selectedHandle, "amber"); // first non-virtual handle
        });
    } finally {
        globalThis.fetch = realFetch;
    }
});

// Feature: selectHandle changes the active handle (and dedupes); there is NO setHandles — apps
// cannot inject their own list, the store resolves it.
test("WalletStore.selectHandle changes the active handle (no setHandles)", async () => {
    forgetHandle();
    const store = new WalletStore();
    assert.equal(typeof store.setHandles, "undefined", "setHandles is intentionally not exposed");
    store.selectHandle("alpha");
    assert.equal(store.state.selectedHandle, "alpha");
    store.selectHandle("beta");
    assert.equal(store.state.selectedHandle, "beta");
    store.selectHandle("beta"); // unchanged → still beta
    assert.equal(store.state.selectedHandle, "beta");
});

// Feature: handles resolve against the WALLET's network — an explicit `network` pins preview/preprod,
// otherwise a testnet wallet (networkId 0) defaults to preprod rather than silently hitting mainnet.
test("WalletStore resolves handles against the wallet's network", async () => {
    const realFetch = globalThis.fetch;
    let calledUrl = null;
    globalThis.fetch = async (url) => {
        calledUrl = String(url);
        return new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    };
    try {
        const testnetWallet = fakeWallet({ getNetworkId: async () => 0 });
        await withFakeCardano({ eternl: testnetWallet }, async () => {
            const explicit = new WalletStore();
            explicit.network = "preview";
            await explicit.connect("eternl");
            assert.match(calledUrl, /preview\.api\.handle\.me/, "explicit network pins preview");

            const auto = new WalletStore(); // no explicit network; host (demo.handle.me) is mainnet
            await auto.connect("eternl");
            assert.match(calledUrl, /preprod\.api\.handle\.me/, "testnet wallet defaults to preprod, not mainnet");
        });
    } finally {
        globalThis.fetch = realFetch;
    }
});
