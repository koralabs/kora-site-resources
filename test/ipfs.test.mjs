import { test } from "node:test";
import assert from "node:assert/strict";
import { addressBech32, bech32Encode } from "../lib/wallet/index.js";
import {
    extractIpfsCid,
    gatewayUrl,
    ipfsImageUrls,
    resolveIpfsImage,
    configureKoraIpfs,
    resetKoraIpfsConfig,
} from "../lib/ipfs/index.js";
import "../lib/components/media/kora-ipfs-image/index.js";

const tick = () => new Promise((r) => queueMicrotask(r));
const flush = async (n = 5) => {
    for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 0));
};

// ---- bech32 / address encoding (vendored, no dependency) -------------------------------------

// Feature: the generic BIP-173 test vector encodes correctly (proves the checksum math).
test("bech32Encode matches the BIP-173 reference vector", () => {
    assert.equal(bech32Encode("a", new Uint8Array(0)), "a12uel5l");
});

// Feature: a hex Cardano address encodes to addr1…/addr_test…/stake1… by header byte.
test("addressBech32 derives the right prefix from the header byte", () => {
    assert.match(addressBech32(`01${"0".repeat(112)}`), /^addr1/); // type 0, network 1 → mainnet base
    assert.match(addressBech32(`00${"0".repeat(112)}`), /^addr_test1/); // network 0 → testnet
    assert.match(addressBech32(`e1${"0".repeat(56)}`), /^stake1/); // type 0xe = reward, network 1
    assert.equal(addressBech32("nothex!!"), null); // invalid hex → null (caller falls back to raw)
    assert.equal(addressBech32(null), null);
});

// ---- IPFS gateway failover -------------------------------------------------------------------

test("extractIpfsCid handles ipfs:// and gateway paths", () => {
    assert.equal(extractIpfsCid("ipfs://CID"), "CID");
    assert.equal(extractIpfsCid("ipfs://ipfs/CID"), "CID");
    assert.equal(extractIpfsCid("https://gw.example/ipfs/CID"), "CID");
    assert.equal(extractIpfsCid("https://example.com/a.png"), null);
});

test("gatewayUrl applies per-gateway token + resize quirks", () => {
    assert.equal(gatewayUrl({ base: "https://g" }, "CID", 512), "https://g/ipfs/CID");
    assert.equal(gatewayUrl({ base: "https://g", resize: true }, "CID", 256), "https://g/ipfs/CID?img-width=256");
    assert.equal(
        gatewayUrl({ base: "https://g", resize: true, token: "T" }, "CID", 512),
        "https://g/ipfs/CID?pinataGatewayToken=T&img-width=512",
    );
});

test("ipfsImageUrls builds the ordered candidate list across tiers", () => {
    const urls = ipfsImageUrls("ipfs://CID");
    assert.equal(urls[0], "https://public-handles.myfilebase.com/ipfs/CID?img-width=512"); // our gateway first
    assert.ok(urls.some((u) => u.startsWith("https://ipfs.io/ipfs/CID"))); // then free gateways
    assert.equal(urls.length, 4); // 1 our + 3 free (no proxy by default)
    assert.deepEqual(ipfsImageUrls("https://x/y.png"), ["https://x/y.png"]); // direct https passes through
    assert.deepEqual(ipfsImageUrls(null), []);
});

test("configureKoraIpfs can add a proxy tier; reset restores defaults", () => {
    try {
        configureKoraIpfs({ proxy: (cid, w) => `https://bff/ipfs-image?cid=${cid}&width=${w}` });
        const urls = ipfsImageUrls("ipfs://CID");
        assert.equal(urls.at(-1), "https://bff/ipfs-image?cid=CID&width=512");
    } finally {
        resetKoraIpfsConfig();
    }
    assert.equal(ipfsImageUrls("ipfs://CID").length, 4); // proxy gone after reset
});

// Feature: resolveIpfsImage races tiers via an injectable probe; non-IPFS https resolves to itself.
test("resolveIpfsImage uses the tiered probe and short-circuits direct https", async () => {
    const winner = await resolveIpfsImage("ipfs://CID", { probe: async (urls) => urls[0] });
    assert.equal(winner, "https://public-handles.myfilebase.com/ipfs/CID?img-width=512");

    // First tier misses, second wins.
    let call = 0;
    const winner2 = await resolveIpfsImage("ipfs://CID", {
        probe: async (urls) => (call++ === 0 ? null : urls[0]),
    });
    assert.match(winner2, /^https:\/\/ipfs\.io\/ipfs\/CID/);

    assert.equal(await resolveIpfsImage("https://x/y.png"), "https://x/y.png");
    assert.equal(await resolveIpfsImage(null), null);
});

// Feature: a pre-signed NFTCDN URL is the recovery tier — appended after our/free, before proxy.
test("nftcdnUrl is the last IPFS-failover tier", () => {
    const NFTCDN = "https://asset1abc.handles.nftcdn.io/image?tk=sig";
    const urls = ipfsImageUrls("ipfs://CID", undefined, { nftcdnUrl: NFTCDN });
    assert.equal(urls.length, 5); // 1 our + 3 free + nftcdn
    assert.equal(urls.at(-1), NFTCDN); // after the gateways
    // Proxy, when configured, comes after NFTCDN.
    try {
        configureKoraIpfs({ proxy: (cid, w) => `https://bff/ipfs-image?cid=${cid}&width=${w}` });
        const withProxy = ipfsImageUrls("ipfs://CID", undefined, { nftcdnUrl: NFTCDN });
        assert.equal(withProxy.at(-2), NFTCDN);
        assert.equal(withProxy.at(-1), "https://bff/ipfs-image?cid=CID&width=512");
    } finally {
        resetKoraIpfsConfig();
    }
    // An asset with no resolvable CID still gets the NFTCDN candidate.
    assert.deepEqual(ipfsImageUrls(null, undefined, { nftcdnUrl: NFTCDN }), [NFTCDN]);
});

// Feature: resolveIpfsImage falls through to nftcdnUrl only after our + free both miss.
test("resolveIpfsImage falls through to nftcdnUrl when gateways miss", async () => {
    const NFTCDN = "https://asset1abc.handles.nftcdn.io/image?tk=sig";
    let call = 0;
    const winner = await resolveIpfsImage("ipfs://CID", {
        nftcdnUrl: NFTCDN,
        probe: async (urls) => (call++ < 2 ? null : urls[0]), // our miss, free miss, nftcdn hits
    });
    assert.equal(winner, NFTCDN);

    // A dead/absent src with only an NFTCDN URL still recovers.
    assert.equal(await resolveIpfsImage(null, { nftcdnUrl: NFTCDN, probe: async (u) => u[0] }), NFTCDN);
});

// Feature: <kora-ipfs-image> resolves a direct https src onto its inner <img>.
test("<kora-ipfs-image> sets the resolved src on its img", async () => {
    document.body.innerHTML = "";
    const el = document.createElement("kora-ipfs-image");
    el.setAttribute("src", "https://example.com/pic.png");
    el.setAttribute("alt", "pic");
    document.body.appendChild(el);
    await tick();
    await flush();
    const img = el.querySelector("img");
    assert.ok(img);
    assert.equal(img.getAttribute("src"), "https://example.com/pic.png");
    assert.equal(img.getAttribute("alt"), "pic");
});
