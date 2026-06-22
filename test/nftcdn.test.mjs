import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { assetFingerprint, signNftcdnUrl, nftcdnImageUrl } from "../lib/nftcdn/index.js";

// ---- CIP-14 asset fingerprint ----------------------------------------------------------------

// Feature: matches the official CIP-14 test vectors (blake2b-160 of policy++name, bech32 "asset").
test("assetFingerprint matches the CIP-14 reference vectors", () => {
    const P1 = "7eae28af2208be856f7a119668ae52a49b73725e326dc16579dcc373";
    const P2 = "1e349c9bdea19fd6c147626a5260bc44b71635f398b67c59881df209";
    assert.equal(assetFingerprint(P1, ""), "asset1rjklcrnsdzqp65wjgrg55sy9723kw09mlgvlc3");
    assert.equal(assetFingerprint(P2, ""), "asset1uyuxku60yqe57nusqzjx38aan3f2wq6s93f6ea");
    assert.equal(assetFingerprint(P1, "504154415445"), "asset13n25uv0yaf5kus35fm2k86cqy60z58d9xmde92");
    assert.equal(assetFingerprint(P2, "504154415445"), "asset1hv4p5tv2a837mzqrst04d0dcptdjmluqvdx9k3");
});

// Feature: a real CIP-68 asset (Frigid1040, label 000de140) yields the chain's fingerprint.
test("assetFingerprint computes a real CIP-68 asset's fingerprint", () => {
    const fp = assetFingerprint(
        "8da763ce1d6adb725a295a7f145c32808295b542de5062d92efa8370",
        "000de14046726967696431303430",
    );
    assert.equal(fp, "asset1llsvlh44vfg5pkxe0w607rxtvljjfg90ecy7gj");
});

test("assetFingerprint rejects non-hex input", () => {
    assert.throws(() => assetFingerprint("zz", ""));
});

// ---- NFTCDN signed URL ------------------------------------------------------------------------

const DUMMY_KEY = Buffer.alloc(32, 7).toString("base64"); // obviously-fake 32-byte secret

// Independent reference signer using node:crypto — the production signing this mirrors was
// confirmed to return 206 from NFTCDN mainnet, so byte-equality here proves correctness.
function referenceUrl(fp, { subdomain, key, width, path = "/image" }) {
    const base = `https://${fp}.${subdomain}.nftcdn.io${path}`;
    const p = new URLSearchParams();
    if (width) p.set("size", String(width));
    p.set("tk", "");
    const tk = crypto.createHmac("sha256", Buffer.from(key, "base64")).update(`${base}?${p.toString()}`).digest("base64url");
    p.set("tk", tk);
    return `${base}?${p.toString()}`;
}

// Feature: signNftcdnUrl reproduces NFTCDN's HMAC-SHA256-over-empty-tk-URL scheme exactly.
test("signNftcdnUrl matches the node:crypto reference (no size, and with size)", () => {
    const fp = "asset1llsvlh44vfg5pkxe0w607rxtvljjfg90ecy7gj";
    assert.equal(
        signNftcdnUrl(fp, { subdomain: "handles", key: DUMMY_KEY }),
        referenceUrl(fp, { subdomain: "handles", key: DUMMY_KEY }),
    );
    assert.equal(
        signNftcdnUrl(fp, { subdomain: "handles", key: DUMMY_KEY, width: 512 }),
        referenceUrl(fp, { subdomain: "handles", key: DUMMY_KEY, width: 512 }),
    );
});

// Feature: the URL is well-formed — correct host, `size` before `tk`, unpadded base64url token.
test("signNftcdnUrl produces a well-formed signed URL", () => {
    const url = signNftcdnUrl("asset1llsvlh44vfg5pkxe0w607rxtvljjfg90ecy7gj", {
        subdomain: "handles",
        key: DUMMY_KEY,
        width: 256,
    });
    assert.match(url, /^https:\/\/asset1llsvlh44vfg5pkxe0w607rxtvljjfg90ecy7gj\.handles\.nftcdn\.io\/image\?size=256&tk=/);
    const tk = new URL(url).searchParams.get("tk");
    assert.ok(tk && tk.length > 0 && !tk.includes("=") && !tk.includes("+") && !tk.includes("/")); // base64url, unpadded
});

// Feature: a raw-bytes key works identically to its base64 form.
test("signNftcdnUrl accepts raw-bytes key equivalently to base64", () => {
    const fp = "asset1llsvlh44vfg5pkxe0w607rxtvljjfg90ecy7gj";
    const bytes = Buffer.from(DUMMY_KEY, "base64");
    assert.equal(
        signNftcdnUrl(fp, { subdomain: "handles", key: bytes }),
        signNftcdnUrl(fp, { subdomain: "handles", key: DUMMY_KEY }),
    );
});

// Feature: nftcdnImageUrl == fingerprint + sign in one step.
test("nftcdnImageUrl composes fingerprint + sign", () => {
    const policy = "8da763ce1d6adb725a295a7f145c32808295b542de5062d92efa8370";
    const name = "000de14046726967696431303430";
    assert.equal(
        nftcdnImageUrl(policy, name, { subdomain: "handles", key: DUMMY_KEY, width: 512 }),
        signNftcdnUrl(assetFingerprint(policy, name), { subdomain: "handles", key: DUMMY_KEY, width: 512 }),
    );
});
