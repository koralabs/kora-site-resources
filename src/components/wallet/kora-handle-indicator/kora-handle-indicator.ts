import { KoraElement } from "../../base/kora-element.js";
import { handleIndicatorInnerHTML } from "./template.js";
import type { KoraHandleIndicatorState } from "./template.js";

/** <kora-handle-indicator> — the connected-state "chosen handle" pill. Emits native `click`. */
export class KoraHandleIndicator extends KoraElement<KoraHandleIndicatorState> {
    static get observedAttributes(): string[] {
        return ["handle", "symbol"];
    }

    #handle: HTMLElement | null = null;
    #symbol: HTMLElement | null = null;

    protected override initialState(): KoraHandleIndicatorState {
        return { handle: "", symbol: "$" };
    }

    protected override template(): string {
        return handleIndicatorInnerHTML(this.state);
    }

    override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        if (name === "handle") this.state.handle = value ?? "";
        else if (name === "symbol") this.state.symbol = value ?? "$";
    }

    protected override hydrate(): void {
        this.#handle = this.querySelector(".kora-handle-indicator__handle");
        this.#symbol = this.querySelector(".kora-handle-indicator__symbol");
    }

    protected override update(): void {
        if (!this.#handle || !this.#symbol) return;
        this.#handle.textContent = this.state.handle;
        this.#symbol.textContent = this.state.symbol;
    }
}

customElements.define("kora-handle-indicator", KoraHandleIndicator);

declare global {
    interface HTMLElementTagNameMap {
        "kora-handle-indicator": KoraHandleIndicator;
    }
}
