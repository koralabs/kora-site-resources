import { test } from "node:test";
import assert from "node:assert/strict";
import { WalletStore, rememberWallet, recallWallet, forgetWallet } from "../lib/wallet/index.js";
import { chooseDefaultHandle } from "../lib/wallet/handles.js";

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
        getChangeAddress: async () => "01change",
        getRewardAddresses: async () => ["e1stake"],
        getUsedAddresses: async () => ["01used"],
        getBalance: async () => "1a00",
        signTx: async (t) => t,
        submitTx: async () => "tx",
    }),
};

// Feature: connecting remembers the wallet; disconnecting forgets it.
test("connect remembers the wallet key; disconnect forgets it", async () => {
    forgetWallet();
    await withFakeCardano({ eternl: fakeWallet }, async () => {
        const store = new WalletStore();
        await store.connect("eternl");
        assert.equal(recallWallet(), "eternl");
        store.disconnect();
        assert.equal(recallWallet(), null);
    });
});

// Feature: autoConnect silently reconnects a previously-remembered wallet, and no-ops otherwise.
test("autoConnect reconnects a remembered wallet only", async () => {
    forgetWallet();
    await withFakeCardano({ eternl: fakeWallet }, async () => {
        const cold = new WalletStore();
        assert.equal(await cold.autoConnect({ waitMs: 50 }), false); // nothing remembered → no prompt

        rememberWallet("eternl");
        const warm = new WalletStore();
        const ok = await warm.autoConnect({ waitMs: 200 });
        await flush();
        assert.equal(ok, true);
        assert.equal(warm.state.status, "connected");
    });
    forgetWallet();
});

// Feature: autoConnect won't reconnect a remembered wallet that's no longer installed.
test("autoConnect gives up if the remembered wallet is absent", async () => {
    rememberWallet("ghostwallet");
    await withFakeCardano({}, async () => {
        const store = new WalletStore();
        assert.equal(await store.autoConnect({ waitMs: 50 }), false);
        assert.equal(store.state.status, "disconnected");
    });
    forgetWallet();
});

// Feature: chooseDefaultHandle prefers the remembered handle when it's still owned.
test("chooseDefaultHandle prefers the remembered handle", () => {
    const handles = [{ name: "amber" }, { name: "apprentices" }];
    assert.equal(chooseDefaultHandle(handles, "apprentices"), "apprentices"); // preferred, present
    assert.equal(chooseDefaultHandle(handles, "gone"), "amber"); // preferred absent → first
    assert.equal(chooseDefaultHandle(handles, null), "amber"); // none → first
    assert.equal(chooseDefaultHandle([], "amber"), null); // empty → null
});
