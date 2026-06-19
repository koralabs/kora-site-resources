import { KoraElement } from "../../base/kora-element.js";
import { brandInnerHTML } from "./template.js";
import type { KoraBrandState } from "./template.js";

/** <kora-brand> — configurable logo lockup. `$handle` by default; set `label` to rebrand. */
export class KoraBrand extends KoraElement<KoraBrandState> {
    static get observedAttributes(): string[] {
        return ["label", "href"];
    }

    #anchor: HTMLAnchorElement | null = null;
    #label: HTMLElement | null = null;

    protected override initialState(): KoraBrandState {
        return { label: "handle", href: null };
    }

    protected override template(): string {
        return brandInnerHTML(this.state);
    }

    override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        if (name === "label") this.state.label = value ?? "handle";
        else if (name === "href") this.state.href = value;
    }

    protected override hydrate(): void {
        this.#anchor = this.querySelector(".kora-brand");
        this.#label = this.querySelector(".kora-brand__label");
    }

    protected override update(): void {
        if (!this.#anchor || !this.#label) return;
        this.#label.textContent = this.state.label;
        if (this.state.href) this.#anchor.setAttribute("href", this.state.href);
        else this.#anchor.removeAttribute("href");
    }
}

customElements.define("kora-brand", KoraBrand);

declare global {
    interface HTMLElementTagNameMap {
        "kora-brand": KoraBrand;
    }
}
