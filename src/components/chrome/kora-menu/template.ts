/**
 * Pure markup for <kora-menu> — the header "Resources" hamburger dropdown from handle.me. The
 * default cross-site links (DRep Dashboard, Supported Wallets, Merch, Docs, About, FAQ, X) come
 * from koraResourceLinks() so they appear on EVERY site; sites add their own via `extra` (SSR) or
 * by slotting <a> children (client). Env-aware.
 */
import { escapeHtml, escapeAttr } from "../../../utils/html.js";
import { koraResourceLinks } from "../../../env/links.js";
import type { KoraResourceLink } from "../../../env/links.js";
import type { KoraNetwork } from "../../../env/index.js";

export interface KoraMenuState {
    open: boolean;
    label: string;
}

export interface KoraMenuProps {
    /** Heading text. Default "Resources". */
    label?: string;
    env?: KoraNetwork;
    hostname?: string;
    /** Extra site-specific links appended after the shared defaults. */
    extra?: KoraResourceLink[];
}

const HAMBURGER_SVG =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
    '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';

const X_SVG =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">' +
    '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';

function linkHTML(link: KoraResourceLink): string {
    const ext = link.external ? ' target="_blank" rel="noopener noreferrer"' : "";
    const href = escapeAttr(link.href);
    if (link.icon === "x") {
        return `<a class="kora-menu__link kora-menu__link--icon" href="${href}"${ext} role="menuitem" aria-label="X">${X_SVG}</a>`;
    }
    return `<a class="kora-menu__link" href="${href}"${ext} role="menuitem">${escapeHtml(link.label)}</a>`;
}

export function menuLinksHTML(links: KoraResourceLink[]): string {
    return links.map(linkHTML).join("");
}

export function menuInnerHTML(state: KoraMenuState, linksHtml: string): string {
    return (
        `<div class="kora-menu">` +
        `<button class="kora-menu__trigger" type="button" aria-haspopup="true" aria-expanded="${state.open}" aria-label="${escapeAttr(state.label)}">${HAMBURGER_SVG}</button>` +
        `<div class="kora-menu__panel" role="menu"${state.open ? "" : " hidden"}>` +
        `<p class="kora-menu__heading">${escapeHtml(state.label)}</p>` +
        `<div class="kora-menu__links" data-kora-content>${linksHtml}</div>` +
        `</div>` +
        `</div>`
    );
}

export function renderKoraMenu(props: KoraMenuProps = {}): string {
    const state: KoraMenuState = { open: false, label: props.label ?? "Resources" };
    const links = koraResourceLinks({
        env: props.env,
        hostname: props.hostname,
        ...(props.extra ? { extra: props.extra } : {}),
    });
    return `<kora-menu data-kora-ssr label="${escapeAttr(state.label)}">${menuInnerHTML(state, menuLinksHTML(links))}</kora-menu>`;
}
