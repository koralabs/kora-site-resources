/**
 * Pure markup for <kora-input> — a labeled text field wrapping a real <input> (light DOM, so it
 * participates in forms natively and `input`/`change` bubble out). Optional label + error text.
 */
import { escapeHtml, escapeAttr } from "../../../utils/html.js";

export interface KoraInputState {
    type: string;
    value: string;
    placeholder: string;
    label: string;
    error: string;
    name: string | null;
    disabled: boolean;
}

export interface KoraInputProps {
    type?: string;
    value?: string;
    placeholder?: string;
    label?: string;
    error?: string;
    name?: string;
    disabled?: boolean;
}

export function inputInnerHTML(state: KoraInputState): string {
    const attrs = [
        'class="kora-input__field"',
        `type="${escapeAttr(state.type)}"`,
        state.value ? `value="${escapeAttr(state.value)}"` : "",
        state.placeholder ? `placeholder="${escapeAttr(state.placeholder)}"` : "",
        state.name ? `name="${escapeAttr(state.name)}"` : "",
        state.disabled ? "disabled" : "",
        state.error ? 'aria-invalid="true"' : "",
    ].filter(Boolean).join(" ");
    return (
        `<label class="kora-input${state.error ? " kora-input--error" : ""}">` +
        (state.label ? `<span class="kora-input__label">${escapeHtml(state.label)}</span>` : "") +
        `<input ${attrs}>` +
        `<span class="kora-input__error">${escapeHtml(state.error)}</span>` +
        `</label>`
    );
}

export function renderKoraInput(props: KoraInputProps = {}): string {
    const state: KoraInputState = {
        type: props.type ?? "text",
        value: props.value ?? "",
        placeholder: props.placeholder ?? "",
        label: props.label ?? "",
        error: props.error ?? "",
        name: props.name ?? null,
        disabled: !!props.disabled,
    };
    const attrs = ["data-kora-ssr", `type="${escapeAttr(state.type)}"`];
    if (state.label) attrs.push(`label="${escapeAttr(state.label)}"`);
    if (state.placeholder) attrs.push(`placeholder="${escapeAttr(state.placeholder)}"`);
    if (state.name) attrs.push(`name="${escapeAttr(state.name)}"`);
    if (state.error) attrs.push(`error="${escapeAttr(state.error)}"`);
    if (state.disabled) attrs.push("disabled");
    return `<kora-input ${attrs.join(" ")}>${inputInnerHTML(state)}</kora-input>`;
}
