/**
 * Pure markup for <kora-footer> — the centered, pipe-separated link row from handle.me. The shared
 * default links (How to Integrate / Terms of use / Verified integration / Clear site data) are
 * rendered by default; site-authored children are appended after them. `default-links="false"`
 * opts out. Dividers are drawn by CSS.
 */
import { escapeHtml, escapeAttr } from "../../../utils/html.js";
import { koraFooterLinks } from "../../../env/links.js";
import type { KoraNetwork } from "../../../env/index.js";

export interface KoraFooterLink {
    label: string;
    /** Omit for a button-style action. */
    href?: string;
    external?: boolean;
    /** Marks a built-in action button (e.g. "clear-site-data"), wired by the element. */
    action?: string;
}

export interface KoraFooterState {
    /** Render the shared default links before any site links. Default true. */
    defaultLinks: boolean;
}

export interface KoraFooterProps {
    /** Extra site-specific links, appended AFTER the shared defaults. */
    links?: KoraFooterLink[];
    defaultLinks?: boolean;
    env?: KoraNetwork;
    hostname?: string;
}

function linkHTML(link: KoraFooterLink): string {
    const label = escapeHtml(link.label);
    if (!link.href) {
        const action = link.action ? ` data-kora-action="${escapeAttr(link.action)}"` : "";
        return `<button class="kora-footer__link" type="button"${action}>${label}</button>`;
    }
    const ext = link.external ? ` target="_blank" rel="noopener noreferrer"` : "";
    return `<a class="kora-footer__link" href="${escapeAttr(link.href)}"${ext}>${label}</a>`;
}

/** The shared default footer links, env-aware. */
export function footerLinksHTML(env?: KoraNetwork, hostname?: string): string {
    return koraFooterLinks({ env, hostname }).map(linkHTML).join("");
}

/** Shell for a fresh client render (defaults rendered; site links projected after; env from host). */
export function footerInnerHTML(state: KoraFooterState): string {
    return `<div class="kora-footer" data-kora-content>${state.defaultLinks ? footerLinksHTML() : ""}</div>`;
}

export function renderKoraFooter(props: KoraFooterProps = {}): string {
    const defaultLinks = props.defaultLinks !== false;
    const defaults = defaultLinks ? footerLinksHTML(props.env, props.hostname) : "";
    const extra = (props.links ?? []).map(linkHTML).join("");
    const attr = defaultLinks ? "" : ' default-links="false"';
    return `<kora-footer data-kora-ssr${attr}><div class="kora-footer" data-kora-content>${defaults}${extra}</div></kora-footer>`;
}
