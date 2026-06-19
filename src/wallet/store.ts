/**
 * WalletStore — a small framework-agnostic reactive wallet store. Same reactivity philosophy as
 * KoraElement (Proxy + microtask-batched notify), but it's a plain class any site subscribes to,
 * so connect/disconnect/network state is consistent everywhere. Holds RAW CIP-30 values (hex
 * addresses, CBOR balance); decoding stays app-side (or a future @cardano-sdk adapter).
 */
import {
    listAvailableWallets,
    enableWallet,
    type Cip30Api,
    type Cip30EnableOptions,
} from "./cip30.js";
import { rememberWallet, recallWallet, forgetWallet } from "./persistence.js";

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

export interface WalletState {
    status: WalletStatus;
    walletKey: string | null;
    walletName: string | null;
    walletIcon: string | null;
    networkId: number | null;
    changeAddressHex: string | null;
    rewardAddressHex: string | null;
    usedAddressHex: string | null;
    balanceCbor: string | null;
    error: string | null;
}

const INITIAL_STATE: WalletState = {
    status: "disconnected",
    walletKey: null,
    walletName: null,
    walletIcon: null,
    networkId: null,
    changeAddressHex: null,
    rewardAddressHex: null,
    usedAddressHex: null,
    balanceCbor: null,
    error: null,
};

/** Extensions requested on enable — CIP-95 (governance/DRep) + CIP-103 (multi-sign), matching handle.me. */
const DEFAULT_EXTENSIONS: Cip30EnableOptions = { extensions: [{ cip: 95 }, { cip: 103 }] };

export type WalletListener = (state: Readonly<WalletState>) => void;

export class WalletStore {
    #state: WalletState;
    #listeners = new Set<WalletListener>();
    #api: Cip30Api | null = null;
    #scheduled = false;

    constructor() {
        this.#state = new Proxy({ ...INITIAL_STATE }, {
            set: (target, key, value, receiver) => {
                const prev = Reflect.get(target, key, receiver);
                const ok = Reflect.set(target, key, value, receiver);
                if (ok && !Object.is(prev, value)) this.#schedule();
                return ok;
            },
        });
    }

    /** Current state (read-only snapshot reference). */
    get state(): Readonly<WalletState> {
        return this.#state;
    }

    /** The live CIP-30 API while connected, else null (for signing/submitting). */
    get api(): Cip30Api | null {
        return this.#api;
    }

    /** Subscribe to state changes; called immediately with current state. Returns an unsubscribe fn. */
    subscribe(listener: WalletListener): () => void {
        this.#listeners.add(listener);
        listener(this.#state);
        return () => this.#listeners.delete(listener);
    }

    /** Discover the wallets injected into window.cardano. */
    available(): ReturnType<typeof listAvailableWallets> {
        return listAvailableWallets();
    }

    /** Connect to a wallet by its window.cardano key and populate state from CIP-30 calls. */
    async connect(walletKey: string): Promise<void> {
        this.#assign({ ...INITIAL_STATE, status: "connecting", walletKey });
        const info = listAvailableWallets().find((w) => w.key === walletKey);
        this.#state.walletName = info?.name ?? walletKey;
        this.#state.walletIcon = info?.icon ?? null;

        try {
            const api = await enableWallet(walletKey, DEFAULT_EXTENSIONS);
            this.#api = api;
            const [networkId, changeAddressHex, rewardAddresses, usedAddresses, balanceCbor] =
                await Promise.all([
                    api.getNetworkId(),
                    api.getChangeAddress(),
                    api.getRewardAddresses(),
                    api.getUsedAddresses(),
                    api.getBalance(),
                ]);
            this.#state.networkId = networkId;
            this.#state.changeAddressHex = changeAddressHex;
            this.#state.rewardAddressHex = rewardAddresses[0] ?? null;
            this.#state.usedAddressHex = usedAddresses[0] ?? changeAddressHex;
            this.#state.balanceCbor = balanceCbor;
            this.#state.status = "connected";
            rememberWallet(walletKey); // so a returning visitor can reconnect silently
        } catch (error) {
            this.#api = null;
            this.#state.status = "error";
            this.#state.error = error instanceof Error ? error.message : String(error);
        }
    }

    disconnect(): void {
        this.#api = null;
        forgetWallet(); // an explicit disconnect should NOT silently reconnect next time
        this.#assign({ ...INITIAL_STATE });
    }

    /**
     * Silently reconnect to the previously-remembered wallet, if any. Only attempts a wallet the
     * user connected before (so it never pops an unsolicited prompt on a first visit). Waits briefly
     * for the wallet to inject. Returns true if it connected.
     */
    async autoConnect({ waitMs = 1000 }: { waitMs?: number } = {}): Promise<boolean> {
        const walletKey = recallWallet();
        if (!walletKey) return false;
        const start = Date.now();
        while (!this.available().some((w) => w.key === walletKey)) {
            if (Date.now() - start >= waitMs) return false;
            await sleep(100);
        }
        await this.connect(walletKey);
        return this.#state.status === "connected";
    }

    /** Sign a tx (CBOR hex) with the connected wallet. */
    async signTx(txCbor: string, partialSign = true): Promise<string> {
        return this.#requireApi().signTx(txCbor, partialSign);
    }

    /** Submit a signed tx (CBOR hex) through the connected wallet. */
    async submitTx(signedTxCbor: string): Promise<string> {
        return this.#requireApi().submitTx(signedTxCbor);
    }

    #requireApi(): Cip30Api {
        if (!this.#api) throw new Error("Wallet is not connected");
        return this.#api;
    }

    #assign(next: WalletState): void {
        Object.assign(this.#state, next);
    }

    #schedule(): void {
        if (this.#scheduled) return;
        this.#scheduled = true;
        queueMicrotask(() => {
            this.#scheduled = false;
            for (const listener of this.#listeners) listener(this.#state);
        });
    }
}

/** Shared singleton — most sites want one wallet connection app-wide. */
export const walletStore = new WalletStore();
