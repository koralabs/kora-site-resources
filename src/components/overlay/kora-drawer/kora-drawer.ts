import { KoraElement } from "../../base/kora-element.js";
import { drawerInnerHTML } from "./template.js";
import type { KoraDrawerState } from "./template.js";

/**
 * <kora-drawer> — opt-in right-side slide-out panel. Toggle via the `open` attribute/property.
 * Closing (close button, backdrop click, Escape) clears `open` and fires `kora-drawer-close`.
 *
 *   <kora-drawer title="Wallet & Handles"> …slotted content… </kora-drawer>
 */
export class KoraDrawer extends KoraElement<KoraDrawerState> {
    static get observedAttributes(): string[] {
        return ["title", "open"];
    }

    #title: HTMLElement | null = null;

    protected override get preservesChildren(): boolean {
        return true;
    }

    protected override initialState(): KoraDrawerState {
        return { title: "", open: false };
    }

    protected override template(): string {
        return drawerInnerHTML(this.state);
    }

    /** Reflected convenience property. */
    get open(): boolean {
        return this.hasAttribute("open");
    }
    set open(value: boolean) {
        if (value) this.setAttribute("open", "");
        else this.removeAttribute("open");
    }

    override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        if (name === "title") this.state.title = value ?? "";
        else if (name === "open") this.state.open = value !== null;
    }

    protected override hydrate(): void {
        this.#title = this.querySelector(".kora-drawer__title");
        this.querySelector(".kora-drawer__close")?.addEventListener("click", this.#close);
        this.querySelector(".kora-drawer__backdrop")?.addEventListener("click", this.#close);
        document.addEventListener("keydown", this.#onKeydown);
    }

    protected override update(): void {
        if (this.#title) this.#title.textContent = this.state.title;
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        document.removeEventListener("keydown", this.#onKeydown);
    }

    #close = (): void => {
        if (!this.open) return;
        this.open = false;
        this.dispatchEvent(new CustomEvent("kora-drawer-close", { bubbles: true, composed: true }));
    };

    #onKeydown = (event: KeyboardEvent): void => {
        if (event.key === "Escape") this.#close();
    };
}

customElements.define("kora-drawer", KoraDrawer);

declare global {
    interface HTMLElementTagNameMap {
        "kora-drawer": KoraDrawer;
    }
}
