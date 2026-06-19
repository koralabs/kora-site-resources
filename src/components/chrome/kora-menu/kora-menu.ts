import { KoraElement } from "../../base/kora-element.js";
import { menuInnerHTML, menuLinksHTML } from "./template.js";
import type { KoraMenuState } from "./template.js";
import { koraResourceLinks } from "../../../env/links.js";

/**
 * <kora-menu> — the header "Resources" hamburger. Renders the shared default links (so every site
 * gets them) and projects any slotted <a> children as site-specific additions. Opens on click,
 * closes on outside-click / Escape.
 */
export class KoraMenu extends KoraElement<KoraMenuState> {
    static get observedAttributes(): string[] {
        return ["label"];
    }

    #trigger: HTMLElement | null = null;
    #panel: HTMLElement | null = null;

    protected override get preservesChildren(): boolean {
        return true; // slotted <a> children → appended after the defaults
    }

    protected override initialState(): KoraMenuState {
        return { open: false, label: "Resources" };
    }

    protected override template(): string {
        // Client-side fresh render: defaults are env-derived from the current host.
        return menuInnerHTML(this.state, menuLinksHTML(koraResourceLinks()));
    }

    override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        if (name === "label") this.state.label = value ?? "Resources";
    }

    protected override hydrate(): void {
        this.#trigger = this.querySelector(".kora-menu__trigger");
        this.#panel = this.querySelector(".kora-menu__panel");
        this.#trigger?.addEventListener("click", this.#toggle);
        document.addEventListener("click", this.#onDocumentClick);
        document.addEventListener("keydown", this.#onKeydown);
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        document.removeEventListener("click", this.#onDocumentClick);
        document.removeEventListener("keydown", this.#onKeydown);
    }

    protected override update(): void {
        if (!this.#trigger || !this.#panel) return;
        this.#panel.hidden = !this.state.open;
        this.#trigger.setAttribute("aria-expanded", String(this.state.open));
    }

    #toggle = (event: Event): void => {
        event.stopPropagation();
        this.state.open = !this.state.open;
    };

    #onDocumentClick = (event: Event): void => {
        if (this.state.open && !this.contains(event.target as Node)) this.state.open = false;
    };

    #onKeydown = (event: KeyboardEvent): void => {
        if (event.key === "Escape" && this.state.open) this.state.open = false;
    };
}

customElements.define("kora-menu", KoraMenu);

declare global {
    interface HTMLElementTagNameMap {
        "kora-menu": KoraMenu;
    }
}
