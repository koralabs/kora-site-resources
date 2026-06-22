import { KoraElement } from "../../base/kora-element.js";
import "../../media/kora-ipfs-image/index.js"; // register <kora-ipfs-image> for handle avatars
import { WALLET_PANEL_SHELL, handleRowHTML, profileAvatarHTML } from "./template.js";
import { walletStore } from "../../../wallet/index.js";
import type { WalletStore, WalletState, WalletHandleSummary } from "../../../wallet/index.js";
import { portalUrl, personalizeUrl, subhandlesUrl } from "../../../env/index.js";
import type { KoraNetwork } from "../../../env/index.js";

const short = (addr: string | null | undefined): string =>
    addr && addr.length > 16 ? `${addr.slice(0, 10)}…${addr.slice(-6)}` : (addr ?? "");

/**
 * <kora-wallet-panel> — the "Wallet & Handles" drawer body. It is SELF-POPULATING: it subscribes to
 * a WalletStore and reflects whatever that store resolved on connect — the handle list (with real
 * images via gateway failover), the active handle, and the friendly bech32 address. No app glue is
 * required; drop it into a <kora-drawer> and it fills itself. (The store auto-resolves handles on
 * connect; set `walletStore.autoResolve = false` to opt out, or feed a custom list via `.handles`.)
 *
 * It also opens its containing <kora-drawer> when the wallet pill dispatches `kora-wallet-open`, so
 * clicking the connected handle indicator opens the drawer with no wiring.
 *
 * Events (all bubble + composed):
 *   - `kora-handle-select` — fires on ANY change to the selected handle (drawer click OR auto/
 *     programmatic). detail: `{ name, previous, source: "user" | "programmatic" }`.
 *   - `kora-disconnect`, `kora-settings`.
 */
export class KoraWalletPanel extends KoraElement {
    static get observedAttributes(): string[] {
        return ["selected", "env"];
    }

    #refs: Record<string, HTMLElement> = {};
    #store: WalletStore = walletStore;
    #unsubscribe: (() => void) | null = null;
    #search = "";
    #lastSelected: string | null = null;
    #pendingUserSelect: string | null = null;

    set store(store: WalletStore) {
        this.#store = store;
        if (this.#unsubscribe) {
            this.#unsubscribe();
            this.#lastSelected = null;
            this.#unsubscribe = this.#store.subscribe(this.#onState);
        }
    }
    get store(): WalletStore {
        return this.#store;
    }

    /** Read-only view of the resolved handles. There is intentionally no setter — the store resolves
     *  the wallet's handles itself (per network); apps don't supply their own. */
    get handles(): WalletHandleSummary[] {
        return this.#store.state.handles;
    }

    /** Programmatically select a handle (app-driven). Emits like a pick (source: programmatic). */
    set selected(name: string | null) {
        this.#store.selectHandle(name);
    }
    get selected(): string | null {
        return this.#store.state.selectedHandle;
    }

    protected override template(): string {
        return WALLET_PANEL_SHELL;
    }

    override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        if (name === "selected") this.#store.selectHandle(value);
        else if (name === "env") this.#refreshProfile(this.#store.state);
    }

    protected override hydrate(): void {
        for (const el of this.querySelectorAll<HTMLElement>("[data-ref]")) {
            this.#refs[el.dataset.ref!] = el;
        }
        this.#refs.settings?.addEventListener("click", () => this.#emit("kora-settings"));
        this.#refs.disconnect?.addEventListener("click", this.#onDisconnect);
        this.#refs.list?.addEventListener("click", this.#onListClick);
        this.#refs.search?.addEventListener("input", this.#onSearch);
        document.addEventListener("kora-wallet-open", this.#onWalletOpen);
        // Baseline is null (not the current selection) so a panel that hydrates AFTER the wallet has
        // already connected + resolved still emits kora-handle-select for the active handle — the
        // hydration-vs-connect race no longer swallows the event.
        this.#lastSelected = null;
        this.#unsubscribe = this.#store.subscribe(this.#onState);
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.#unsubscribe?.();
        this.#unsubscribe = null;
        document.removeEventListener("kora-wallet-open", this.#onWalletOpen);
    }

    #env(): KoraNetwork | undefined {
        const env = this.getAttribute("env");
        return env === "preview" || env === "preprod" || env === "mainnet" ? env : undefined;
    }

    #onState = (state: WalletState): void => {
        this.#refreshProfile(state);
        this.#renderList(state);
        if (state.selectedHandle !== this.#lastSelected) {
            const source = this.#pendingUserSelect === state.selectedHandle ? "user" : "programmatic";
            this.#emit("kora-handle-select", { name: state.selectedHandle, previous: this.#lastSelected, source });
            this.#lastSelected = state.selectedHandle;
            this.#pendingUserSelect = null;
        }
    };

    #refreshProfile(state: WalletState): void {
        const handle = state.selectedHandle ?? "";
        const image = state.handles.find((h) => h.name === handle)?.image ?? null;
        if (this.#refs.handle) this.#refs.handle.textContent = handle;
        if (this.#refs.avatar) this.#refs.avatar.innerHTML = profileAvatarHTML(handle, image);
        if (this.#refs.addr) this.#refs.addr.textContent = short(state.address ?? state.changeAddressHex);

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

    #renderList(state: WalletState): void {
        const list = this.#refs.list;
        if (!list) return;
        const query = this.#search.trim().toLowerCase();
        const rows = state.handles
            .filter((h) => h.name !== state.selectedHandle)
            .filter((h) => !query || h.name.toLowerCase().includes(query));
        list.innerHTML = rows.length
            ? rows.map((h) => handleRowHTML(h, false)).join("")
            : `<p class="kora-wallet-panel__empty">${query ? "No matching handles." : "No other handles."}</p>`;
    }

    #onSearch = (event: Event): void => {
        this.#search = (event.target as HTMLInputElement).value;
        this.#renderList(this.#store.state);
    };

    #onListClick = (event: Event): void => {
        const row = (event.target as Element).closest<HTMLElement>(".kora-wallet-panel__row");
        const name = row?.dataset.name;
        if (name) {
            this.#pendingUserSelect = name; // tag the resulting state change as a user pick
            this.#store.selectHandle(name);
        }
    };

    #onDisconnect = (): void => {
        this.#store.disconnect();
        this.closest("kora-drawer")?.removeAttribute("open");
        this.#emit("kora-disconnect");
    };

    #onWalletOpen = (): void => {
        this.closest("kora-drawer")?.setAttribute("open", "");
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
