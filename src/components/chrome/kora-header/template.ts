/**
 * Pure markup for <kora-header> — the top nav bar from handle.me. Structure: configurable brand
 * lockup on the left (a nested <kora-brand>; `$handle` by default, rebrandable per site), nav links
 * after it (default-slot children), and an actions region on the right (slot="actions" children,
 * e.g. the wallet-connect button / handle indicator).
 */
import { escapeAttr } from "../../../utils/html.js";
import { renderKoraBrand } from "../kora-brand/template.js";

export interface KoraHeaderState {
    brandLabel: string;
    brandHref: string | null;
}

export interface KoraHeaderProps {
    /** Brand wordmark. Default "handle". */
    brandLabel?: string;
    brandHref?: string;
    /** Pre-rendered nav links / actions markup (for SSR). */
    nav?: string;
    actions?: string;
}

/** Empty <kora-brand> tag (self-renders on upgrade) for a fresh client render. */
function brandTag(state: KoraHeaderState): string {
    const label = state.brandLabel ? ` label="${escapeAttr(state.brandLabel)}"` : "";
    const href = state.brandHref ? ` href="${escapeAttr(state.brandHref)}"` : "";
    return `<kora-brand${label}${href}></kora-brand>`;
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

/** Shell for a fresh client render (brand renders itself; children get projected in). */
export function headerInnerHTML(state: KoraHeaderState): string {
    return headerShellHTML(brandTag(state));
}

export function renderKoraHeader(props: KoraHeaderProps = {}): string {
    const state: KoraHeaderState = {
        brandLabel: props.brandLabel ?? "handle",
        brandHref: props.brandHref ?? null,
    };
    const brand = renderKoraBrand({
        label: state.brandLabel,
        ...(state.brandHref ? { href: state.brandHref } : {}),
    });
    const shell = headerShellHTML(brand, props.nav ?? "", props.actions ?? "");
    const attrs = ["data-kora-ssr", `brand-label="${escapeAttr(state.brandLabel)}"`];
    if (state.brandHref) attrs.push(`brand-href="${escapeAttr(state.brandHref)}"`);
    return `<kora-header ${attrs.join(" ")}>${shell}</kora-header>`;
}
