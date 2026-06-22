/**
 * Server-safe entry. Aggregates the pure `renderKoraX` string renderers — NO customElements,
 * NO DOM — so it runs in Node for SSR. Pair with the client entry on the browser, which adopts
 * this markup via the SSR marker (see KoraElement).
 */
export { renderKoraButton } from "../components/primitives/kora-button/template.js";
export type {
    KoraButtonProps,
    KoraButtonVariant,
    KoraButtonState,
} from "../components/primitives/kora-button/template.js";

export { renderKoraBrand } from "../components/chrome/kora-brand/template.js";
export type { KoraBrandProps, KoraBrandState } from "../components/chrome/kora-brand/template.js";

export { renderKoraBackground } from "../components/chrome/kora-background/template.js";
export type {
    KoraBackgroundProps,
    KoraBackgroundState,
} from "../components/chrome/kora-background/template.js";

export { renderKoraHandleIndicator } from "../components/wallet/kora-handle-indicator/template.js";
export type {
    KoraHandleIndicatorProps,
    KoraHandleIndicatorState,
} from "../components/wallet/kora-handle-indicator/template.js";

export { renderKoraWalletButton } from "../components/wallet/kora-wallet-button/template.js";
export type {
    KoraWalletButtonProps,
    KoraWalletButtonState,
} from "../components/wallet/kora-wallet-button/template.js";

export { renderKoraHeader } from "../components/chrome/kora-header/template.js";
export type { KoraHeaderProps, KoraHeaderState } from "../components/chrome/kora-header/template.js";

export { renderKoraFooter } from "../components/chrome/kora-footer/template.js";
export type { KoraFooterLink, KoraFooterProps } from "../components/chrome/kora-footer/template.js";

export { renderKoraMenu } from "../components/chrome/kora-menu/template.js";
export type { KoraMenuProps, KoraMenuState } from "../components/chrome/kora-menu/template.js";

export type { KoraHandleItem } from "../components/wallet/kora-wallet-panel/template.js";

export { renderKoraIpfsImage } from "../components/media/kora-ipfs-image/template.js";
export type { KoraIpfsImageProps } from "../components/media/kora-ipfs-image/template.js";

export { renderKoraDrawer } from "../components/overlay/kora-drawer/template.js";
export type { KoraDrawerProps, KoraDrawerState } from "../components/overlay/kora-drawer/template.js";

export { renderKoraModal } from "../components/overlay/kora-modal/template.js";
export type { KoraModalProps, KoraModalState } from "../components/overlay/kora-modal/template.js";

export { renderKoraTabs } from "../components/navigation/kora-tabs/template.js";
export type { KoraTabsProps, KoraTabsState, KoraTab } from "../components/navigation/kora-tabs/template.js";
export { renderKoraCollapsible } from "../components/navigation/kora-collapsible/template.js";
export type {
    KoraCollapsibleProps,
    KoraCollapsibleState,
} from "../components/navigation/kora-collapsible/template.js";

export { renderKoraIcon, iconSVG } from "../icons/render.js";
export type { IconNode } from "../icons/registry.js";

export { renderKoraLoader } from "../components/feedback/kora-loader/template.js";
export type { KoraLoaderProps, KoraLoaderState } from "../components/feedback/kora-loader/template.js";

export { renderKoraTooltip } from "../components/feedback/kora-tooltip/template.js";
export type {
    KoraTooltipProps,
    KoraTooltipState,
    KoraTooltipPosition,
} from "../components/feedback/kora-tooltip/template.js";

export { renderKoraCheckbox } from "../components/forms/kora-checkbox/template.js";
export type { KoraCheckboxProps, KoraCheckboxState } from "../components/forms/kora-checkbox/template.js";
export { renderKoraRadio } from "../components/forms/kora-radio/template.js";
export type { KoraRadioProps, KoraRadioState } from "../components/forms/kora-radio/template.js";
export { renderKoraSwitch } from "../components/forms/kora-switch/template.js";
export type { KoraSwitchProps, KoraSwitchState } from "../components/forms/kora-switch/template.js";
export { renderKoraInput } from "../components/forms/kora-input/template.js";
export type { KoraInputProps, KoraInputState } from "../components/forms/kora-input/template.js";
export { renderKoraSelect } from "../components/forms/kora-select/template.js";
export type {
    KoraSelectProps,
    KoraSelectState,
    KoraSelectOption,
} from "../components/forms/kora-select/template.js";
