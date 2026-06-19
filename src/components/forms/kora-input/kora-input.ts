import { KoraElement } from "../../base/kora-element.js";
import { inputInnerHTML } from "./template.js";
import type { KoraInputState } from "./template.js";

/** <kora-input label="…" placeholder="…" name="…">. Wraps a native input; value via `.value`. */
export class KoraInput extends KoraElement<KoraInputState> {
    static get observedAttributes(): string[] {
        return ["type", "value", "placeholder", "label", "error", "name", "disabled"];
    }

    #field: HTMLInputElement | null = null;
    #label: HTMLElement | null = null;
    #error: HTMLElement | null = null;
    #root: HTMLElement | null = null;

    protected override initialState(): KoraInputState {
        return { type: "text", value: "", placeholder: "", label: "", error: "", name: null, disabled: false };
    }

    protected override template(): string {
        return inputInnerHTML(this.state);
    }

    get value(): string {
        return this.#field ? this.#field.value : this.state.value;
    }
    set value(v: string) {
        this.state.value = v;
        if (this.#field) this.#field.value = v;
    }

    override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        const s = this.state;
        if (name === "disabled") s.disabled = value !== null;
        else if (name === "type") s.type = value ?? "text";
        else if (name === "value") s.value = value ?? "";
        else if (name === "placeholder") s.placeholder = value ?? "";
        else if (name === "label") s.label = value ?? "";
        else if (name === "error") s.error = value ?? "";
        else if (name === "name") s.name = value;
    }

    protected override hydrate(): void {
        this.#root = this.querySelector(".kora-input");
        this.#field = this.querySelector(".kora-input__field");
        this.#label = this.querySelector(".kora-input__label");
        this.#error = this.querySelector(".kora-input__error");
    }

    protected override update(): void {
        if (!this.#field) return;
        this.#field.type = this.state.type;
        this.#field.placeholder = this.state.placeholder;
        this.#field.disabled = this.state.disabled;
        if (this.#field.value !== this.state.value) this.#field.value = this.state.value;
        if (this.#label) this.#label.textContent = this.state.label;
        if (this.#error) this.#error.textContent = this.state.error;
        this.#root?.classList.toggle("kora-input--error", Boolean(this.state.error));
        this.#field.setAttribute("aria-invalid", this.state.error ? "true" : "false");
    }
}

customElements.define("kora-input", KoraInput);

declare global {
    interface HTMLElementTagNameMap {
        "kora-input": KoraInput;
    }
}
