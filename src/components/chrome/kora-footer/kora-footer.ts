import { KoraElement } from "../../base/kora-element.js";
import { footerInnerHTML } from "./template.js";
import type { KoraFooterState } from "./template.js";
import { clearHandleSiteData } from "../../../site/clear-site-data.js";

/**
 * <kora-footer> — centered pipe-separated link row. Renders the shared default links by default
 * (How to Integrate / Terms of use / Verified integration / Clear site data) and APPENDS any
 * authored children after them; `default-links="false"` opts out. The built-in "Clear site data"
 * action is wired to clearHandleSiteData() behind a confirm.
 *
 *   <kora-footer><a href="/about">About</a></kora-footer>   <!-- defaults + your "About" -->
 */
export class KoraFooter extends KoraElement<KoraFooterState> {
    static get observedAttributes(): string[] {
        return ["default-links"];
    }

    protected override get preservesChildren(): boolean {
        return true;
    }

    protected override initialState(): KoraFooterState {
        return { defaultLinks: true };
    }

    protected override template(): string {
        return footerInnerHTML(this.state);
    }

    override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        if (name === "default-links") this.state.defaultLinks = value !== "false";
    }

    protected override hydrate(): void {
        this.querySelector('[data-kora-action="clear-site-data"]')?.addEventListener("click", this.#onClear);
    }

    #onClear = (): void => {
        const confirmed =
            typeof globalThis.confirm === "function"
                ? globalThis.confirm(
                      "Clear site data? This disconnects your wallet and removes saved data on this device.",
                  )
                : true;
        if (confirmed) void clearHandleSiteData();
    };
}

customElements.define("kora-footer", KoraFooter);

declare global {
    interface HTMLElementTagNameMap {
        "kora-footer": KoraFooter;
    }
}
