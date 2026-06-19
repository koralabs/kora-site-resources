/**
 * Pure markup for <kora-drawer> — the right-side slide-out panel from handle.me (blurred backdrop,
 * sliding panel, header with title + close). Opt-in per site. Body content is slotted (default
 * children). Visibility is driven by the host's `open` attribute so CSS animates the transition.
 */
import { escapeHtml, escapeAttr } from "../../../utils/html.js";

export interface KoraDrawerState {
    title: string;
    open: boolean;
}

export interface KoraDrawerProps {
    title?: string;
    open?: boolean;
}

export function drawerInnerHTML(state: KoraDrawerState, body = ""): string {
    return (
        `<div class="kora-drawer__backdrop" part="backdrop"></div>` +
        `<aside class="kora-drawer__panel" role="dialog" aria-modal="true" aria-label="${escapeAttr(state.title)}" part="panel">` +
        `<div class="kora-drawer__header">` +
        `<h2 class="kora-drawer__title">${escapeHtml(state.title)}</h2>` +
        `<button class="kora-drawer__close" type="button" aria-label="Close panel" part="close">&times;</button>` +
        `</div>` +
        `<div class="kora-drawer__body" data-kora-content>${body}</div>` +
        `</aside>`
    );
}

export function renderKoraDrawer(props: KoraDrawerProps & { body?: string } = {}): string {
    const state: KoraDrawerState = { title: props.title ?? "", open: !!props.open };
    const attrs = ["data-kora-ssr", `title="${escapeAttr(state.title)}"`];
    if (state.open) attrs.push("open");
    return `<kora-drawer ${attrs.join(" ")}>${drawerInnerHTML(state, props.body ?? "")}</kora-drawer>`;
}
