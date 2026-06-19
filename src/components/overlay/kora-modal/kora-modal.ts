import { KoraElement } from "../../base/kora-element.js";
import { modalInnerHTML } from "./template.js";
import type { KoraModalState } from "./template.js";

/**
 * <kora-modal title="…"> …slotted content… </kora-modal>. Toggle via the `open` attribute/property;
 * closes on backdrop click, the close button, or Escape, firing `kora-modal-close`.
 */
export class KoraModal extends KoraElement<KoraModalState> {
    static get observedAttributes(): string[] {
        return ["title", "open"];
    }

    #title: HTMLElement | null = null;

    protected override get preservesChildren(): boolean {
        return true;
    }

    protected override initialState(): KoraModalState {
        return { title: "", open: false };
    }

    protected override template(): string {
        return modalInnerHTML(this.state);
    }

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
        this.#title = this.querySelector(".kora-modal__title");
        this.querySelector(".kora-modal__close")?.addEventListener("click", this.#close);
        this.querySelector(".kora-modal__backdrop")?.addEventListener("click", this.#close);
        document.addEventListener("keydown", this.#onKeydown);
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        document.removeEventListener("keydown", this.#onKeydown);
    }

    protected override update(): void {
        if (this.#title) this.#title.textContent = this.state.title;
    }

    #close = (): void => {
        if (!this.open) return;
        this.open = false;
        this.dispatchEvent(new CustomEvent("kora-modal-close", { bubbles: true, composed: true }));
    };

    #onKeydown = (event: KeyboardEvent): void => {
        if (event.key === "Escape") this.#close();
    };
}

customElements.define("kora-modal", KoraModal);

declare global {
    interface HTMLElementTagNameMap {
        "kora-modal": KoraModal;
    }
}
