/**
 * Clear handle.me site data, as the handle.me footer does — plus IndexedDB and shared-domain
 * cookies.
 *
 * Cross-subdomain reality: the browser's same-origin policy makes it IMPOSSIBLE for JS on
 * `merch.handle.me` to clear `preview.hal.handle.me`'s localStorage / sessionStorage / caches —
 * those are origin-scoped. What CAN be cleared cross-subdomain are cookies scoped to the shared
 * parent domain (`.handle.me`), which this does. True cross-subdomain storage wipe would require
 * each subdomain to clear its own (e.g. a hidden-iframe broadcast to a shared clear page); that's
 * a deliberate future addition, not something achievable from one origin.
 */
export interface ClearSiteDataOptions {
    /** Also expire cookies scoped to the shared parent domain (.handle.me). Default true. */
    cookies?: boolean;
    /** Navigate here when done. Pass null to stay on the page. Default "/". */
    redirectTo?: string | null;
}

export async function clearHandleSiteData(options: ClearSiteDataOptions = {}): Promise<void> {
    const { cookies = true, redirectTo = "/" } = options;

    // Service-worker / fetch caches.
    if (globalThis.caches) {
        const names = await globalThis.caches.keys();
        await Promise.all(names.map((name) => globalThis.caches.delete(name)));
    }

    // Web storage — current origin only (same-origin policy; see file header).
    globalThis.localStorage?.clear();
    globalThis.sessionStorage?.clear();

    // IndexedDB, best-effort (databases() isn't supported everywhere).
    await clearIndexedDb();

    // Cookies scoped to the shared parent domain — these ARE cross-subdomain.
    if (cookies) clearSharedDomainCookies();

    if (redirectTo !== null && globalThis.location) {
        globalThis.location.href = redirectTo;
    }
}

async function clearIndexedDb(): Promise<void> {
    const idb = globalThis.indexedDB as
        | (IDBFactory & { databases?: () => Promise<{ name?: string }[]> })
        | undefined;
    if (!idb?.databases) return;
    try {
        const dbs = await idb.databases();
        await Promise.all(
            dbs.map(
                (db) =>
                    new Promise<void>((resolve) => {
                        if (!db.name) return resolve();
                        const req = idb.deleteDatabase(db.name);
                        req.onsuccess = req.onerror = req.onblocked = () => resolve();
                    }),
            ),
        );
    } catch {
        /* non-fatal */
    }
}

function clearSharedDomainCookies(): void {
    const doc = globalThis.document;
    if (!doc) return;
    const parent = registrableDomain(globalThis.location?.hostname ?? "");
    const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
    for (const pair of doc.cookie.split(";")) {
        const name = pair.split("=")[0]?.trim();
        if (!name) continue;
        doc.cookie = `${name}=;path=/;${expired}`;
        if (parent) doc.cookie = `${name}=;path=/;domain=.${parent};${expired}`;
    }
}

/** "preview.merch.handle.me" → "handle.me" (the shared, cookie-able parent domain). */
function registrableDomain(hostname: string): string {
    const labels = hostname.split(".");
    return labels.length >= 2 ? labels.slice(-2).join(".") : hostname;
}
