/**
 * Pure markup for <kora-tooltip> — a positional hover/focus tooltip. The trigger is the element's
 * slotted child; the bubble is added markup. Show/hide is pure CSS (hover + focus-within), so it
 * needs no JS beyond syncing the text. `position` (top|bottom|left|right) is reflected for CSS.
 */
import { escapeHtml } from "../../../utils/html.js";

export type KoraTooltipPosition = "top" | "bottom" | "left" | "right";

export interface KoraTooltipState {
    text: string;
    position: KoraTooltipPosition;
}

export interface KoraTooltipProps {
    text: string;
    position?: KoraTooltipPosition;
    /** Pre-rendered trigger markup (SSR). */
    trigger?: string;
}

export function tooltipInnerHTML(state: KoraTooltipState, trigger = ""): string {
    return (
        `<span class="kora-tooltip__trigger" data-kora-content>${trigger}</span>` +
        `<span class="kora-tooltip__bubble" role="tooltip">${escapeHtml(state.text)}</span>`
    );
}

export function renderKoraTooltip(props: KoraTooltipProps): string {
    const state: KoraTooltipState = { text: props.text, position: props.position ?? "top" };
    return (
        `<kora-tooltip data-kora-ssr text="${escapeHtml(state.text)}" position="${state.position}">` +
        tooltipInnerHTML(state, props.trigger ?? "") +
        `</kora-tooltip>`
    );
}
