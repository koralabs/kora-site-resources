/**
 * Pure markup for <kora-checkbox> — a styled checkbox wrapping a real <input type="checkbox"> (kept
 * visually hidden), so it gets native keyboard, form participation, and `change` events for free.
 */
import { escapeHtml, escapeAttr } from "../../../utils/html.js";

export interface KoraCheckboxState {
    checked: boolean;
    disabled: boolean;
    label: string;
    name: string | null;
    value: string | null;
}

export interface KoraCheckboxProps {
    checked?: boolean;
    disabled?: boolean;
    label?: string;
    name?: string;
    value?: string;
}

const CHECK_SVG =
    '<svg class="kora-checkbox__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';

export function checkboxInnerHTML(state: KoraCheckboxState): string {
    const attrs = [
        'type="checkbox"',
        'class="kora-checkbox__input kora-visually-hidden"',
        state.checked ? "checked" : "",
        state.disabled ? "disabled" : "",
        state.name ? `name="${escapeAttr(state.name)}"` : "",
        state.value ? `value="${escapeAttr(state.value)}"` : "",
    ].filter(Boolean).join(" ");
    return (
        `<label class="kora-checkbox">` +
        `<input ${attrs}>` +
        `<span class="kora-checkbox__box" aria-hidden="true">${CHECK_SVG}</span>` +
        (state.label ? `<span class="kora-checkbox__label">${escapeHtml(state.label)}</span>` : "") +
        `</label>`
    );
}

export function renderKoraCheckbox(props: KoraCheckboxProps = {}): string {
    const state: KoraCheckboxState = {
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
    return `<kora-checkbox ${attrs.join(" ")}>${checkboxInnerHTML(state)}</kora-checkbox>`;
}
