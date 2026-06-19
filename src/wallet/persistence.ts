/**
 * Remember the last-used wallet and selected handle so a returning visitor reconnects silently and
 * lands on the same handle. Stored as cookies on the shared parent domain (.handle.me) so the
 * choice carries across all the sites (on localhost / single-label hosts they fall back to a
 * host-only cookie). Cleared by clearHandleSiteData() along with the rest of the site data.
 *
 * Note: cross-subdomain memory only avoids the *picker* — each subdomain still needs its own CIP-30
 * authorization, so a silent reconnect happens only where the wallet already trusts this origin.
 */
const WALLET_COOKIE = "kora_wallet";
const HANDLE_COOKIE = "kora_handle";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** "preview.merch.handle.me" → "handle.me" (the shared, cookie-able parent domain). */
function registrableDomain(hostname: string): string {
    const labels = hostname.split(".");
    return labels.length >= 2 ? labels.slice(-2).join(".") : hostname;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
    const doc = globalThis.document;
    if (!doc) return;
    const parent = registrableDomain(globalThis.location?.hostname ?? "");
    const domain = parent.includes(".") ? `;domain=.${parent}` : ""; // host-only on localhost
    doc.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAgeSeconds};samesite=lax${domain}`;
}

function readCookie(name: string): string | null {
    const doc = globalThis.document;
    if (!doc) return null;
    const prefix = `${name}=`;
    for (const part of doc.cookie.split(";")) {
        const cookie = part.trim();
        // An empty value means "nothing remembered" (e.g. a just-expired cookie) → treat as null.
        if (cookie.startsWith(prefix)) return decodeURIComponent(cookie.slice(prefix.length)) || null;
    }
    return null;
}

export function rememberWallet(walletKey: string): void {
    writeCookie(WALLET_COOKIE, walletKey, ONE_YEAR_SECONDS);
}
export function recallWallet(): string | null {
    return readCookie(WALLET_COOKIE);
}
export function forgetWallet(): void {
    writeCookie(WALLET_COOKIE, "", 0);
}

export function rememberHandle(name: string): void {
    writeCookie(HANDLE_COOKIE, name, ONE_YEAR_SECONDS);
}
export function recallHandle(): string | null {
    return readCookie(HANDLE_COOKIE);
}
export function forgetHandle(): void {
    writeCookie(HANDLE_COOKIE, "", 0);
}
