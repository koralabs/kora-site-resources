/**
 * NFTCDN (nftcdn.io) image-URL helper — the CIP-14 asset fingerprint plus an HMAC-signed
 * mainnet image URL. Pure (@noble/@scure), isomorphic, dependency-light.
 *
 * SECURITY: the HMAC secret must stay server-side. Only call the *signing* functions
 * (`signNftcdnUrl` / `nftcdnImageUrl`) where the key lives — a BFF / SSR layer — never in a
 * browser bundle. The browser consumes only the resulting *pre-signed* URL, as the last tier
 * of the IPFS image failover (see `../ipfs`). `assetFingerprint` alone is safe anywhere.
 *
 * Why signing exists: NFTCDN's mainnet (and preprod) endpoints require each URL to carry a
 * `tk` = base64url(HMAC-SHA256(url-with-empty-tk, secret)) — a per-asset capability token. An
 * unsigned or invalid `tk` is rejected (403/500) even from an allow-listed origin; the origin
 * allow-list governs embedding/CORS, not authentication. The preview network is public.
 */
import { blake2b } from "@noble/hashes/blake2b";
import { hmac } from "@noble/hashes/hmac";
import { sha256 } from "@noble/hashes/sha256";
import { base64, base64urlnopad, bech32 } from "@scure/base";

function hexToBytes(hex: string): Uint8Array {
    const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
    if (clean.length % 2 !== 0 || /[^0-9a-fA-F]/.test(clean)) throw new Error(`invalid hex: ${hex}`);
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    return out;
}

/**
 * CIP-14 asset fingerprint (`asset1…`) from a policy id and asset-name, both hex.
 * `fingerprint = bech32("asset", blake2b-160(policyId ++ assetName))`. Pure — safe in any runtime.
 */
export function assetFingerprint(policyIdHex: string, assetNameHex = ""): string {
    const policy = hexToBytes(policyIdHex);
    const name = assetNameHex ? hexToBytes(assetNameHex) : new Uint8Array(0);
    const payload = new Uint8Array(policy.length + name.length);
    payload.set(policy, 0);
    payload.set(name, policy.length);
    return bech32.encode("asset", bech32.toWords(blake2b(payload, { dkLen: 20 })));
}

export interface NftcdnUrlOptions {
    /** NFTCDN subdomain from your dashboard, e.g. "handles" for `*.handles.nftcdn.io`. */
    subdomain: string;
    /** Gateway secret key — base64 string (as shown in the dashboard) or raw bytes. SERVER-ONLY. */
    key: string | Uint8Array;
    /** Optimized size in px; NFTCDN accepts powers of two 32…1024. Omit for the original image. */
    width?: number;
    /** Endpoint path; defaults to "/image" ("/metadata", "/files/…" also exist). */
    path?: string;
}

const toKeyBytes = (key: string | Uint8Array): Uint8Array =>
    typeof key === "string" ? base64.decode(key) : key;

/**
 * Build a signed NFTCDN URL for an already-computed fingerprint, mirroring NFTCDN's reference
 * algorithm: serialize params with an empty `tk`, HMAC-SHA256 the full URL, then set
 * `tk = base64url(mac)` (unpadded). SERVER-ONLY (needs the secret key).
 */
export function signNftcdnUrl(fingerprint: string, options: NftcdnUrlOptions): string {
    const { subdomain, key, width, path = "/image" } = options;
    const base = `https://${fingerprint}.${subdomain}.nftcdn.io${path}`;
    const params = new URLSearchParams();
    if (width) params.set("size", String(width));
    params.set("tk", "");
    const unsigned = `${base}?${params.toString()}`;
    const mac = hmac(sha256, toKeyBytes(key), new TextEncoder().encode(unsigned));
    params.set("tk", base64urlnopad.encode(mac));
    return `${base}?${params.toString()}`;
}

/**
 * Convenience: a signed NFTCDN image URL straight from a policy id + asset-name (both hex).
 * Computes the CIP-14 fingerprint, then signs. SERVER-ONLY (needs the secret key).
 */
export function nftcdnImageUrl(
    policyIdHex: string,
    assetNameHex: string,
    options: NftcdnUrlOptions,
): string {
    return signNftcdnUrl(assetFingerprint(policyIdHex, assetNameHex), options);
}
