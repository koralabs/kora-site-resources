import { getKoraIcon } from "./registry.js";
import { iconSVG } from "./render.js";

/**
 * <kora-icon name="wallet" size="20" label="…"> — renders a registered icon as inline SVG that
 * inherits text color (currentColor) and scales with `size` (px number or any CSS length; default
 * 1em). Decorative by default; pass `label` to announce it. Standalone custom element (no slots,
 * no reactive state) — re-renders when its attributes change.
 */
export class KoraIcon extends HTMLElement {
    static get observedAttributes(): string[] {
        return ["name", "size", "label"];
    }

    connectedCallback(): void {
        this.#render();
    }
    attributeChangedCallback(): void {
        if (this.isConnected) this.#render();
    }

    #render(): void {
        const size = this.getAttribute("size");
        if (size) this.style.setProperty("--kora-icon-size", /^\d+$/.test(size) ? `${size}px` : size);

        const label = this.getAttribute("label");
        if (label) {
            this.setAttribute("role", "img");
            this.setAttribute("aria-label", label);
            this.removeAttribute("aria-hidden");
        } else {
            this.setAttribute("aria-hidden", "true");
            this.removeAttribute("role");
            this.removeAttribute("aria-label");
        }

        const node = getKoraIcon(this.getAttribute("name") ?? "");
        const svg = node ? iconSVG(node) : "";
        if (this.innerHTML !== svg) this.innerHTML = svg; // skip rewrite if SSR markup already matches
    }
}

customElements.define("kora-icon", KoraIcon);

declare global {
    interface HTMLElementTagNameMap {
        "kora-icon": KoraIcon;
    }
}
