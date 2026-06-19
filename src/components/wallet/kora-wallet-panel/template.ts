/**
 * Pure markup for <kora-wallet-panel> — the contents of the "Wallet & Handles" drawer, modeled on
 * handle.me: a profile card (avatar, selected $handle, address, settings + disconnect), the
 * View Portal / Personalize / SubHandles actions, a search box, and the handle list (with Virtual
 * / DeMi badges). Designed to be slotted into <kora-drawer>. Handle rows are rendered dynamically
 * by the element; this provides the static shell + the per-row builder.
 */
import { escapeHtml, escapeAttr } from "../../../utils/html.js";

export interface KoraHandleItem {
    name: string;
    isDeMi?: boolean;
    /** Virtual SubHandle (issued off-wallet; flagged by the app from the BFF). */
    virtual?: boolean;
}

const GEAR_SVG =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

const POWER_SVG =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>';

const EXT_SVG =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';

const DIAMOND_SVG =
    '<svg viewBox="0 0 24 24" width="8" height="8" fill="currentColor" aria-hidden="true"><path d="M12 2 22 12 12 22 2 12z"/></svg>';

export const WALLET_PANEL_SHELL =
    `<div class="kora-wallet-panel">` +
    `<div class="kora-glass kora-wallet-panel__profile">` +
    `<div class="kora-wallet-panel__head">` +
    `<div class="kora-wallet-panel__avatar" data-ref="avatar">$</div>` +
    `<div class="kora-wallet-panel__id">` +
    `<p class="kora-wallet-panel__handle"><span class="kora-wallet-panel__dollar">$</span><span data-ref="handle"></span></p>` +
    `<p class="kora-wallet-panel__addr" data-ref="addr"></p>` +
    `</div>` +
    `<div class="kora-wallet-panel__tools">` +
    `<button class="kora-wallet-panel__tool" data-ref="settings" type="button" aria-label="Settings">${GEAR_SVG}</button>` +
    `<button class="kora-wallet-panel__tool kora-wallet-panel__tool--danger" data-ref="disconnect" type="button" aria-label="Disconnect">${POWER_SVG}</button>` +
    `</div>` +
    `</div>` +
    `<a class="kora-wallet-panel__portal" data-ref="portal" target="_blank" rel="noopener">View Portal ${EXT_SVG}</a>` +
    `<div class="kora-wallet-panel__quick">` +
    `<a class="kora-wallet-panel__quick-link" data-ref="personalize">Personalize</a>` +
    `<a class="kora-wallet-panel__quick-link" data-ref="subhandles">SubHandles</a>` +
    `</div>` +
    `</div>` +
    `<div class="kora-wallet-panel__search">` +
    `<input class="kora-wallet-panel__search-input" data-ref="search" type="search" placeholder="Search handles…" aria-label="Search handles">` +
    `</div>` +
    `<div class="kora-wallet-panel__list" data-ref="list"></div>` +
    `</div>`;

/** One handle row. `selected` marks the active handle. */
export function handleRowHTML(item: KoraHandleItem, selected: boolean): string {
    const badge = item.virtual
        ? `<span class="kora-wallet-panel__badge">${DIAMOND_SVG}Virtual</span>`
        : item.isDeMi
          ? `<span class="kora-wallet-panel__badge">${DIAMOND_SVG}DeMi</span>`
          : "";
    return (
        `<button class="kora-wallet-panel__row${selected ? " is-selected" : ""}" type="button" data-name="${escapeAttr(item.name)}">` +
        `<span class="kora-wallet-panel__row-name"><span class="kora-wallet-panel__dollar">$</span>${escapeHtml(item.name)}</span>` +
        badge +
        `</button>`
    );
}
