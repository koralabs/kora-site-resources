import { KoraElement } from "../../base/kora-element.js";
import "../kora-brand/index.js"; // ensure <kora-brand> is registered for the nested lockup
import { headerInnerHTML } from "./template.js";
import type { KoraHeaderState } from "./template.js";

/**
 * <kora-header> — top nav bar. Brand is configurable (`brand-label`, default "handle"); author nav
 * links as default children and right-side actions with `slot="actions"`:
 *
 * The shared global nav (Mint / H.A.L. / Merch) is rendered by default; author your own nav links
 * as default children to APPEND them, and right-side actions with `slot="actions"`. Set
 * `default-nav="false"` to omit the shared links.
 *
 *   <kora-header brand-label="secrets" brand-href="/">
 *     <a href="#/create">Create policy</a><a href="#/recover">Recover</a>
 *     <kora-wallet-button slot="actions"></kora-wallet-button>
 *   </kora-header>
 */
export class KoraHeader extends KoraElement<KoraHeaderState> {
    static get observedAttributes(): string[] {
        return ["brand-label", "brand-href", "default-nav"];
    }

    protected override get preservesChildren(): boolean {
        return true;
    }

    protected override initialState(): KoraHeaderState {
        return { brandLabel: "handle", brandHref: null, defaultNav: true };
    }

    protected override template(): string {
        return headerInnerHTML(this.state);
    }

    override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        if (name === "brand-label") this.state.brandLabel = value ?? "handle";
        else if (name === "brand-href") this.state.brandHref = value;
        else if (name === "default-nav") this.state.defaultNav = value !== "false";
    }

    protected override update(): void {
        const brand = this.querySelector("kora-brand");
        if (!brand) return;
        brand.setAttribute("label", this.state.brandLabel);
        if (this.state.brandHref) brand.setAttribute("href", this.state.brandHref);
        else brand.removeAttribute("href");
    }
}

customElements.define("kora-header", KoraHeader);

declare global {
    interface HTMLElementTagNameMap {
        "kora-header": KoraHeader;
    }
}
