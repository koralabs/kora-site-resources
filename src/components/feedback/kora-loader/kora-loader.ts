import { KoraElement } from "../../base/kora-element.js";
import { loaderInnerHTML } from "./template.js";
import type { KoraLoaderState } from "./template.js";

/** <kora-loader size="48"> — dual-ring spinner. */
export class KoraLoader extends KoraElement<KoraLoaderState> {
    static get observedAttributes(): string[] {
        return ["size"];
    }

    protected override initialState(): KoraLoaderState {
        return { size: 48 };
    }

    protected override template(): string {
        return loaderInnerHTML(this.state);
    }

    override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        if (name === "size") this.state.size = Number(value) || 48;
    }

    protected override hydrate(): void {
        if (!this.hasAttribute("role")) this.setAttribute("role", "status");
        if (!this.hasAttribute("aria-label")) this.setAttribute("aria-label", "Loading");
    }

    protected override update(): void {
        this.style.setProperty("--kora-loader-size", `${this.state.size}px`);
    }
}

customElements.define("kora-loader", KoraLoader);

declare global {
    interface HTMLElementTagNameMap {
        "kora-loader": KoraLoader;
    }
}
