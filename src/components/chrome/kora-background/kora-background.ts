import { KoraElement } from "../../base/kora-element.js";
import { backgroundInnerHTML } from "./template.js";
import type { KoraBackgroundState } from "./template.js";

/**
 * <kora-background> — fixed, full-viewport layered backdrop (dark base + gradient veil + accent
 * blobs, optional grid). Self-contained; place site-specific 3D/canvas content in your own layer.
 */
export class KoraBackground extends KoraElement<KoraBackgroundState> {
    static get observedAttributes(): string[] {
        return ["grid"];
    }

    protected override initialState(): KoraBackgroundState {
        return { grid: false };
    }

    protected override template(): string {
        return backgroundInnerHTML(this.state);
    }

    override attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        if (name === "grid") this.state.grid = value !== null;
    }
}

customElements.define("kora-background", KoraBackground);

declare global {
    interface HTMLElementTagNameMap {
        "kora-background": KoraBackground;
    }
}
