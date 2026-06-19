/**
 * Client entry for @koralabs/kora-site-resources. Importing this registers all custom elements
 * and re-exports their classes/types. Has DOM side effects (customElements.define) — do NOT import
 * it in a Node/SSR context; use "@koralabs/kora-site-resources/ssr" there instead.
 */
export { KoraElement, SSR_MARKER } from "./components/base/kora-element.js";
export { token } from "./tokens/index.js";

export * from "./env/index.js"; // includes the link-set helpers (re-exported from ./env/links.js)
export { clearHandleSiteData } from "./site/clear-site-data.js";
export type { ClearSiteDataOptions } from "./site/clear-site-data.js";
export * from "./wallet/index.js";

export * from "./components/primitives/kora-button/index.js";
export * from "./components/chrome/kora-brand/index.js";
export * from "./components/chrome/kora-background/index.js";
export * from "./components/chrome/kora-header/index.js";
export * from "./components/chrome/kora-footer/index.js";
export * from "./components/chrome/kora-menu/index.js";
export * from "./components/wallet/kora-handle-indicator/index.js";
export * from "./components/wallet/kora-wallet-button/index.js";
export * from "./components/wallet/kora-wallet-panel/index.js";
export * from "./components/overlay/kora-drawer/index.js";
export * from "./components/overlay/kora-modal/index.js";
export * from "./components/feedback/kora-loader/index.js";
export * from "./components/feedback/kora-toast/index.js";
export * from "./components/feedback/kora-tooltip/index.js";
export * from "./components/forms/kora-checkbox/index.js";
export * from "./components/forms/kora-radio/index.js";
export * from "./components/forms/kora-switch/index.js";
export * from "./components/forms/kora-input/index.js";
export * from "./components/forms/kora-select/index.js";
export * from "./components/navigation/kora-tabs/index.js";
export * from "./components/navigation/kora-collapsible/index.js";
export * from "./icons/index.js"; // registers <kora-icon> + the curated default set (no lucide dep pulled)
