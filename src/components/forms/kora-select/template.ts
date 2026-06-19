/**
 * Pure markup for <kora-select> — a custom, fully-styleable dropdown (handle.me uses a headless-UI
 * menu for this). A styled trigger + a role=listbox popover, plus a hidden <input> mirroring the
 * value so it submits with a form. Options come from the `options` property (or a JSON `options`
 * attribute for SSR).
 */
import { escapeHtml, escapeAttr } from "../../../utils/html.js";

export interface KoraSelectOption {
    value: string;
    label: string;
}

export interface KoraSelectState {
    value: string;
    placeholder: string;
    name: string | null;
    disabled: boolean;
    open: boolean;
    options: KoraSelectOption[];
}

export interface KoraSelectProps {
    options: KoraSelectOption[];
    value?: string;
    placeholder?: string;
    name?: string;
    disabled?: boolean;
}

const CHEVRON =
    '<svg class="kora-select__chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';

export function optionsHTML(state: KoraSelectState): string {
    return state.options
        .map(
            (o) =>
                `<li class="kora-select__option" role="option" data-value="${escapeAttr(o.value)}" aria-selected="${o.value === state.value}">${escapeHtml(o.label)}</li>`,
        )
        .join("");
}

export function selectInnerHTML(state: KoraSelectState): string {
    const selected = state.options.find((o) => o.value === state.value);
    const triggerLabel = selected ? selected.label : state.placeholder || "Select…";
    return (
        `<div class="kora-select">` +
        `<button class="kora-select__trigger" type="button" aria-haspopup="listbox" aria-expanded="${state.open}"${state.disabled ? " disabled" : ""}>` +
        `<span class="kora-select__value${selected ? "" : " kora-select__value--placeholder"}">${escapeHtml(triggerLabel)}</span>` +
        CHEVRON +
        `</button>` +
        `<ul class="kora-select__list" role="listbox"${state.open ? "" : " hidden"}>${optionsHTML(state)}</ul>` +
        `<input type="hidden" class="kora-select__input"${state.name ? ` name="${escapeAttr(state.name)}"` : ""} value="${escapeAttr(state.value)}">` +
        `</div>`
    );
}

export function renderKoraSelect(props: KoraSelectProps): string {
    const state: KoraSelectState = {
        value: props.value ?? "",
        placeholder: props.placeholder ?? "",
        name: props.name ?? null,
        disabled: !!props.disabled,
        open: false,
        options: props.options ?? [],
    };
    const attrs = ["data-kora-ssr", `options="${escapeAttr(JSON.stringify(state.options))}"`];
    if (state.value) attrs.push(`value="${escapeAttr(state.value)}"`);
    if (state.placeholder) attrs.push(`placeholder="${escapeAttr(state.placeholder)}"`);
    if (state.name) attrs.push(`name="${escapeAttr(state.name)}"`);
    if (state.disabled) attrs.push("disabled");
    return `<kora-select ${attrs.join(" ")}>${selectInnerHTML(state)}</kora-select>`;
}
