import { KoraElement } from "../../base/kora-element.js";
import { WALLET_PANEL_SHELL, handleRowHTML } from "./template.js";
import type { KoraHandleItem } from "./template.js";
import { walletStore } from "../../../wallet/index.js";
import type { WalletStore, WalletState } from "../../../wallet/index.js";
import { portalUrl, personalizeUrl, subhandlesUrl } from "../../../env/index.js";
import type { KoraNetwork } from "../../../env/index.js";

const short = (addr: string | null | undefined): string =>
    addr && addr.length > 16 ? `${addr.slice(0, 10)}…${addr.slice(-6)}` : (addr ?? "");

/**
 * <kora-wallet-panel> — the "Wallet & Handles" drawer body. Subscribes to a WalletStore for the
 * connected address; the app supplies the resolved handles (via `.handles`) and the active handle
 * (`.selected` / attribute). Emits `kora-handle-select`, `kora-disconnect`, `kora-settings`.
 */
export class KoraWalletPanel extends KoraElement {
    static get observedAttributes(): string[] {
        return ["selected", "env"];
    }

    #refs: Record<string, HTMLElement> = {};
    #store: WalletStore = walletStore;
    #unsubscribe: (() => void) | null = null;
    #handles: KoraHandleItem[] = [];
    #selected: string | null = null;
    #search = "";
    #address: string | null = null;

    set store(store: WalletStore) {
        this.#store = store;
        if (this.#unsubscribe) {
            this.#unsubscribe();
            this.#unsubscribe = this.#store.subscribe(this.#onState);
        }
    }

    set handles(handles: KoraHandleItem[]) {
        this.#handles = handles ?? [];
        this.#renderList();
    }
    get handles(): KoraHandleItem[] {
        return this.#handles;
    }

    set selected(name: string | null) {
        this.#selected = name;
        this.#refreshProfile();
        this.#renderList();
    }
    get selected(): string | null {
        return this.#selected;
    }

    protected override template(): string {
        return WALLET_PANEL_SHELL;
    }

    override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        if (name === "selected") this.selected = value;
        else if (name === "env") this.#refreshProfile();
    }

    protected override hydrate(): void {
        for (const el of this.querySelectorAll<HTMLElement>("[data-ref]")) {
            this.#refs[el.dataset.ref!] = el;
        }
        this.#refs.settings?.addEventListener("click", () => this.#emit("kora-settings"));
        this.#refs.disconnect?.addEventListener("click", this.#onDisconnect);
        this.#refs.list?.addEventListener("click", this.#onListClick);
        this.#refs.search?.addEventListener("input", this.#onSearch);
        this.#unsubscribe = this.#store.subscribe(this.#onState);
        this.#renderList();
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.#unsubscribe?.();
        this.#unsubscribe = null;
    }

    #env(): KoraNetwork | undefined {
        const env = this.getAttribute("env");
        return env === "preview" || env === "preprod" || env === "mainnet" ? env : undefined;
    }

    #onState = (state: WalletState): void => {
        this.#address = state.usedAddressHex ?? state.changeAddressHex ?? null;
        this.#refreshProfile();
    };

    #refreshProfile(): void {
        const handle = this.#selected ?? "";
        if (this.#refs.handle) this.#refs.handle.textContent = handle;
        if (this.#refs.avatar) this.#refs.avatar.textContent = (handle[0] ?? "$").toUpperCase();
        if (this.#refs.addr) this.#refs.addr.textContent = short(this.#address);

        const env = this.#env();
        if (handle) {
            this.#refs.portal?.setAttribute("href", portalUrl(handle, { env }));
            this.#refs.personalize?.setAttribute("href", personalizeUrl(handle, { env }));
            this.#refs.subhandles?.setAttribute("href", subhandlesUrl(handle, { env }));
        }
        const hasHandle = Boolean(handle);
        this.#refs.portal?.toggleAttribute("hidden", !hasHandle);
        this.#refs.personalize?.parentElement?.toggleAttribute("hidden", !hasHandle);
    }

    #renderList(): void {
        const list = this.#refs.list;
        if (!list) return;
        const query = this.#search.trim().toLowerCase();
        const rows = this.#handles
            .filter((h) => h.name !== this.#selected)
            .filter((h) => !query || h.name.toLowerCase().includes(query));
        list.innerHTML = rows.length
            ? rows.map((h) => handleRowHTML(h, false)).join("")
            : `<p class="kora-wallet-panel__empty">${query ? "No matching handles." : "No other handles."}</p>`;
    }

    #onSearch = (event: Event): void => {
        this.#search = (event.target as HTMLInputElement).value;
        this.#renderList();
    };

    #onListClick = (event: Event): void => {
        const row = (event.target as Element).closest<HTMLElement>(".kora-wallet-panel__row");
        const name = row?.dataset.name;
        if (!name) return;
        this.selected = name;
        this.#emit("kora-handle-select", { name });
    };

    #onDisconnect = (): void => {
        this.#store.disconnect();
        this.#emit("kora-disconnect");
    };

    #emit(type: string, detail?: unknown): void {
        this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
    }
}

customElements.define("kora-wallet-panel", KoraWalletPanel);

declare global {
    interface HTMLElementTagNameMap {
        "kora-wallet-panel": KoraWalletPanel;
    }
}
