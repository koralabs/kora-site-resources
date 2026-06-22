/**
 * Pure markup for <kora-ipfs-image> — a single <img> the element drives through the shared IPFS
 * gateway failover. The SSR renderer seeds the first candidate URL so something paints before
 * hydration; the client then re-resolves via the tiered race and swaps in the first gateway that
 * actually loads.
 */
import { escapeAttr } from "../../../utils/html.js";
import { ipfsImageUrls } from "../../../ipfs/index.js";

export interface KoraIpfsImageProps {
    src: string;
    alt?: string;
    width?: number;
    class?: string;
}

export const IPFS_IMAGE_INNER = `<img class="kora-ipfs-image__img" data-ref="img" alt="">`;

export function renderKoraIpfsImage(props: KoraIpfsImageProps): string {
    const first = ipfsImageUrls(props.src, props.width)[0] ?? "";
    const cls = props.class ? ` class="${escapeAttr(props.class)}"` : "";
    const width = props.width ? ` width="${props.width}"` : "";
    const alt = escapeAttr(props.alt ?? "");
    const seeded = first ? ` src="${escapeAttr(first)}"` : "";
    return (
        `<kora-ipfs-image data-kora-ssr${cls} src="${escapeAttr(props.src)}"${width}>` +
        `<img class="kora-ipfs-image__img" alt="${alt}"${seeded}>` +
        `</kora-ipfs-image>`
    );
}
