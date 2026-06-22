/**
 * IPFS gateway configuration for the shared image-failover used across Kora sites. Defaults mirror
 * handle.me's PUBLIC gateways (no secrets): Filebase primary, then free public gateways. A site can
 * extend this with its own dedicated gateway (+ access token) and/or a server-side proxy via
 * `configureKoraIpfs()` — so the failover behaviour is centralized here but tunable per deployment.
 */
export interface IpfsGateway {
    /** Gateway origin, no trailing slash — e.g. "https://public-handles.myfilebase.com". */
    base: string;
    /** Append the on-the-fly resize query (?img-width=…). Supported by Filebase + dedicated Pinata. */
    resize?: boolean;
    /** Dedicated-gateway access token (e.g. Pinata), appended as `pinataGatewayToken=…`. */
    token?: string;
}

export interface IpfsConfig {
    /** Primary gateways, probed first (raced in parallel — first responder wins). */
    ourGateways: IpfsGateway[];
    /** Free public gateways, probed second if the primaries miss. */
    freeGateways: IpfsGateway[];
    /** Optional last-resort server proxy that resolves a CID server-side: (cid, width) => url. */
    proxy: ((cid: string, width: number) => string) | null;
    /** Default resize width in px for gateways that support it. */
    width: number;
    ourTimeoutMs: number;
    freeTimeoutMs: number;
    proxyTimeoutMs: number;
}

/** The shipped defaults: handle.me's public Filebase gateway, then the free public gateways. */
export const DEFAULT_IPFS_CONFIG: IpfsConfig = {
    ourGateways: [{ base: "https://public-handles.myfilebase.com", resize: true }],
    freeGateways: [
        { base: "https://ipfs.io" },
        { base: "https://dweb.link" },
        { base: "https://w3s.link" },
    ],
    proxy: null,
    width: 512,
    ourTimeoutMs: 8000,
    freeTimeoutMs: 10000,
    proxyTimeoutMs: 12000,
};

let config: IpfsConfig = { ...DEFAULT_IPFS_CONFIG };

/**
 * Override the IPFS failover config — e.g. a site adds its dedicated gateway + token and a BFF
 * proxy: `configureKoraIpfs({ ourGateways: [{ base, resize: true }, { base, token }], proxy })`.
 * Merges shallowly onto the current config.
 */
export function configureKoraIpfs(patch: Partial<IpfsConfig>): void {
    config = { ...config, ...patch };
}

/** Reset to the shipped defaults (mainly for tests). */
export function resetKoraIpfsConfig(): void {
    config = { ...DEFAULT_IPFS_CONFIG };
}

export function getKoraIpfsConfig(): IpfsConfig {
    return config;
}
