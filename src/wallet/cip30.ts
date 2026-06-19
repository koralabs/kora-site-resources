/**
 * Framework-agnostic CIP-30 primitives — wallet discovery + enable. Zero dependencies and NO
 * cardano-address/decoding: returns raw CIP-30 values (hex addresses, CBOR balance); apps (or an
 * optional @cardano-sdk adapter) decode. Mirrors the established handle.me `walletConnector.ts`.
 */

/** A connected CIP-30 wallet API (the subset we use). */
export interface Cip30Api {
    getNetworkId: () => Promise<number>;
    getChangeAddress: () => Promise<string>;
    getRewardAddresses: () => Promise<string[]>;
    getUsedAddresses: () => Promise<string[]>;
    getUnusedAddresses?: () => Promise<string[]>;
    getUtxos: () => Promise<string[] | undefined>;
    getBalance: () => Promise<string>;
    signTx: (tx: string, partialSign?: boolean) => Promise<string>;
    submitTx: (tx: string) => Promise<string>;
    cip95?: { getPubDRepKey: () => Promise<string> };
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
