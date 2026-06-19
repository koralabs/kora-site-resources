/**
 * Handle-resolution adapter — turns a connected wallet's CIP-30 value (the `getBalance` CBOR, or
 * its `getUtxos` CBOR) into the list of Ada Handles it holds, so the UI can show the chosen
 * $handle and list them all.
 *
 * This is the deliberate "decoding layer" kept OUT of the zero-dep WalletStore: it depends on a
 * CBOR decoder (`cborg`, pure ESM). The handle policy IDs and CIP-68 asset-name labels are public,
 * stable chain constants, mirrored here from `@koralabs/kora-labs-common` (HANDLE_POLICIES /
 * AssetNameLabel) so a browser bundle doesn't have to pull that package's heavy transitive deps.
 *
 * Scope: on-chain handle tokens held in the wallet (bare-name and CIP-68 222 tokens). Reference
 * tokens (100/000) are excluded. Virtual SubHandles (444) are issued off the wallet and resolved
 * via the BFF /address_handles API — that's an app/network concern, not chain-data parsing.
 */
import { decode } from "cborg";
import { hexToBytes, bytesToHex } from "../utils/bytes.js";
import { ASSET_NAME_LABEL, HANDLE_POLICY_DEMI, isHandlePolicy } from "./policies.js";

// Re-exported for compatibility — the constants now live in the dependency-free policies module.
export {
    ASSET_NAME_LABEL,
    HANDLE_POLICY_STANDARD,
    HANDLE_POLICY_DEMI,
    HANDLE_POLICY_IDS,
    isHandlePolicy,
} from "./policies.js";

const REFERENCE_LABELS = [
    ASSET_NAME_LABEL.LBL_000,
    ASSET_NAME_LABEL.LBL_001,
    ASSET_NAME_LABEL.LBL_002,
    ASSET_NAME_LABEL.LBL_100,
];

const textDecoder = new TextDecoder();

/** Asset-name hex → human handle string. Strips a leading CIP-68 222/444 label, then UTF-8 decodes. */
export function getHandleNameFromHex(assetNameHex: string): string {
    let hex = assetNameHex.startsWith("0x") ? assetNameHex.slice(2) : assetNameHex;
    if (hex.startsWith(ASSET_NAME_LABEL.LBL_222)) hex = hex.slice(ASSET_NAME_LABEL.LBL_222.length);
    else if (hex.startsWith(ASSET_NAME_LABEL.LBL_444)) hex = hex.slice(ASSET_NAME_LABEL.LBL_444.length);
    return textDecoder.decode(hexToBytes(hex));
}

/** A handle token held by the wallet. */
export interface HandleAsset {
    policyId: string;
    assetNameHex: string;
    name: string;
    quantity: bigint;
    isDeMi: boolean;
}

interface RawAsset {
    policyId: string;
    assetNameHex: string;
    quantity: bigint;
}

function keyToHex(key: unknown): string {
    if (key instanceof Uint8Array) return bytesToHex(key);
    if (typeof key === "string") return key.startsWith("0x") ? key.slice(2) : key;
    return "";
}

function toBigInt(value: unknown): bigint {
    if (typeof value === "bigint") return value;
    const n = Number(value);
    return Number.isFinite(n) ? BigInt(Math.trunc(n)) : 0n;
}

function mapEntries(value: unknown): [unknown, unknown][] {
    if (value instanceof Map) return [...value.entries()];
    if (value && typeof value === "object") return Object.entries(value as Record<string, unknown>);
    return [];
}

/** Walk a decoded Cardano `value` ([coin, multiasset] | coin) into flat assets. */
function assetsFromDecodedValue(value: unknown): RawAsset[] {
    if (!Array.isArray(value)) return []; // coin-only value carries no assets
    const assets: RawAsset[] = [];
    for (const [policyKey, names] of mapEntries(value[1])) {
        const policyId = keyToHex(policyKey);
        if (!policyId) continue;
        for (const [nameKey, quantity] of mapEntries(names)) {
            const assetNameHex = keyToHex(nameKey);
            if (!assetNameHex) continue;
            assets.push({ policyId, assetNameHex, quantity: toBigInt(quantity) });
        }
    }
    return assets;
}

function isOwnedHandleName(assetNameHex: string): boolean {
    const hex = assetNameHex.startsWith("0x") ? assetNameHex.slice(2) : assetNameHex;
    return !REFERENCE_LABELS.some((label) => hex.startsWith(label));
}

function toHandleAssets(raw: RawAsset[]): HandleAsset[] {
    const seen = new Set<string>();
    const handles: HandleAsset[] = [];
    for (const asset of raw) {
        if (!isHandlePolicy(asset.policyId) || !isOwnedHandleName(asset.assetNameHex)) continue;
        const dedupeKey = `${asset.policyId}.${asset.assetNameHex}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        handles.push({
            ...asset,
            name: getHandleNameFromHex(asset.assetNameHex),
            isDeMi: asset.policyId === HANDLE_POLICY_DEMI,
        });
    }
    return handles;
}

/** Resolve the handles held in a wallet from its CIP-30 `getBalance()` CBOR (hex). */
export function resolveWalletHandles(balanceCborHex: string | null | undefined): HandleAsset[] {
    if (!balanceCborHex) return [];
    return toHandleAssets(assetsFromDecodedValue(decode(hexToBytes(balanceCborHex), { useMaps: true })));
}

/** Resolve handles from an array of CIP-30 `getUtxos()` CBOR strings (hex), de-duplicated. */
export function resolveHandlesFromUtxos(utxoCborHexes: readonly string[]): HandleAsset[] {
    const raw: RawAsset[] = [];
    for (const hex of utxoCborHexes) {
        const utxo = decode(hexToBytes(hex), { useMaps: true });
        if (!Array.isArray(utxo) || utxo.length < 2) continue;
        const output = utxo[1];
        const value = Array.isArray(output)
            ? output[1]
            : output instanceof Map
              ? output.get(1)
              : undefined;
        raw.push(...assetsFromDecodedValue(value));
    }
    return toHandleAssets(raw);
}

/**
 * Pick the default/current handle from a resolved list. Prefers `preferred` (e.g. the
 * last-remembered handle) when it's still present, else the first handle.
 */
export function chooseDefaultHandle(
    handles: readonly HandleAsset[],
    preferred?: string | null,
): string | null {
    if (preferred && handles.some((h) => h.name === preferred)) return preferred;
    return handles[0]?.name ?? null;
}
