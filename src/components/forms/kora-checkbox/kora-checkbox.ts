import { KoraElement } from "../../base/kora-element.js";
import { checkboxInnerHTML } from "./template.js";
import type { KoraCheckboxState } from "./template.js";

/** <kora-checkbox checked label="…" name="…">. Wraps a native checkbox; `change` bubbles natively. */
export class KoraCheckbox extends KoraElement<KoraCheckboxState> {
    static get observedAttributes(): string[] {
        return ["checked", "disabled", "label", "name", "value"];
    }

    #input: HTMLInputElement | null = null;
    #label: HTMLElement | null = null;

    protected override initialState(): KoraCheckboxState {
        return { checked: false, disabled: false, label: "", name: null, value: null };
    }

    protected override template(): string {
        return checkboxInnerHTML(this.state);
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
        else if (name === "value") s.value = value;
    }

    protected override hydrate(): void {
        this.#input = this.querySelector(".kora-checkbox__input");
        this.#label = this.querySelector(".kora-checkbox__label");
    }

    protected override update(): void {
        if (!this.#input) return;
        this.#input.checked = this.state.checked;
        this.#input.disabled = this.state.disabled;
        if (this.#label) this.#label.textContent = this.state.label;
    }
}

customElements.define("kora-checkbox", KoraCheckbox);

declare global {
    interface HTMLElementTagNameMap {
        "kora-checkbox": KoraCheckbox;
    }
}
