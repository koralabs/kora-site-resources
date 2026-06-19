/**
 * Pure markup for <kora-footer> — the centered, pipe-separated link row from handle.me.
 * Links are slotted children (anchors/buttons); dividers are drawn by CSS. The SSR renderer is a
 * convenience that builds those children from a links array; client-side you can also author them.
 */
import { escapeHtml, escapeAttr } from "../../../utils/html.js";

export interface KoraFooterLink {
    label: string;
    /** Omit for a button-style action (apps wire up `click`). */
    href?: string;
    external?: boolean;
}

export interface KoraFooterProps {
    links: KoraFooterLink[];
}

/** Empty shell used for a fresh client render; authored children are projected into it. */
export const FOOTER_SHELL = `<div class="kora-footer" data-kora-content></div>`;

function linkHTML(link: KoraFooterLink): string {
    const label = escapeHtml(link.label);
    if (!link.href) {
        return `<button class="kora-footer__link" type="button">${label}</button>`;
    }
    const ext = link.external ? ` target="_blank" rel="noopener noreferrer"` : "";
    return `<a class="kora-footer__link" href="${escapeAttr(link.href)}"${ext}>${label}</a>`;
}

export function renderKoraFooter(props: KoraFooterProps): string {
    const links = props.links.map(linkHTML).join("");
    return `<kora-footer data-kora-ssr><div class="kora-footer" data-kora-content>${links}</div></kora-footer>`;
}
