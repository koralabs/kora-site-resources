/**
 * Pure markup for <kora-collapsible> — an accordion section (trigger + collapsible body). Open
 * state is the host's `open` attribute; the height animates via a grid-rows 0fr→1fr transition
 * (no JS measuring). Body content is slotted.
 */
import { escapeHtml, escapeAttr } from "../../../utils/html.js";

export interface KoraCollapsibleState {
    title: string;
    open: boolean;
}

export interface KoraCollapsibleProps {
    title?: string;
    open?: boolean;
    body?: string;
}

const CHEVRON =
    '<svg class="kora-collapsible__chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';

export function collapsibleInnerHTML(state: KoraCollapsibleState, body = ""): string {
    return (
        `<button class="kora-collapsible__trigger" type="button" aria-expanded="${state.open}">` +
        `<span class="kora-collapsible__title">${escapeHtml(state.title)}</span>` +
        CHEVRON +
        `</button>` +
        `<div class="kora-collapsible__region">` +
        `<div class="kora-collapsible__inner" data-kora-content>${body}</div>` +
        `</div>`
    );
}

export function renderKoraCollapsible(props: KoraCollapsibleProps = {}): string {
    const state: KoraCollapsibleState = { title: props.title ?? "", open: !!props.open };
    const attrs = ["data-kora-ssr", `title="${escapeAttr(state.title)}"`];
    if (state.open) attrs.push("open");
    return `<kora-collapsible ${attrs.join(" ")}>${collapsibleInnerHTML(state, props.body ?? "")}</kora-collapsible>`;
}
