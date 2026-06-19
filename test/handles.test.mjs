import { test } from "node:test";
import assert from "node:assert/strict";
import { encode } from "cborg";
import {
    resolveWalletHandles,
    getHandleNameFromHex,
    isHandlePolicy,
    HANDLE_POLICY_STANDARD,
    HANDLE_POLICY_DEMI,
    ASSET_NAME_LABEL,
} from "../lib/wallet/handles.js";
import { hexToBytes, bytesToHex } from "../lib/utils/bytes.js";

const utf8 = (s) => new TextEncoder().encode(s);
const concat = (...arrs) => {
    const total = arrs.reduce((n, a) => n + a.length, 0);
    const out = new Uint8Array(total);
    let off = 0;
    for (const a of arrs) {
        out.set(a, off);
        off += a.length;
    }
    return out;
};

// Build a realistic getBalance() value: [coin, multiasset], multiasset = Map<policyBytes, Map<nameBytes, qty>>.
function balanceCbor() {
    const standard = hexToBytes(HANDLE_POLICY_STANDARD);
    const demi = hexToBytes(HANDLE_POLICY_DEMI);
    const otherPolicy = hexToBytes("9".repeat(56)); // 28-byte non-handle policy
    const multiasset = new Map([
        [
            standard,
            new Map([
                [utf8("bigirishlion"), 1], // bare handle
                [concat(hexToBytes(ASSET_NAME_LABEL.LBL_222), utf8("personalized")), 1], // CIP-68 222 handle
                [concat(hexToBytes(ASSET_NAME_LABEL.LBL_100), utf8("refhandle")), 1], // reference token → excluded
            ]),
        ],
        [demi, new Map([[utf8("demihandle"), 1]])], // DeMi handle
        [otherPolicy, new Map([[utf8("RandomNFT"), 5]])], // non-handle policy → excluded
    ]);
    return bytesToHex(encode([10_000_000n, multiasset]));
}

// Feature: asset-name hex decodes to the handle string, stripping a CIP-68 222 label.
test("getHandleNameFromHex strips the 222 label and UTF-8 decodes", () => {
    assert.equal(getHandleNameFromHex(bytesToHex(utf8("plainhandle"))), "plainhandle");
    const labelled = ASSET_NAME_LABEL.LBL_222 + bytesToHex(utf8("fancyhandle"));
    assert.equal(getHandleNameFromHex(labelled), "fancyhandle");
});

// Feature: policy membership recognizes the standard + DeMi handle policies, nothing else.
test("isHandlePolicy recognizes only handle policies", () => {
    assert.equal(isHandlePolicy(HANDLE_POLICY_STANDARD), true);
    assert.equal(isHandlePolicy(HANDLE_POLICY_DEMI), true);
    assert.equal(isHandlePolicy("9".repeat(56)), false);
});

// Feature: resolution lists owned handles (bare, 222, DeMi), excluding reference tokens and non-handle NFTs.
test("resolveWalletHandles extracts owned handles from a balance value", () => {
    const handles = resolveWalletHandles(balanceCbor());
    const names = handles.map((h) => h.name).sort();
    assert.deepEqual(names, ["bigirishlion", "demihandle", "personalized"]);

    // The reference token (LBL_100) and the non-handle NFT must NOT appear.
    assert.ok(!names.includes("refhandle"), "reference token excluded");
    assert.ok(!names.includes("RandomNFT"), "non-handle NFT excluded");

    // DeMi flag is set for the DeMi-policy handle only.
    assert.equal(handles.find((h) => h.name === "demihandle").isDeMi, true);
    assert.equal(handles.find((h) => h.name === "bigirishlion").isDeMi, false);
});

// Feature: a coin-only balance (no multiasset) yields no handles; empty input is safe.
test("resolveWalletHandles handles coin-only and empty input", () => {
    assert.deepEqual(resolveWalletHandles(bytesToHex(encode(10_000_000n))), []);
    assert.deepEqual(resolveWalletHandles(null), []);
});
