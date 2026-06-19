import { KoraElement } from "../../base/kora-element.js";
import { tooltipInnerHTML } from "./template.js";
import type { KoraTooltipState } from "./template.js";

/** <kora-tooltip text="…" position="top"><button>?</button></kora-tooltip> — CSS-driven hover/focus. */
export class KoraTooltip extends KoraElement<KoraTooltipState> {
    static get observedAttributes(): string[] {
        return ["text", "position"];
    }

    #bubble: HTMLElement | null = null;

    protected override get preservesChildren(): boolean {
        return true; // the slotted trigger
    }

    protected override initialState(): KoraTooltipState {
        return { text: "", position: "top" };
    }

    protected override template(): string {
        return tooltipInnerHTML(this.state);
    }

    override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        if (name === "text") this.state.text = value ?? "";
        else if (name === "position") this.state.position = (value as KoraTooltipState["position"]) ?? "top";
    }

    protected override hydrate(): void {
        this.#bubble = this.querySelector(".kora-tooltip__bubble");
    }

    protected override update(): void {
        if (this.#bubble) this.#bubble.textContent = this.state.text;
    }
}

customElements.define("kora-tooltip", KoraTooltip);

declare global {
    interface HTMLElementTagNameMap {
        "kora-tooltip": KoraTooltip;
    }
}
