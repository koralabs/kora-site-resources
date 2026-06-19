import { KoraElement } from "../../base/kora-element.js";
import { FOOTER_SHELL } from "./template.js";

/** <kora-footer> — centered pipe-separated link row. Author links as children:
 *  `<kora-footer><a href="…">Terms</a><a href="…">Docs</a></kora-footer>`. */
export class KoraFooter extends KoraElement {
    protected override get preservesChildren(): boolean {
        return true;
    }

    protected override template(): string {
        return FOOTER_SHELL;
    }
}

customElements.define("kora-footer", KoraFooter);

declare global {
    interface HTMLElementTagNameMap {
        "kora-footer": KoraFooter;
    }
}
