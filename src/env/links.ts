/**
 * Canonical, environment-aware link sets for the shared header nav and footer, encoding the
 * destinations used on handle.me. Reusable so every site links to the same (correct) places —
 * fixing the handle.me bug where H.A.L. / Merch were hardcoded without the env prefix.
 */
import { siteUrl } from "./index.js";
import type { KoraNetwork } from "./index.js";
import type { KoraFooterLink } from "../components/chrome/kora-footer/template.js";

export interface KoraNavLink {
    label: string;
    href: string;
    external: boolean;
}

export interface KoraLinkOptions {
    env?: KoraNetwork;
    hostname?: string;
}

export interface KoraResourceLink {
    label: string;
    href: string;
    external?: boolean;
    /** Render as a social icon instead of a text label. */
    icon?: "x";
}

/**
 * The shared "Resources" menu links that appear on EVERY site (env-aware). Pass `extra` to append
 * site-specific links — they keep the defaults and add their own:
 *   koraResourceLinks({ env, extra: [{ label: "Roadmap", href: "/roadmap" }] })
 */
export function koraResourceLinks(
    opts: KoraLinkOptions & { extra?: KoraResourceLink[] } = {},
): KoraResourceLink[] {
    const base = { env: opts.env, hostname: opts.hostname };
    const links: KoraResourceLink[] = [
        { label: "DRep Dashboard", href: siteUrl("portal", { ...base, path: "/$/drep" }) },
        { label: "Supported Wallets", href: siteUrl("portal", { ...base, path: "/#supported_wallets" }) },
        { label: "Merch", href: siteUrl("merch", base), external: true },
        { label: "Docs", href: siteUrl("docs", base), external: true },
        { label: "About", href: siteUrl("portal", { ...base, path: "/$/about" }) },
        { label: "FAQ", href: siteUrl("portal", { ...base, path: "/$/faq" }) },
        { label: "X", href: "https://x.com/adahandle", external: true, icon: "x" },
    ];
    return opts.extra ? [...links, ...opts.extra] : links;
}

/** The top-nav destinations: the global ecosystem properties. Handle-scoped actions
 *  (Personalize / Portal / SubHandles) deliberately live in the wallet drawer (kora-wallet-panel),
 *  not here — they're tied to the selected handle and only meaningful once connected. Build those
 *  with `portalUrl` / `personalizeUrl` / `subhandlesUrl` from the env module. */
export function koraNavLinks(opts: KoraLinkOptions = {}): KoraNavLink[] {
    const base = { env: opts.env, hostname: opts.hostname };
    return [
        { label: "Mint", href: siteUrl("mint", base), external: true },
        { label: "H.A.L.", href: siteUrl("hal", base), external: true },
        { label: "Merch", href: siteUrl("merch", base), external: true },
    ];
}

/** The standard footer links — all pointing back to handle.me / docs.handle.me. "Clear site data"
 *  has no href (an action; wire it to `clearHandleSiteData`). */
export function koraFooterLinks(opts: KoraLinkOptions = {}): KoraFooterLink[] {
    return [
        {
            label: "How to Integrate",
            href: siteUrl("docs", {
                ...opts,
                path: "/docs/Handles/4_Resolution#handle_resolution_overview",
            }),
            external: true,
        },
        { label: "Terms of use", href: siteUrl("portal", { ...opts, path: "/$/tou" }) },
        { label: "Verified integration", href: siteUrl("portal", { ...opts, path: "/#verified_integration" }) },
        { label: "Clear site data" },
    ];
}
