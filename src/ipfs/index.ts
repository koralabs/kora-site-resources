/**
 * Shared IPFS image failover — gateway config + the tiered resolver. Pair with the
 * `<kora-ipfs-image>` component (components/media/kora-ipfs-image) for a drop-in failover <img>.
 */
export {
    DEFAULT_IPFS_CONFIG,
    configureKoraIpfs,
    resetKoraIpfsConfig,
    getKoraIpfsConfig,
} from "./gateways.js";
export type { IpfsGateway, IpfsConfig } from "./gateways.js";
export {
    extractIpfsCid,
    gatewayUrl,
    ipfsImageUrls,
    raceImageLoad,
    resolveIpfsImage,
} from "./resolve.js";
export type { ImageProbe } from "./resolve.js";
