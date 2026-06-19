/**
 * Pure (DOM-free) icon rendering — shared by the <kora-icon> element and SSR. Builds a standard
 * 24×24 stroke SVG (currentColor) from registered icon data.
 */
import { escapeAttr } from "../utils/html.js";
import { getKoraIcon } from "./registry.js";
import type { IconNode } from "./registry.js";

const SVG_ATTRS =
    'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/** Render icon data → an `<svg>` string. */
export function iconSVG(node: IconNode): string {
    const children = node
        .map((child) => {
            const tag = String(child[0]);
            const attrs = (child[1] ?? {}) as Record<string, string | number>;
            const attrStr = Object.entries(attrs)
                .map(([k, v]) => `${k}="${escapeAttr(String(v))}"`)
                .join(" ");
            return `<${tag} ${attrStr}/>`;
        })
        .join("");
    return `<svg ${SVG_ATTRS}>${children}</svg>`;
}

function sizeStyle(size: string | number | undefined): string {
    if (size == null) return "";
    const value = typeof size === "number" || /^\d+$/.test(String(size)) ? `${size}px` : String(size);
    return ` style="--kora-icon-size:${escapeAttr(value)}"`;
}

/**
 * SSR render of `<kora-icon>` with the svg inline so it shows before hydration. `label` makes it an
 * announced image; otherwise it's decorative (aria-hidden). Unknown names render an empty icon.
 */
export function renderKoraIcon(
    name: string,
    opts: { size?: string | number; label?: string } = {},
): string {
    const node = getKoraIcon(name);
    const a11y = opts.label ? ` role="img" aria-label="${escapeAttr(opts.label)}"` : ' aria-hidden="true"';
    return `<kora-icon name="${escapeAttr(name)}"${sizeStyle(opts.size)}${a11y}>${node ? iconSVG(node) : ""}</kora-icon>`;
}
