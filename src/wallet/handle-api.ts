/**
 * Handle-API adapter — fetches ALL handles held by a stake key (regular handles, NFT subhandles,
 * and *virtual* subhandles) from the public Ada Handle API. Verified live: it accepts the hex
 * reward address that CIP-30's `getRewardAddresses()` returns AS-IS via `?type=stakekeyhash`, so
 * there is NO bech32 / address-encoding step and NO extra dependency — just `fetch`.
 *
 * The endpoint is public + CORS-open; unauthenticated calls are rate-limited to 5 req/sec/IP, which
 * is ample for a once-per-connect lookup (the WalletStore exposes the needed `rewardAddressHex`).
 */
import { siteUrl } from "../env/index.js";
import type { KoraNetwork } from "../env/index.js";
import { HANDLE_POLICY_DEMI } from "./policies.js";

export type ApiHandleType = "handle" | "nft_subhandle" | "virtual_subhandle";

/** A handle as returned by the Ada Handle API (the subset we use). */
export interface ApiHandle {
    name: string;
    handle_type: ApiHandleType;
    policy?: string;
    hex?: string;
    holder?: string;
    resolved_addresses?: { ada?: string; [key: string]: string | undefined };
    image?: string;
}

export interface FetchWalletHandlesOptions {
    env?: KoraNetwork;
    hostname?: string;
    /** Override the API base URL (default: env-aware https://{env}api.handle.me). */
    baseUrl?: string;
    /** Page size; the API caps JSON results at 250 (MAX_PAGINATED_RESULTS). */
    pageSize?: number;
    /** Safety bound on pages fetched (default 40 → up to 10k handles). */
    maxPages?: number;
    signal?: AbortSignal;
}

/** The API's MAX_PAGINATED_RESULTS — the most JSON handle objects it returns per request. */
export const HANDLE_API_MAX_PAGE = 250;

/**
 * Fetch every handle held by the wallet, from the Ada Handle API, using the hex reward address
 * straight from CIP-30 (`walletStore.state.rewardAddressHex`). Returns [] for empty input.
 *
 * The API caps a JSON response at 250 handles, so this paginates: request 250/page until the full
 * set is gathered. Two stop signals, so it's correct under both the current API and the planned fix:
 *   - the `x-handles-search-total` header — used as the authoritative grand total ONCE it's
 *     trustworthy (a value exceeding a single page's size, which the current page-count quirk can
 *     never produce; the team is fixing the header to always report the grand total); and
 *   - a short page, as the fallback when no trustworthy total is seen.
 * Trusting the total also guards the edge where a full page of names yields fewer JSON objects (the
 * API drops handles without a UTxO), which a short-page-only rule would mistake for the last page.
 * A handful of users hold >250 handles; everyone else resolves in a single request.
 */
export async function fetchWalletHandles(
    rewardAddressHex: string | null | undefined,
    opts: FetchWalletHandlesOptions = {},
): Promise<ApiHandle[]> {
    if (!rewardAddressHex) return [];
    const base = opts.baseUrl ?? siteUrl("api", { env: opts.env, hostname: opts.hostname });
    const pageSize = opts.pageSize ?? HANDLE_API_MAX_PAGE;
    const maxPages = opts.maxPages ?? 40;

    const all: ApiHandle[] = [];
    let grandTotal: number | null = null;
    for (let page = 1; page <= maxPages; page++) {
        const url = `${base}/handles/list?type=stakekeyhash&records_per_page=${pageSize}&page=${page}`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify([rewardAddressHex]),
            ...(opts.signal ? { signal: opts.signal } : {}),
        });
        if (!res.ok) throw new Error(`Handle API responded ${res.status}`);
        const json: unknown = await res.json();
        const batch = Array.isArray(json) ? (json as ApiHandle[]) : [];
        all.push(...batch);

        // Only trust the header as a grand total once it exceeds a single page's returned count —
        // the current page-count value can never do that, so this stays correct pre- and post-fix.
        const reported = Number(res.headers?.get?.("x-handles-search-total"));
        if (Number.isFinite(reported) && reported > batch.length) grandTotal = reported;

        if (grandTotal != null) {
            if (all.length >= grandTotal) break; // authoritative: we have the full set
        } else if (batch.length < pageSize) {
            break; // fallback: short page ⇒ last page
        }
    }
    return all;
}

export function isSubHandle(handle: ApiHandle): boolean {
    return handle.handle_type !== "handle";
}

export function isVirtualSubHandle(handle: ApiHandle): boolean {
    return handle.handle_type === "virtual_subhandle";
}

export function isDeMiHandle(handle: ApiHandle): boolean {
    return handle.policy === HANDLE_POLICY_DEMI;
}
