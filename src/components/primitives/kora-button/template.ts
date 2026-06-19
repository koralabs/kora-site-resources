/**
 * Pure, DOM-free markup for <kora-button>. Imported by BOTH the client element (kora-button.ts)
 * and the server renderer (renderKoraButton) so SSR output and client render are byte-identical.
 * This module must never touch `window`/`document`/`customElements` — it has to run in Node.
 */
import { escapeHtml, escapeAttr } from "../../../utils/html.js";

export type KoraButtonVariant = "primary" | "secondary" | "tertiary" | "outline" | "link";

/** Reactive state shape held by the element. */
export interface KoraButtonState {
    variant: KoraButtonVariant;
    label: string;
    disabled: boolean;
    loading: boolean;
}

/** Props accepted by the server renderer. */
export interface KoraButtonProps {
    label: string;
    variant?: KoraButtonVariant;
    disabled?: boolean;
    loading?: boolean;
}

const SPINNER_SVG =
    '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none">' +
    '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-opacity="0.25"/>' +
    '<path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
    "</svg>";

/** The inner markup of the button — the part that lives inside the <kora-button> host. */
export function buttonInnerHTML(state: KoraButtonState): string {
    const isDisabled = state.disabled || state.loading;
    return (
        `<button class="kora-btn kora-btn--${state.variant}" type="button" part="button"` +
        `${isDisabled ? " disabled" : ""}>` +
        `<span class="kora-btn__spinner"${state.loading ? "" : " hidden"} aria-hidden="true">${SPINNER_SVG}</span>` +
        `<span class="kora-btn__label">${escapeHtml(state.label)}</span>` +
        `</button>`
    );
}

function normalize(props: KoraButtonProps): KoraButtonState {
    return {
        variant: props.variant ?? "primary",
        label: props.label,
        disabled: !!props.disabled,
        loading: !!props.loading,
    };
}

/**
 * Server-side render of a complete <kora-button>. Emits the SSR marker so the client element
 * adopts this markup instead of re-rendering. Attributes carry the state (the single source of
 * truth); the inner markup matches what the client would produce for those attributes.
 */
export function renderKoraButton(props: KoraButtonProps): string {
    const state = normalize(props);
    const attrs = [
        "data-kora-ssr",
        `variant="${state.variant}"`,
        `label="${escapeAttr(state.label)}"`,
    ];
    if (state.disabled) attrs.push("disabled");
    if (state.loading) attrs.push("loading");
    return `<kora-button ${attrs.join(" ")}>${buttonInnerHTML(state)}</kora-button>`;
}
