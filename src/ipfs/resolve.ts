/**
 * Shared IPFS image failover — the framework-agnostic version of handle.me's gateway race. Given an
 * `ipfs://…` (or already-https) source it builds candidate URLs across the configured gateways and
 * resolves to the first that actually loads, by tier: our gateways (raced in parallel) → free public
 * gateways (raced) → an optional server proxy. Image load/error events fire regardless of CORS, so
 * the parallel `Image()` probe works as a pure client-side check with no server involvement.
 */
import { getKoraIpfsConfig, type IpfsGateway } from "./gateways.js";

const IPFS_PREFIX = /^ipfs:\/\/(?:ipfs\/)?/;
const IPFS_PATH = /^https?:\/\/[^/]+\/ipfs\/(.+)$/;
const HTTP = /^https?:\/\//;

/** Pull the CID out of an `ipfs://CID`, `ipfs://ipfs/CID`, or `https://gw/ipfs/CID` source. */
export function extractIpfsCid(src: string): string | null {
    if (IPFS_PREFIX.test(src)) return src.replace(IPFS_PREFIX, "");
    const match = src.match(IPFS_PATH);
    return match ? match[1]! : null;
}

/** Build the URL for one gateway, applying its per-gateway quirks (access token, resize query). */
export function gatewayUrl(gateway: IpfsGateway, cid: string, width: number): string {
    const params: string[] = [];
    if (gateway.token) params.push(`pinataGatewayToken=${gateway.token}`);
    if (gateway.resize) params.push(`img-width=${width}`);
    const query = params.length ? `?${params.join("&")}` : "";
    return `${gateway.base}/ipfs/${cid}${query}`;
}

/**
 * Ordered candidate URLs for a source (our gateways → free gateways → proxy). A non-IPFS https
 * source returns just itself; an unrecognized source returns []. Useful for SSR (use the first) or
 * a sequential `<img onerror>` fallback.
 */
export function ipfsImageUrls(src: string | null | undefined, width?: number): string[] {
    if (!src) return [];
    const cfg = getKoraIpfsConfig();
    const w = width ?? cfg.width;
    const cid = extractIpfsCid(src);
    if (!cid) return HTTP.test(src) ? [src] : [];
    const urls = [...cfg.ourGateways, ...cfg.freeGateways].map((g) => gatewayUrl(g, cid, w));
    if (cfg.proxy) urls.push(cfg.proxy(cid, w));
    return urls;
}

export type ImageProbe = (urls: string[], timeoutMs: number) => Promise<string | null>;

/** Race the given URLs via parallel `Image()` loads; resolve the first that loads, else null. */
export const raceImageLoad: ImageProbe = (urls, timeoutMs) =>
    new Promise((resolve) => {
        const ImageCtor = (globalThis as { Image?: new () => HTMLImageElement }).Image;
        if (urls.length === 0 || typeof ImageCtor !== "function") {
            resolve(null);
            return;
        }
        let settled = false;
        let remaining = urls.length;
        const images: HTMLImageElement[] = [];
        const finish = (result: string | null): void => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            for (const img of images) {
                img.onload = null;
                img.onerror = null;
                img.src = ""; // abort in-flight loads
            }
            resolve(result);
        };
        const timer = setTimeout(() => finish(null), timeoutMs);
        for (const url of urls) {
            const img = new ImageCtor();
            images.push(img);
            img.onload = () => finish(url);
            img.onerror = () => {
                remaining -= 1;
                if (remaining === 0) finish(null);
            };
            img.src = url;
        }
    });

/**
 * Resolve an IPFS (or direct https) image source to a working URL via the tiered gateway failover.
 * Returns null if nothing loads. `probe` is injectable for tests. Browser-only (uses `Image()`);
 * on the server, use `ipfsImageUrls()` and emit the first candidate.
 */
export async function resolveIpfsImage(
    src: string | null | undefined,
    { width, probe = raceImageLoad }: { width?: number; probe?: ImageProbe } = {},
): Promise<string | null> {
    if (!src) return null;
    const cfg = getKoraIpfsConfig();
    const w = width ?? cfg.width;
    const cid = extractIpfsCid(src);
    if (!cid) return HTTP.test(src) ? src : null;

    const our = cfg.ourGateways.map((g) => gatewayUrl(g, cid, w));
    const free = cfg.freeGateways.map((g) => gatewayUrl(g, cid, w));
    let winner = await probe(our, cfg.ourTimeoutMs);
    if (!winner) winner = await probe(free, cfg.freeTimeoutMs);
    if (!winner && cfg.proxy) winner = await probe([cfg.proxy(cid, w)], cfg.proxyTimeoutMs);
    return winner;
}
