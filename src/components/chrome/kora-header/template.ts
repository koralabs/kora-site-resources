/**
 * Pure markup for <kora-header> — the top nav bar from handle.me. Structure: configurable brand
 * lockup on the left (a nested <kora-brand>; `$handle` by default, rebrandable per site), nav links
 * after it (default-slot children), and an actions region on the right (slot="actions" children,
 * e.g. the wallet-connect button / handle indicator).
 */
import { escapeAttr, escapeHtml } from "../../../utils/html.js";
import { renderKoraBrand } from "../kora-brand/template.js";
import { koraNavLinks } from "../../../env/links.js";
import type { KoraNetwork } from "../../../env/index.js";

export interface KoraHeaderState {
    brandLabel: string;
    brandHref: string | null;
    /** Render the shared global nav (Mint / H.A.L. / Merch) before any site links. Default true. */
    defaultNav: boolean;
}

export interface KoraHeaderProps {
    /** Brand wordmark. Default "handle". */
    brandLabel?: string;
    brandHref?: string;
    /** Extra site-specific nav links (appended AFTER the shared defaults). */
    nav?: string;
    actions?: string;
    /** Set false to omit the shared global nav links. Default true. */
    defaultNav?: boolean;
    env?: KoraNetwork;
    hostname?: string;
}

/** Empty <kora-brand> tag (self-renders on upgrade) for a fresh client render. */
function brandTag(state: KoraHeaderState): string {
    const label = state.brandLabel ? ` label="${escapeAttr(state.brandLabel)}"` : "";
    const href = state.brandHref ? ` href="${escapeAttr(state.brandHref)}"` : "";
    return `<kora-brand${label}${href}></kora-brand>`;
}

/** The shared global nav links (Mint / H.A.L. / Merch), env-aware. */
function defaultNavHTML(env?: KoraNetwork, hostname?: string): string {
    return koraNavLinks({ env, hostname })
        .map(
            (l) =>
                `<a href="${escapeAttr(l.href)}"${l.external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${escapeHtml(l.label)}</a>`,
        )
        .join("");
}

export function headerShellHTML(brandMarkup: string, nav = "", actions = ""): string {
    return (
        `<header class="kora-header" part="header">` +
        `<div class="kora-header__start">${brandMarkup}` +
        `<nav class="kora-header__nav" data-kora-content>${nav}</nav></div>` +
        `<div class="kora-header__actions" data-kora-slot="actions">${actions}</div>` +
        `</header>`
    );
}

/** Shell for a fresh client render (brand renders itself; site nav children get projected after
 *  the shared defaults). Env for the defaults is derived from the current host. */
export function headerInnerHTML(state: KoraHeaderState): string {
    return headerShellHTML(brandTag(state), state.defaultNav ? defaultNavHTML() : "");
}

export function renderKoraHeader(props: KoraHeaderProps = {}): string {
    const state: KoraHeaderState = {
        brandLabel: props.brandLabel ?? "handle",
        brandHref: props.brandHref ?? null,
        defaultNav: props.defaultNav !== false,
    };
    const brand = renderKoraBrand({
        label: state.brandLabel,
        ...(state.brandHref ? { href: state.brandHref } : {}),
    });
    const defaults = state.defaultNav ? defaultNavHTML(props.env, props.hostname) : "";
    const shell = headerShellHTML(brand, defaults + (props.nav ?? ""), props.actions ?? "");
    const attrs = ["data-kora-ssr", `brand-label="${escapeAttr(state.brandLabel)}"`];
    if (state.brandHref) attrs.push(`brand-href="${escapeAttr(state.brandHref)}"`);
    if (!state.defaultNav) attrs.push('default-nav="false"');
    return `<kora-header ${attrs.join(" ")}>${shell}</kora-header>`;
}
