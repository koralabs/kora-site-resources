/**
 * Pure markup for <kora-wallet-button> — the wallet entry point. It renders all modes up front and
 * toggles visibility (so refs stay stable / SSR adopts cleanly): a "Connect Wallet" button, a
 * wallet-picker popover, and the connected `kora-handle-indicator`. The element drives the modes
 * from a WalletStore subscription.
 */
import { escapeAttr } from "../../../utils/html.js";
import type { WalletStatus } from "../../../wallet/index.js";

export interface KoraWalletButtonState {
    status: WalletStatus;
    label: string;
    symbol: string;
}

export interface KoraWalletButtonProps {
    /** Optional resolved handle to show when connected (else the wallet name is shown). */
    handle?: string;
}

export function walletButtonInnerHTML(state: KoraWalletButtonState): string {
    const connected = state.status === "connected";
    const connecting = state.status === "connecting";
    const connectLabel = connecting ? "Connecting…" : "Connect Wallet";
    return (
        `<div class="kora-wallet">` +
        `<button class="kora-wallet__connect" type="button"${connected ? " hidden" : ""}${connecting ? " disabled" : ""}>${connectLabel}</button>` +
        `<div class="kora-wallet__picker" role="menu" hidden></div>` +
        `<kora-handle-indicator class="kora-wallet__indicator" handle="${escapeAttr(state.label)}" symbol="${escapeAttr(state.symbol)}"${connected ? "" : " hidden"}></kora-handle-indicator>` +
        `</div>`
    );
}

export function renderKoraWalletButton(props: KoraWalletButtonProps = {}): string {
    const state: KoraWalletButtonState = { status: "disconnected", label: "", symbol: "" };
    const handle = props.handle ? ` handle="${escapeAttr(props.handle)}"` : "";
    return `<kora-wallet-button data-kora-ssr${handle}>${walletButtonInnerHTML(state)}</kora-wallet-button>`;
}
