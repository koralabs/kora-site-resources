import { KoraElement } from "../../base/kora-element.js";
import { collapsibleInnerHTML } from "./template.js";
import type { KoraCollapsibleState } from "./template.js";

/** <kora-collapsible title="…" open> …slotted body… </kora-collapsible>. Emits `kora-toggle` {open}. */
export class KoraCollapsible extends KoraElement<KoraCollapsibleState> {
    static get observedAttributes(): string[] {
        return ["title", "open"];
    }

    #trigger: HTMLElement | null = null;
    #title: HTMLElement | null = null;

    protected override get preservesChildren(): boolean {
        return true;
    }

    protected override initialState(): KoraCollapsibleState {
        return { title: "", open: false };
    }

    protected override template(): string {
        return collapsibleInnerHTML(this.state);
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
        this.#trigger = this.querySelector(".kora-collapsible__trigger");
        this.#title = this.querySelector(".kora-collapsible__title");
        this.#trigger?.addEventListener("click", this.#toggle);
    }

    protected override update(): void {
        this.#trigger?.setAttribute("aria-expanded", String(this.state.open));
        if (this.#title) this.#title.textContent = this.state.title;
    }

    #toggle = (): void => {
        this.open = !this.open;
        this.dispatchEvent(
            new CustomEvent("kora-toggle", { detail: { open: this.open }, bubbles: true, composed: true }),
        );
    };
}

customElements.define("kora-collapsible", KoraCollapsible);

declare global {
    interface HTMLElementTagNameMap {
        "kora-collapsible": KoraCollapsible;
    }
}
