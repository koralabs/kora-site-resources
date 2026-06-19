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

export { renderKoraDrawer } from "../components/overlay/kora-drawer/template.js";
export type { KoraDrawerProps, KoraDrawerState } from "../components/overlay/kora-drawer/template.js";
