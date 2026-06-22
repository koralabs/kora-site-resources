import { test } from "node:test";
import assert from "node:assert/strict";
import { WalletStore, forgetHandle } from "../lib/wallet/index.js";
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
        getChangeAddress: async () => `01${"0".repeat(112)}`, // valid mainnet base address hex
        getRewardAddresses: async () => ["e1stakehex"],
        getUsedAddresses: async () => [`01${"0".repeat(112)}`],
        getBalance: async () => "1a002dc6c0",
        signTx: async (t) => t,
        submitTx: async () => "tx",
    }),
};

const DEFAULT_HANDLES = [
    { name: "amber", handle_type: "handle" },
    { name: "apprentices", handle_type: "handle" },
    { name: "sub@hal", handle_type: "virtual_subhandle" },
];

// Mount a panel against a store that resolves the given handle list (via a stubbed Handle API) on
// connect — the only way handles enter the panel now (no setHandles). fetch is restored once
// resolution has completed.
async function mountConnectedPanel(apiHandles = DEFAULT_HANDLES) {
    forgetHandle(); // deterministic default selection (no remembered handle)
    document.body.innerHTML = "";
    const realFetch = globalThis.fetch;
    globalThis.fetch = async () =>
        new Response(JSON.stringify(apiHandles), { status: 200, headers: { "content-type": "application/json" } });
    try {
        const store = new WalletStore(); // autoResolve default true
        const panel = document.createElement("kora-wallet-panel");
        panel.store = store;
        panel.setAttribute("env", "mainnet");
        document.body.appendChild(panel);
        await tick();
        await store.connect("eternl");
        await flush();
        return { store, panel };
    } finally {
        globalThis.fetch = realFetch;
    }
}

// Feature: the profile shows the selected handle, the address, and env-aware action links.
test("kora-wallet-panel renders the profile + action links", async () => {
    await withFakeCardano({ eternl: fakeWallet }, async () => {
        const { panel } = await mountConnectedPanel();
        assert.equal(panel.querySelector('[data-ref="handle"]').textContent, "amber");
        assert.match(panel.querySelector('[data-ref="addr"]').textContent, /^addr1/, "friendly addr shown");
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

// Feature: handles with an image render a <kora-ipfs-image> avatar (failover), not a placeholder.
test("kora-wallet-panel shows handle images via kora-ipfs-image", async () => {
    await withFakeCardano({ eternl: fakeWallet }, async () => {
        const { panel } = await mountConnectedPanel([
            { name: "amber", handle_type: "handle", image: "ipfs://cidSelected" },
            { name: "apprentices", handle_type: "handle", image: "ipfs://cidRow" },
        ]);
        // Profile avatar = the selected handle's image.
        const avatar = panel.querySelector('[data-ref="avatar"] kora-ipfs-image');
        assert.ok(avatar, "profile avatar uses kora-ipfs-image");
        assert.equal(avatar.getAttribute("src"), "ipfs://cidSelected");
        // List row carries its own image too.
        const rowImg = panel.querySelector('.kora-wallet-panel__row[data-name="apprentices"] kora-ipfs-image');
        assert.ok(rowImg, "row uses kora-ipfs-image");
        assert.equal(rowImg.getAttribute("src"), "ipfs://cidRow");
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

// Feature: a drawer row click emits kora-handle-select with source "user".
test("kora-wallet-panel emits kora-handle-select (source=user) on row click", async () => {
    await withFakeCardano({ eternl: fakeWallet }, async () => {
        const { panel } = await mountConnectedPanel();
        let detail = null;
        panel.addEventListener("kora-handle-select", (e) => (detail = e.detail));
        panel.querySelector('.kora-wallet-panel__row[data-name="apprentices"]').click();
        await tick();
        assert.equal(detail.name, "apprentices");
        assert.equal(detail.previous, "amber");
        assert.equal(detail.source, "user");
        assert.equal(panel.selected, "apprentices");
        assert.equal(panel.querySelector('[data-ref="handle"]').textContent, "apprentices");
    });
});

// Feature: programmatic/auto selection fires the SAME event (source=programmatic), and unchanged
// assignments are deduped (no event).
test("kora-handle-select fires on programmatic selection and dedupes", async () => {
    await withFakeCardano({ eternl: fakeWallet }, async () => {
        const { panel } = await mountConnectedPanel(); // selected is already "amber"
        const events = [];
        panel.addEventListener("kora-handle-select", (e) => events.push(e.detail));

        panel.selected = "apprentices"; // real change → emit
        await tick();
        assert.equal(events.length, 1);
        assert.deepEqual(
            { name: events[0].name, previous: events[0].previous, source: events[0].source },
            { name: "apprentices", previous: "amber", source: "programmatic" },
        );

        panel.selected = "apprentices"; // unchanged → no emit
        await tick();
        assert.equal(events.length, 1);

        panel.selected = null; // change → emit with name null (e.g. on disconnect)
        await tick();
        assert.equal(events.length, 2);
        assert.equal(events[1].name, null);
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
