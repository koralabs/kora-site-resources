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
    type Cip30DataSignature,
    type Cip30EnableOptions,
} from "./cip30.js";
import { rememberWallet, recallWallet, forgetWallet, rememberHandle, recallHandle } from "./persistence.js";
import { fetchWalletHandles } from "./handle-api.js";
import { HANDLE_POLICY_DEMI } from "./policies.js";
import { addressBech32 } from "./bech32.js";

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

/** A handle held by the connected wallet, normalized for display. `image` is the raw reference
 *  (`ipfs://…` or https) — render it through `<kora-ipfs-image>` for gateway failover. */
export interface WalletHandleSummary {
    name: string;
    virtual: boolean;
    isDeMi: boolean;
    image: string | null;
}

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
    /** Friendly bech32 of the change address (addr1…/addr_test…), derived from the hex. */
    address: string | null;
    /** Handles held by this wallet (resolved from the Handle API on connect). */
    handles: WalletHandleSummary[];
    /** The active handle (auto-selected on connect, changeable via selectHandle). */
    selectedHandle: string | null;
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
    address: null,
    handles: [],
    selectedHandle: null,
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
    #autoResolve = true;

    /** Whether connect() automatically resolves the wallet's handles (default true). Set false for a
     *  connection-only flow that doesn't need the handle list. */
    get autoResolve(): boolean {
        return this.#autoResolve;
    }
    set autoResolve(value: boolean) {
        this.#autoResolve = value;
    }

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
            this.#state.address = addressBech32(changeAddressHex);
            this.#state.status = "connected";
            rememberWallet(walletKey); // so a returning visitor can reconnect silently
            if (this.#autoResolve) await this.#resolveHandles();
        } catch (error) {
            this.#api = null;
            this.#state.status = "error";
            this.#state.error = error instanceof Error ? error.message : String(error);
        }
    }

    disconnect(): void {
        this.#api = null;
        forgetWallet(); // an explicit disconnect should NOT silently reconnect next time
        this.#assign({ ...INITIAL_STATE, handles: [] });
    }

    /**
     * Resolve the wallet's handles from the Ada Handle API (regular + NFT + virtual SubHandles) and
     * auto-select a default. Called automatically by connect() when autoResolve is on; safe to call
     * directly otherwise. Failures (offline / API down) leave the list empty — the connection itself
     * still succeeded.
     */
    async resolveHandles(): Promise<void> {
        return this.#resolveHandles();
    }

    async #resolveHandles(): Promise<void> {
        const reward = this.#state.rewardAddressHex;
        if (!reward) return;
        try {
            const api = await fetchWalletHandles(reward);
            if (this.#state.rewardAddressHex !== reward) return; // changed/disconnected mid-flight
            const handles: WalletHandleSummary[] = api.map((handle) => ({
                name: handle.name,
                virtual: handle.handle_type === "virtual_subhandle",
                isDeMi: handle.policy === HANDLE_POLICY_DEMI,
                image: handle.image ?? null,
            }));
            this.#state.handles = handles;
            this.#state.selectedHandle = this.#pickDefault(handles);
        } catch {
            // offline / API down — leave handles empty; the wallet is still connected.
        }
    }

    /** Default handle: the last-remembered one if still held, else the first non-virtual handle. */
    #pickDefault(handles: WalletHandleSummary[]): string | null {
        const recalled = recallHandle();
        if (recalled && handles.some((h) => h.name === recalled)) return recalled;
        const regular = handles.find((h) => !h.virtual && !h.name.includes("@"));
        return regular?.name ?? handles[0]?.name ?? null;
    }

    /** Choose the active handle; remembers it so a return visit lands on the same one. No-op if
     *  unchanged. */
    selectHandle(name: string | null): void {
        if (name === this.#state.selectedHandle) return;
        this.#state.selectedHandle = name;
        if (name) rememberHandle(name); // remember explicit selections only
    }

    /** Override the handle list (e.g. a custom/offline source) and re-pick the default selection. */
    setHandles(handles: WalletHandleSummary[]): void {
        this.#state.handles = handles ?? [];
        this.#state.selectedHandle = this.#pickDefault(this.#state.handles);
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

    /** CIP-8 data signing — sign an arbitrary payload (hex) with the key for `address` (hex). For
     *  anything beyond this, reach for the full CIP-30 API directly via `store.api`. */
    async signData(address: string, payloadHex: string): Promise<Cip30DataSignature> {
        return this.#requireApi().signData(address, payloadHex);
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
