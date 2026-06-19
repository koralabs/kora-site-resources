/**
 * Ada Handle policy IDs + CIP-68 asset-name labels — public, stable chain constants, mirrored from
 * @koralabs/kora-labs-common (HANDLE_POLICIES / AssetNameLabel). Kept dependency-free (no cborg) so
 * both the on-chain resolver (handles.ts) and the Handle-API adapter (handle-api.ts) can share them.
 */

/** CIP-68 asset-name label prefixes. */
export const ASSET_NAME_LABEL = {
    LBL_000: "00000000",
    LBL_001: "00001070",
    LBL_002: "000020e0",
    LBL_100: "000643b0", // reference token
    LBL_222: "000de140", // personalized handle (user token)
    LBL_444: "001bc280", // virtual subhandle
} as const;

export const HANDLE_POLICY_STANDARD = "f0ff48bbb7bbe9d59a40f1ce90e9e9d0ff5002ec48f232b49ca0fb9a";
export const HANDLE_POLICY_DEMI = "6c32db33a422e0bc2cb535bb850b5a6e9a9572222056d6ddc9cbc26e";
export const HANDLE_POLICY_IDS: ReadonlySet<string> = new Set([
    HANDLE_POLICY_STANDARD,
    HANDLE_POLICY_DEMI,
]);

export function isHandlePolicy(policyId: string): boolean {
    return HANDLE_POLICY_IDS.has(policyId);
}
