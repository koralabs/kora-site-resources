/**
 * Framework-agnostic CIP-30 primitives — wallet discovery + enable. Zero dependencies and NO
 * cardano-address/decoding: returns raw CIP-30 values (hex addresses, CBOR balance); apps (or an
 * optional @cardano-sdk adapter) decode. Mirrors the established handle.me `walletConnector.ts`.
 */

/** CIP-30 `signData` result — a CIP-8 COSE_Sign1 signature + the COSE_Key, both hex. */
export interface Cip30DataSignature {
    signature: string;
    key: string;
}

/** CIP-30 pagination argument (`{ page, limit }`). */
export interface Cip30Paginate {
    page: number;
    limit: number;
}

/**
 * A connected CIP-30 wallet API. We `enable()` and return the wallet's object VERBATIM — no wrapper,
 * no proxy — so this type describes the full standard CIP-30 surface (not a subset). In particular
 * `signData` (CIP-8 / data signing), `getCollateral`, and `getExtensions` are all available; the
 * store only *calls* the few it needs internally, but consumers get the whole API typed.
 */
export interface Cip30Api {
    getNetworkId: () => Promise<number>;
    getExtensions?: () => Promise<{ cip: number }[]>;
    getChangeAddress: () => Promise<string>;
    getRewardAddresses: () => Promise<string[]>;
    getUsedAddresses: (paginate?: Cip30Paginate) => Promise<string[]>;
    getUnusedAddresses: () => Promise<string[]>;
    getUtxos: (amount?: string, paginate?: Cip30Paginate) => Promise<string[] | undefined>;
    getCollateral?: (params?: { amount?: string }) => Promise<string[] | undefined>;
    getBalance: () => Promise<string>;
    /** CIP-8 data signing — sign an arbitrary payload with the key for `address`. */
    signData: (address: string, payload: string) => Promise<Cip30DataSignature>;
    signTx: (tx: string, partialSign?: boolean) => Promise<string>;
    submitTx: (tx: string) => Promise<string>;
    cip95?: { getPubDRepKey: () => Promise<string> };
    experimental?: Record<string, unknown>;
}

/** `enable` options. `extensions` requests optional wallet extensions (e.g. CIP-95 governance). */
export interface Cip30EnableOptions {
    extensions?: { cip: number }[];
}

/** The injected, not-yet-enabled wallet object at `window.cardano[key]`. */
export interface Cip30WalletStub {
    name?: string;
    icon?: string;
    apiVersion?: string;
    enable?: (options?: Cip30EnableOptions) => Promise<Cip30Api>;
}

/** Discovered wallet, before connection. */
export interface Cip30WalletInfo {
    key: string;
    name: string;
    icon: string;
    apiVersion?: string;
}

type CardanoNamespace = Record<string, Cip30WalletStub>;

function cardanoNamespace(): CardanoNamespace | undefined {
    return (globalThis as typeof globalThis & { cardano?: CardanoNamespace }).cardano;
}

/** List the CIP-30 wallets injected into `window.cardano`. */
export function listAvailableWallets(): Cip30WalletInfo[] {
    const cardano = cardanoNamespace();
    if (!cardano) return [];
    const wallets: Cip30WalletInfo[] = [];
    for (const [key, stub] of Object.entries(cardano)) {
        // A CIP-30 wallet entry is an object exposing an `enable` function.
        if (stub && typeof stub.enable === "function") {
            wallets.push({
                key,
                name: stub.name ?? key,
                icon: stub.icon ?? "",
                ...(stub.apiVersion ? { apiVersion: stub.apiVersion } : {}),
            });
        }
    }
    return wallets;
}

export class WalletNotFoundError extends Error {
    constructor(public readonly walletKey: string) {
        super(`CIP-30 wallet "${walletKey}" is not installed`);
        this.name = "WalletNotFoundError";
    }
}

/** Enable (connect to) a wallet by its `window.cardano` key, returning its CIP-30 API. */
export async function enableWallet(
    walletKey: string,
    options?: Cip30EnableOptions,
): Promise<Cip30Api> {
    const stub = cardanoNamespace()?.[walletKey];
    if (!stub || typeof stub.enable !== "function") {
        throw new WalletNotFoundError(walletKey);
    }
    return stub.enable(options);
}
