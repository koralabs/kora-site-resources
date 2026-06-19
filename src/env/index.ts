/**
 * Environment-aware URL building for the handle.me ecosystem.
 *
 * The rule (from the apps' `getSubDomain()`): mainnet drops the prefix, preview/preprod prefix it —
 * `merch.handle.me` (mainnet) vs `preview.merch.handle.me` / `preprod.merch.handle.me`.
 *
 * Unlike the Next apps (which read NEXT_PUBLIC_NETWORK at build time), a framework-agnostic
 * component can't see build-time env vars. So we derive the environment at runtime from the host
 * the site is served on (it IS served from `preview.x.handle.me`), with an explicit override for
 * SSR or non-standard hosts.
 */
export type KoraNetwork = "mainnet" | "preview" | "preprod";

export const KORA_BASE_DOMAIN = "handle.me";

/** Derive the network from a hostname (defaults to the current document's host). */
export function getEnvironment(hostname?: string): KoraNetwork {
    const host = hostname ?? globalThis.location?.hostname ?? "";
    const first = host.split(".")[0]?.toLowerCase();
    return first === "preview" || first === "preprod" ? first : "mainnet";
}

/** "" for mainnet, else "preview." / "preprod." */
export function subdomainPrefix(env: KoraNetwork): string {
    return env === "mainnet" ? "" : `${env}.`;
}

export interface KoraUrlOptions {
    /** Subdomain label, e.g. "mint", "hal", "merch". Omit for the handle.me root. */
    sub?: string;
    path?: string;
    /** Force a network. Defaults to one derived from `hostname`. */
    env?: KoraNetwork;
    /** Hostname to derive the env from (for SSR). Defaults to the current document's host. */
    hostname?: string;
}

export function koraUrl(options: KoraUrlOptions = {}): string {
    const env = options.env ?? getEnvironment(options.hostname);
    const prefix = subdomainPrefix(env);
    const sub = options.sub ? `${options.sub}.` : "";
    return `https://${prefix}${sub}${KORA_BASE_DOMAIN}${options.path ?? ""}`;
}

/** Logical site → subdomain label ("" = the handle.me root / portal). */
export const KORA_SUBDOMAINS = {
    portal: "",
    mint: "mint",
    hal: "hal",
    marketplace: "marketplace",
    merch: "merch",
    auth: "auth",
    docs: "docs",
    bff: "bff",
    api: "api",
} as const;

export type KoraSite = keyof typeof KORA_SUBDOMAINS;

export interface KoraSiteUrlOptions {
    path?: string;
    env?: KoraNetwork;
    hostname?: string;
}

export function siteUrl(site: KoraSite, opts: KoraSiteUrlOptions = {}): string {
    return koraUrl({ sub: KORA_SUBDOMAINS[site] || undefined, ...opts });
}

/* Handle-scoped portal routes (all live on the handle.me root). */
export function portalUrl(handle: string, opts: KoraSiteUrlOptions = {}): string {
    return siteUrl("portal", { ...opts, path: `/${handle}` });
}
export function personalizeUrl(handle: string, opts: KoraSiteUrlOptions = {}): string {
    return siteUrl("portal", { ...opts, path: `/~/${handle}/personalization` });
}
export function subhandlesUrl(handle: string, opts: KoraSiteUrlOptions = {}): string {
    return siteUrl("portal", { ...opts, path: `/~/${handle}/subhandles` });
}
