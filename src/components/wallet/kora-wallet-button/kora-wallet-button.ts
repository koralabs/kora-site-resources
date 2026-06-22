import { KoraElement } from "../../base/kora-element.js";
import "../kora-handle-indicator/index.js"; // ensure the nested indicator is registered
import { escapeAttr, escapeHtml } from "../../../utils/html.js";
import { walletButtonInnerHTML } from "./template.js";
import type { KoraWalletButtonState } from "./template.js";
import { walletStore } from "../../../wallet/index.js";
import type { WalletStore, WalletState } from "../../../wallet/index.js";

/**
 * <kora-wallet-button> — subscribes to a WalletStore and reflects connection state: disconnected
 * shows "Connect Wallet" (+ a picker when several wallets are installed), connecting shows a
 * pending label, connected swaps in <kora-handle-indicator>. Set `handle` to show a resolved
 * $handle; otherwise the connected wallet name is shown. Defaults to the shared `walletStore`
 * singleton; assign `.store` before connecting to use a different one.
 */
export class KoraWalletButton extends KoraElement<KoraWalletButtonState> {
    static get observedAttributes(): string[] {
        return ["handle"];
    }

    #connectBtn: HTMLButtonElement | null = null;
    #picker: HTMLElement | null = null;
    #indicator: HTMLElement | null = null;
    #store: WalletStore = walletStore;
    #unsubscribe: (() => void) | null = null;

    set store(store: WalletStore) {
        this.#store = store;
        if (this.#unsubscribe) {
            this.#unsubscribe();
            this.#unsubscribe = this.#store.subscribe(this.#sync);
        }
    }
    get store(): WalletStore {
        return this.#store;
    }

    protected override initialState(): KoraWalletButtonState {
        return { status: "disconnected", label: "", symbol: "" };
    }

    protected override template(): string {
        return walletButtonInnerHTML(this.state);
    }

    override attributeChangedCallback(name: string): void {
        if (name === "handle" && this.state.status === "connected") this.#applyConnectedLabel();
    }

    protected override hydrate(): void {
        this.#connectBtn = this.querySelector(".kora-wallet__connect");
        this.#picker = this.querySelector(".kora-wallet__picker");
        this.#indicator = this.querySelector(".kora-wallet__indicator");
        this.#connectBtn?.addEventListener("click", this.#onConnectClick);
        this.#picker?.addEventListener("click", this.#onPickerClick);
        // Clicking the connected handle pill asks the wallet drawer to open (a <kora-wallet-panel>
        // listens for this), so the pill→drawer link needs no app wiring.
        this.#indicator?.addEventListener("click", this.#onIndicatorClick);
        this.#unsubscribe = this.#store.subscribe(this.#sync);
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        this.#unsubscribe?.();
        this.#unsubscribe = null;
    }

    protected override update(): void {
        if (!this.#connectBtn || !this.#indicator || !this.#picker) return;
        const connected = this.state.status === "connected";
        this.#connectBtn.hidden = connected;
        this.#connectBtn.disabled = this.state.status === "connecting";
        this.#connectBtn.textContent = this.state.status === "connecting" ? "Connecting…" : "Connect Wallet";
        this.#indicator.hidden = !connected;
        if (connected) {
            this.#indicator.setAttribute("handle", this.state.label);
            this.#indicator.setAttribute("symbol", this.state.symbol);
        } else {
            this.#picker.hidden = true;
        }
    }

    #sync = (state: WalletState): void => {
        this.state.status = state.status;
        if (state.status === "connected") this.#applyConnectedLabel(state);
    };

    #applyConnectedLabel(state: WalletState = this.#store.state): void {
        // The `handle` attribute overrides; otherwise show the store's auto-selected handle, falling
        // back to the wallet name until handles resolve.
        const handle = this.getAttribute("handle") ?? state.selectedHandle;
        this.state.label = handle ?? state.walletName ?? "wallet";
        this.state.symbol = handle ? "$" : "";
    }

    #onIndicatorClick = (): void => {
        this.dispatchEvent(new CustomEvent("kora-wallet-open", { bubbles: true, composed: true }));
    };

    #onConnectClick = (): void => {
        if (!this.#picker) return;
        const wallets = this.#store.available();
        if (wallets.length === 0) {
            this.#picker.innerHTML = `<p class="kora-wallet__empty">No Cardano wallets found</p>`;
            this.#picker.hidden = false;
            return;
        }
        if (wallets.length === 1) {
            void this.#store.connect(wallets[0]!.key);
            return;
        }
        this.#picker.innerHTML = wallets
            .map(
                (w) =>
                    `<button class="kora-wallet__option" type="button" data-key="${escapeAttr(w.key)}">` +
                    (w.icon ? `<img class="kora-wallet__icon" src="${escapeAttr(w.icon)}" alt="">` : "") +
                    `<span>${escapeHtml(w.name)}</span></button>`,
            )
            .join("");
        this.#picker.hidden = false;
    };

    #onPickerClick = (event: Event): void => {
        const option = (event.target as Element).closest(".kora-wallet__option");
        if (!option || !this.#picker) return;
        this.#picker.hidden = true;
        const key = option.getAttribute("data-key");
        if (key) void this.#store.connect(key);
    };
}

customElements.define("kora-wallet-button", KoraWalletButton);

declare global {
    interface HTMLElementTagNameMap {
        "kora-wallet-button": KoraWalletButton;
    }
}
