/**
 * Pure markup for <kora-handle-indicator> — the "chosen handle" pill from handle.me's connected
 * state: a green `$`, the handle in monospace, a divider, and a wallet glyph, on a pill with a
 * hover gradient sheen. Presentational + a button; apps listen for `click` to open their drawer.
 */
import { escapeHtml, escapeAttr } from "../../../utils/html.js";

export interface KoraHandleIndicatorState {
    handle: string;
    symbol: string;
}

export interface KoraHandleIndicatorProps {
    handle: string;
    /** Prefix glyph. Default "$". */
    symbol?: string;
}

const WALLET_SVG =
    '<svg class="kora-handle-indicator__wallet" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M21 7.28V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2.28A2 2 0 0 0 22 15V9a2 2 0 0 0-1-1.72zM20 9v6h-7V9h7zM5 19V5h14v2h-6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6v2H5z"/>' +
    '<circle cx="16" cy="12" r="1.5"/></svg>';

export function handleIndicatorInnerHTML(state: KoraHandleIndicatorState): string {
    return (
        `<button class="kora-handle-indicator" type="button" part="button">` +
        `<span class="kora-handle-indicator__inner">` +
        `<span class="kora-handle-indicator__symbol">${escapeHtml(state.symbol)}</span>` +
        `<span class="kora-handle-indicator__handle">${escapeHtml(state.handle)}</span>` +
        `<span class="kora-handle-indicator__divider" aria-hidden="true"></span>` +
        WALLET_SVG +
        `</span>` +
        `<span class="kora-handle-indicator__glow" aria-hidden="true"></span>` +
        `</button>`
    );
}

export function renderKoraHandleIndicator(props: KoraHandleIndicatorProps): string {
    const state: KoraHandleIndicatorState = { handle: props.handle, symbol: props.symbol ?? "$" };
    const attrs = [
        "data-kora-ssr",
        `handle="${escapeAttr(state.handle)}"`,
        `symbol="${escapeAttr(state.symbol)}"`,
    ];
    return `<kora-handle-indicator ${attrs.join(" ")}>${handleIndicatorInnerHTML(state)}</kora-handle-indicator>`;
}
