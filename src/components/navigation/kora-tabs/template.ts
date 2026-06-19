/**
 * Pure markup for <kora-tabs> — a segmented control / tab bar (handle.me rolls a bespoke one per
 * view, e.g. Normal/DeMi). Renders an ARIA tablist; selecting a tab reflects `active` and emits
 * `kora-tab-change`. The app shows/hides its own panels from that (kept flexible on purpose).
 */
import { escapeHtml, escapeAttr } from "../../../utils/html.js";

export interface KoraTab {
    id: string;
    label: string;
}

export interface KoraTabsState {
    active: string;
    tabs: KoraTab[];
}

export interface KoraTabsProps {
    tabs: KoraTab[];
    active?: string;
}

export function tabsInnerHTML(state: KoraTabsState): string {
    const active = state.active || state.tabs[0]?.id || "";
    return (
        `<div class="kora-tabs" role="tablist">` +
        state.tabs
            .map(
                (t) =>
                    `<button class="kora-tabs__tab" role="tab" type="button" data-id="${escapeAttr(t.id)}" aria-selected="${t.id === active}" tabindex="${t.id === active ? 0 : -1}">${escapeHtml(t.label)}</button>`,
            )
            .join("") +
        `</div>`
    );
}

export function renderKoraTabs(props: KoraTabsProps): string {
    const state: KoraTabsState = {
        active: props.active ?? props.tabs[0]?.id ?? "",
        tabs: props.tabs ?? [],
    };
    return (
        `<kora-tabs data-kora-ssr active="${escapeAttr(state.active)}" tabs="${escapeAttr(JSON.stringify(state.tabs))}">` +
        tabsInnerHTML(state) +
        `</kora-tabs>`
    );
}
