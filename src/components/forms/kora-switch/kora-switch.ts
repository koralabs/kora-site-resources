import { KoraElement } from "../../base/kora-element.js";
import { switchInnerHTML } from "./template.js";
import type { KoraSwitchState } from "./template.js";

/** <kora-switch checked label="…">. Native checkbox+role=switch; `change` bubbles natively. */
export class KoraSwitch extends KoraElement<KoraSwitchState> {
    static get observedAttributes(): string[] {
        return ["checked", "disabled", "label", "name"];
    }

    #input: HTMLInputElement | null = null;
    #label: HTMLElement | null = null;

    protected override initialState(): KoraSwitchState {
        return { checked: false, disabled: false, label: "", name: null };
    }

    protected override template(): string {
        return switchInnerHTML(this.state);
    }

    get checked(): boolean {
        return this.#input ? this.#input.checked : this.state.checked;
    }
    set checked(value: boolean) {
        this.state.checked = value;
        if (this.#input) this.#input.checked = value;
    }

    override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        const s = this.state;
        if (name === "checked") s.checked = value !== null;
        else if (name === "disabled") s.disabled = value !== null;
        else if (name === "label") s.label = value ?? "";
        else if (name === "name") s.name = value;
    }

    protected override hydrate(): void {
        this.#input = this.querySelector(".kora-switch__input");
        this.#label = this.querySelector(".kora-switch__label");
    }

    protected override update(): void {
        if (!this.#input) return;
        this.#input.checked = this.state.checked;
        this.#input.disabled = this.state.disabled;
        if (this.#label) this.#label.textContent = this.state.label;
    }
}

customElements.define("kora-switch", KoraSwitch);

declare global {
    interface HTMLElementTagNameMap {
        "kora-switch": KoraSwitch;
    }
}
