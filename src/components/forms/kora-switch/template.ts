/**
 * Pure markup for <kora-switch> — a toggle wrapping a real <input type="checkbox"> with role=switch
 * (visually hidden), styled as a sliding track/thumb. Native keyboard, form participation, `change`.
 */
import { escapeHtml, escapeAttr } from "../../../utils/html.js";

export interface KoraSwitchState {
    checked: boolean;
    disabled: boolean;
    label: string;
    name: string | null;
}

export interface KoraSwitchProps {
    checked?: boolean;
    disabled?: boolean;
    label?: string;
    name?: string;
}

export function switchInnerHTML(state: KoraSwitchState): string {
    const attrs = [
        'type="checkbox"',
        'role="switch"',
        'class="kora-switch__input kora-visually-hidden"',
        state.checked ? "checked" : "",
        state.disabled ? "disabled" : "",
        state.name ? `name="${escapeAttr(state.name)}"` : "",
    ].filter(Boolean).join(" ");
    return (
        `<label class="kora-switch">` +
        `<input ${attrs}>` +
        `<span class="kora-switch__track" aria-hidden="true"><span class="kora-switch__thumb"></span></span>` +
        (state.label ? `<span class="kora-switch__label">${escapeHtml(state.label)}</span>` : "") +
        `</label>`
    );
}

export function renderKoraSwitch(props: KoraSwitchProps = {}): string {
    const state: KoraSwitchState = {
        checked: !!props.checked,
        disabled: !!props.disabled,
        label: props.label ?? "",
        name: props.name ?? null,
    };
    const attrs = ["data-kora-ssr"];
    if (state.checked) attrs.push("checked");
    if (state.disabled) attrs.push("disabled");
    if (state.label) attrs.push(`label="${escapeAttr(state.label)}"`);
    if (state.name) attrs.push(`name="${escapeAttr(state.name)}"`);
    return `<kora-switch ${attrs.join(" ")}>${switchInnerHTML(state)}</kora-switch>`;
}
