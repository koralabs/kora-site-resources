/**
 * Pure markup for <kora-modal> — a centered dialog (the handle.me modal shell: glass panel with a
 * gradient top border, blurred backdrop). Opt-in like the drawer; body content is slotted.
 * Visibility is driven by the host's `open` attribute so CSS animates the scale/fade.
 */
import { escapeHtml, escapeAttr } from "../../../utils/html.js";

export interface KoraModalState {
    title: string;
    open: boolean;
}

export interface KoraModalProps {
    title?: string;
    open?: boolean;
    body?: string;
}

export function modalInnerHTML(state: KoraModalState, body = ""): string {
    return (
        `<div class="kora-modal__backdrop" part="backdrop"></div>` +
        `<div class="kora-modal__dialog kora-glass" role="dialog" aria-modal="true" aria-label="${escapeAttr(state.title)}" part="dialog">` +
        `<div class="kora-modal__header">` +
        `<h2 class="kora-modal__title">${escapeHtml(state.title)}</h2>` +
        `<button class="kora-modal__close" type="button" aria-label="Close" part="close">&times;</button>` +
        `</div>` +
        `<div class="kora-modal__body" data-kora-content>${body}</div>` +
        `</div>`
    );
}

export function renderKoraModal(props: KoraModalProps = {}): string {
    const state: KoraModalState = { title: props.title ?? "", open: !!props.open };
    const attrs = ["data-kora-ssr", `title="${escapeAttr(state.title)}"`];
    if (state.open) attrs.push("open");
    return `<kora-modal ${attrs.join(" ")}>${modalInnerHTML(state, props.body ?? "")}</kora-modal>`;
}
