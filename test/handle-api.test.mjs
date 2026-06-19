import { test } from "node:test";
import assert from "node:assert/strict";
import {
    fetchWalletHandles,
    isVirtualSubHandle,
    isDeMiHandle,
    HANDLE_POLICY_DEMI,
} from "../lib/wallet/index.js";

// A real reward address hex (e1 + 28-byte stake key hash) — the form CIP-30 getRewardAddresses() gives.
const REWARD_HEX = "e1c251da0507cacfe8146dcb7e528c695a35824bc1d005880b234a507f";

function stubFetch(handler) {
    const prev = globalThis.fetch;
    globalThis.fetch = handler;
    return () => {
        globalThis.fetch = prev;
    };
}

/** Build a Response-ish object with an x-handles-search-total header. */
function page(items, total) {
    return {
        ok: true,
        json: async () => items,
        headers: { get: (k) => (k === "x-handles-search-total" ? String(total) : null) },
    };
}

// Feature: posts the hex reward address AS-IS to /handles/list?type=stakekeyhash on the env-aware host.
test("fetchWalletHandles calls the Handle API with the raw hex reward address", async () => {
    let captured = null;
    const restore = stubFetch(async (url, init) => {
        captured = { url, init };
        return { ok: true, json: async () => [{ name: "amber", handle_type: "handle" }] };
    });
    try {
        const handles = await fetchWalletHandles(REWARD_HEX, { env: "mainnet" });
        assert.match(captured.url, /^https:\/\/api\.handle\.me\/handles\/list\?type=stakekeyhash/);
        assert.match(captured.url, /[?&]page=1\b/);
        assert.equal(captured.init.method, "POST");
        assert.deepEqual(JSON.parse(captured.init.body), [REWARD_HEX]); // passed through untouched
        assert.equal(handles[0].name, "amber");
    } finally {
        restore();
    }
});

// Feature (current API): with the buggy page-count header, it still gathers every page and stops
// only on the short page — the page-count header must NOT cause an early stop.
test("fetchWalletHandles paginates correctly under the current page-count header", async () => {
    const pageSize = 250;
    const full = Array.from({ length: pageSize }, (_, i) => ({ name: `h${i}`, handle_type: "handle" }));
    const tail = [{ name: "last@hal", handle_type: "virtual_subhandle" }];
    const pages = [full, full, tail]; // 250 + 250 + 1 = 501
    let call = 0;
    const seenPages = [];
    const restore = stubFetch(async (url) => {
        seenPages.push(Number(new URL(url).searchParams.get("page")));
        const items = pages[call++];
        return page(items, items.length); // BUG: header reports this page's count
    });
    try {
        const handles = await fetchWalletHandles(REWARD_HEX, { env: "mainnet" });
        assert.equal(handles.length, 501); // page-count header didn't stop us early at page 1
        assert.equal(call, 3);
        assert.deepEqual(seenPages, [1, 2, 3]);
        assert.equal(handles[500].name, "last@hal");
    } finally {
        restore();
    }
});

// Feature (planned fix): a correct grand-total header is authoritative — it keeps paginating even
// past a short page (the case where a full name-page yields fewer JSON objects), and stops exactly
// when the full set is gathered.
test("fetchWalletHandles uses a correct grand-total header to gather the full set", async () => {
    const TOTAL = 300;
    // Note: both pages are SHORTER than pageSize(250); a short-page-only rule would stop after page 1.
    const pages = [
        Array.from({ length: 200 }, (_, i) => ({ name: `h${i}`, handle_type: "handle" })),
        Array.from({ length: 100 }, (_, i) => ({ name: `v${i}`, handle_type: "virtual_subhandle" })),
    ];
    let call = 0;
    const restore = stubFetch(async () => page(pages[call++], TOTAL)); // header = grand total
    try {
        const handles = await fetchWalletHandles(REWARD_HEX, { env: "mainnet" });
        assert.equal(handles.length, TOTAL); // header drove pagination past the short first page
        assert.equal(call, 2);
    } finally {
        restore();
    }
});

// Feature: env prefixes the API host; baseUrl override wins.
test("fetchWalletHandles is env-aware and overridable", async () => {
    const urls = [];
    const restore = stubFetch(async (url) => {
        urls.push(url);
        return { ok: true, json: async () => [] };
    });
    try {
        await fetchWalletHandles(REWARD_HEX, { env: "preview" });
        await fetchWalletHandles(REWARD_HEX, { baseUrl: "https://my-proxy.example" });
        assert.match(urls[0], /^https:\/\/preview\.api\.handle\.me\/handles\/list/);
        assert.match(urls[1], /^https:\/\/my-proxy\.example\/handles\/list/);
    } finally {
        restore();
    }
});

// Feature: empty reward address → no request, empty list; non-ok response throws (→ caller can fall back).
test("fetchWalletHandles guards empty input and surfaces errors", async () => {
    assert.deepEqual(await fetchWalletHandles(null), []);
    const restore = stubFetch(async () => ({ ok: false, status: 503, json: async () => ({}) }));
    try {
        await assert.rejects(() => fetchWalletHandles(REWARD_HEX), /503/);
    } finally {
        restore();
    }
});

// Feature: classifiers distinguish virtual subhandles + DeMi handles.
test("handle classifiers", () => {
    assert.equal(isVirtualSubHandle({ name: "7ae@hal", handle_type: "virtual_subhandle" }), true);
    assert.equal(isVirtualSubHandle({ name: "amber", handle_type: "handle" }), false);
    assert.equal(isDeMiHandle({ name: "x", handle_type: "handle", policy: HANDLE_POLICY_DEMI }), true);
    assert.equal(isDeMiHandle({ name: "x", handle_type: "handle", policy: "other" }), false);
});
