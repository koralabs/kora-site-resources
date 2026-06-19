import { KoraElement } from "../../base/kora-element.js";
import { buttonInnerHTML } from "./template.js";
import type { KoraButtonState, KoraButtonVariant } from "./template.js";

/**
 * <kora-button> — first concrete component, also the proof of the KoraElement architecture.
 * Light DOM, attribute-driven state, Proxy reactivity, targeted ref updates, SSR adoption.
 */
export class KoraButton extends KoraElement<KoraButtonState> {
    static get observedAttributes(): string[] {
        return ["variant", "label", "disabled", "loading"];
    }

    #btn: HTMLButtonElement | null = null;
    #label: HTMLElement | null = null;
    #spinner: HTMLElement | null = null;

    protected override initialState(): KoraButtonState {
        return { variant: "primary", label: "", disabled: false, loading: false };
    }

    protected override template(): string {
        return buttonInnerHTML(this.state);
    }

    // Typed attribute→state parsing (booleans reflect presence). Overrides the base raw-string bridge.
    override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        const state = this.state;
        switch (name) {
            case "variant":
                state.variant = (value as KoraButtonVariant) ?? "primary";
                break;
            case "label":
                state.label = value ?? "";
                break;
            case "disabled":
                state.disabled = value !== null;
                break;
            case "loading":
                state.loading = value !== null;
                break;
        }
    }

    protected override hydrate(): void {
        this.#btn = this.querySelector(".kora-btn");
        this.#label = this.querySelector(".kora-btn__label");
        this.#spinner = this.querySelector(".kora-btn__spinner");
    }

    // Mutates existing nodes only — never replaces them — so SSR-adopted DOM survives untouched.
    protected override update(): void {
        if (!this.#btn || !this.#label || !this.#spinner) return;
        const state = this.state;
        this.#btn.className = `kora-btn kora-btn--${state.variant}`;
        this.#btn.disabled = state.disabled || state.loading;
        this.#label.textContent = state.label;
        this.#spinner.hidden = !state.loading;
    }
}

customElements.define("kora-button", KoraButton);

declare global {
    interface HTMLElementTagNameMap {
        "kora-button": KoraButton;
    }
}
