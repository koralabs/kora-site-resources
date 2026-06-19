import { KoraElement } from "../../base/kora-element.js";
import { tabsInnerHTML } from "./template.js";
import type { KoraTabsState, KoraTab } from "./template.js";

/** <kora-tabs active="a"> — segmented control. Set `.tabs`; selecting emits `kora-tab-change` {id}. */
export class KoraTabs extends KoraElement<KoraTabsState> {
    static get observedAttributes(): string[] {
        return ["active", "tabs"];
    }

    #list: HTMLElement | null = null;

    protected override initialState(): KoraTabsState {
        return { active: "", tabs: [] };
    }

    protected override template(): string {
        return tabsInnerHTML(this.state);
    }

    get active(): string {
        return this.state.active;
    }
    set active(id: string) {
        this.state.active = id;
    }
    get tabs(): KoraTab[] {
        return this.state.tabs;
    }
    set tabs(tabs: KoraTab[]) {
        this.state.tabs = tabs ?? [];
        if (!this.state.active) this.state.active = this.state.tabs[0]?.id ?? "";
        this.#renderTabs();
    }

    override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        if (name === "active") this.state.active = value ?? "";
        else if (name === "tabs" && value) {
            try {
                this.state.tabs = JSON.parse(value) as KoraTab[];
            } catch {
                /* ignore */
            }
        }
    }

    protected override hydrate(): void {
        this.#list = this.querySelector(".kora-tabs");
        this.#list?.addEventListener("click", this.#onClick);
        this.#list?.addEventListener("keydown", this.#onKeydown);
    }

    protected override update(): void {
        if (!this.#list) return;
        const active = this.state.active || this.state.tabs[0]?.id || "";
        for (const tab of this.#list.querySelectorAll<HTMLElement>(".kora-tabs__tab")) {
            const selected = tab.dataset.id === active;
            tab.setAttribute("aria-selected", String(selected));
            tab.tabIndex = selected ? 0 : -1;
        }
    }

    #renderTabs(): void {
        if (this.#list) this.#list.innerHTML = tabsInnerHTML(this.state).replace(/^<div[^>]*>|<\/div>$/g, "");
    }

    #select(id: string): void {
        if (!id || id === this.state.active) return;
        this.state.active = id;
        this.dispatchEvent(new CustomEvent("kora-tab-change", { detail: { id }, bubbles: true, composed: true }));
    }

    #onClick = (event: Event): void => {
        const tab = (event.target as Element).closest<HTMLElement>(".kora-tabs__tab");
        if (tab?.dataset.id) this.#select(tab.dataset.id);
    };

    #onKeydown = (event: KeyboardEvent): void => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const ids = this.state.tabs.map((t) => t.id);
        const i = ids.indexOf(this.state.active);
        const next = event.key === "ArrowRight" ? (i + 1) % ids.length : (i - 1 + ids.length) % ids.length;
        this.#select(ids[next]!);
        this.#list?.querySelector<HTMLElement>(`.kora-tabs__tab[data-id="${ids[next]}"]`)?.focus();
    };
}

customElements.define("kora-tabs", KoraTabs);

declare global {
    interface HTMLElementTagNameMap {
        "kora-tabs": KoraTabs;
    }
}
