/**
 * Pure markup for <kora-radio> — a styled radio wrapping a real <input type="radio">. Native `name`
 * gives free group exclusivity + keyboard arrow navigation across same-named radios.
 */
import { escapeHtml, escapeAttr } from "../../../utils/html.js";

export interface KoraRadioState {
    checked: boolean;
    disabled: boolean;
    label: string;
    name: string | null;
    value: string | null;
}

export interface KoraRadioProps {
    checked?: boolean;
    disabled?: boolean;
    label?: string;
    name?: string;
    value?: string;
}

export function radioInnerHTML(state: KoraRadioState): string {
    const attrs = [
        'type="radio"',
        'class="kora-radio__input kora-visually-hidden"',
        state.checked ? "checked" : "",
        state.disabled ? "disabled" : "",
        state.name ? `name="${escapeAttr(state.name)}"` : "",
        state.value ? `value="${escapeAttr(state.value)}"` : "",
    ].filter(Boolean).join(" ");
    return (
        `<label class="kora-radio">` +
        `<input ${attrs}>` +
        `<span class="kora-radio__dot" aria-hidden="true"></span>` +
        (state.label ? `<span class="kora-radio__label">${escapeHtml(state.label)}</span>` : "") +
        `</label>`
    );
}

export function renderKoraRadio(props: KoraRadioProps = {}): string {
    const state: KoraRadioState = {
        checked: !!props.checked,
        disabled: !!props.disabled,
        label: props.label ?? "",
        name: props.name ?? null,
        value: props.value ?? null,
    };
    const attrs = ["data-kora-ssr"];
    if (state.checked) attrs.push("checked");
    if (state.disabled) attrs.push("disabled");
    if (state.label) attrs.push(`label="${escapeAttr(state.label)}"`);
    if (state.name) attrs.push(`name="${escapeAttr(state.name)}"`);
    if (state.value) attrs.push(`value="${escapeAttr(state.value)}"`);
    return `<kora-radio ${attrs.join(" ")}>${radioInnerHTML(state)}</kora-radio>`;
}
