import { KoraElement } from "../../base/kora-element.js";
import { selectInnerHTML, optionsHTML } from "./template.js";
import type { KoraSelectState, KoraSelectOption } from "./template.js";

/**
 * <kora-select> — custom dropdown. Set options via the `.options` property (or a JSON `options`
 * attribute). Emits `change` with `{ value }`. Opens on click; closes on outside-click/Escape;
 * Arrow/Enter keyboard selection.
 */
export class KoraSelect extends KoraElement<KoraSelectState> {
    static get observedAttributes(): string[] {
        return ["value", "placeholder", "name", "disabled", "options"];
    }

    #trigger: HTMLElement | null = null;
    #list: HTMLElement | null = null;
    #valueEl: HTMLElement | null = null;
    #hidden: HTMLInputElement | null = null;

    protected override initialState(): KoraSelectState {
        return { value: "", placeholder: "", name: null, disabled: false, open: false, options: [] };
    }

    protected override template(): string {
        return selectInnerHTML(this.state);
    }

    get value(): string {
        return this.state.value;
    }
    set value(v: string) {
        this.state.value = v;
    }
    get options(): KoraSelectOption[] {
        return this.state.options;
    }
    set options(opts: KoraSelectOption[]) {
        this.state.options = opts ?? [];
        this.#renderOptions();
    }

    override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        const s = this.state;
        if (name === "value") s.value = value ?? "";
        else if (name === "placeholder") s.placeholder = value ?? "";
        else if (name === "name") s.name = value;
        else if (name === "disabled") s.disabled = value !== null;
        else if (name === "options" && value) {
            try {
                s.options = JSON.parse(value) as KoraSelectOption[];
            } catch {
                /* ignore malformed */
            }
        }
    }

    protected override hydrate(): void {
        this.#trigger = this.querySelector(".kora-select__trigger");
        this.#list = this.querySelector(".kora-select__list");
        this.#valueEl = this.querySelector(".kora-select__value");
        this.#hidden = this.querySelector(".kora-select__input");
        this.#trigger?.addEventListener("click", this.#toggle);
        this.#list?.addEventListener("click", this.#onListClick);
        this.addEventListener("keydown", this.#onKeydown);
        document.addEventListener("click", this.#onDocClick);
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        document.removeEventListener("click", this.#onDocClick);
    }

    protected override update(): void {
        if (!this.#trigger || !this.#list || !this.#valueEl) return;
        this.#trigger.setAttribute("aria-expanded", String(this.state.open));
        this.#list.hidden = !this.state.open;
        const selected = this.state.options.find((o) => o.value === this.state.value);
        this.#valueEl.textContent = selected ? selected.label : this.state.placeholder || "Select…";
        this.#valueEl.classList.toggle("kora-select__value--placeholder", !selected);
        if (this.#hidden) this.#hidden.value = this.state.value;
        for (const li of this.#list.querySelectorAll<HTMLElement>(".kora-select__option")) {
            li.setAttribute("aria-selected", String(li.dataset.value === this.state.value));
        }
    }

    #renderOptions(): void {
        if (this.#list) this.#list.innerHTML = optionsHTML(this.state);
    }

    #select(value: string): void {
        if (value === this.state.value) {
            this.state.open = false;
            return;
        }
        this.state.value = value;
        this.state.open = false;
        this.dispatchEvent(new CustomEvent("change", { detail: { value }, bubbles: true, composed: true }));
    }

    #toggle = (): void => {
        if (!this.state.disabled) this.state.open = !this.state.open;
    };

    #onListClick = (event: Event): void => {
        const option = (event.target as Element).closest<HTMLElement>(".kora-select__option");
        if (option?.dataset.value != null) this.#select(option.dataset.value);
    };

    #onDocClick = (event: Event): void => {
        if (this.state.open && !this.contains(event.target as Node)) this.state.open = false;
    };

    #onKeydown = (event: KeyboardEvent): void => {
        const opts = this.state.options;
        if (!opts.length) return;
        const index = opts.findIndex((o) => o.value === this.state.value);
        if (event.key === "Escape") {
            this.state.open = false;
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!this.state.open) this.state.open = true;
            else this.#select(opts[Math.min(index + 1, opts.length - 1)]!.value);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            this.#select(opts[Math.max(index - 1, 0)]!.value);
        } else if ((event.key === "Enter" || event.key === " ") && !this.state.open) {
            event.preventDefault();
            this.state.open = true;
        }
    };
}

customElements.define("kora-select", KoraSelect);

declare global {
    interface HTMLElementTagNameMap {
        "kora-select": KoraSelect;
    }
}
