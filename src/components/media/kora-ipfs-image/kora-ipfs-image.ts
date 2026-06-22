import { KoraElement } from "../../base/kora-element.js";
import { IPFS_IMAGE_INNER } from "./template.js";
import { resolveIpfsImage } from "../../../ipfs/index.js";

/**
 * <kora-ipfs-image src="ipfs://CID" width="64" alt="…"> — a drop-in <img> that runs the shared
 * IPFS gateway failover (components resolve through every configured gateway and use the first that
 * loads). Re-resolves on `src`/`width` change; sets `data-error` and fires `kora-ipfs-error` if no
 * gateway serves the CID, and fires `kora-ipfs-load` once an image paints. Configure the gateway
 * list/proxy once per app via `configureKoraIpfs()`.
 */
export class KoraIpfsImage extends KoraElement {
    static get observedAttributes(): string[] {
        return ["src", "width", "alt", "nftcdn-url"];
    }

    #img: HTMLImageElement | null = null;
    #token = 0;

    protected override template(): string {
        return IPFS_IMAGE_INNER;
    }

    protected override hydrate(): void {
        this.#img = this.querySelector<HTMLImageElement>("[data-ref=img], .kora-ipfs-image__img");
        this.#img?.addEventListener("load", () => {
            if (this.#img?.getAttribute("src")) this.#emit("load");
        });
        void this.#load();
    }

    override attributeChangedCallback(name: string, _old: string | null, _value: string | null): void {
        if (this.#img && (name === "src" || name === "width" || name === "alt" || name === "nftcdn-url"))
            void this.#load();
    }

    async #load(): Promise<void> {
        const img = this.#img;
        if (!img) return;
        img.alt = this.getAttribute("alt") ?? "";
        const src = this.getAttribute("src");
        const width = Number(this.getAttribute("width")) || undefined;
        const nftcdnUrl = this.getAttribute("nftcdn-url") || undefined;
        const token = ++this.#token; // guards against an earlier resolution finishing after a newer src
        this.removeAttribute("data-error");
        if (!src && !nftcdnUrl) {
            img.removeAttribute("src");
            return;
        }
        const resolved = await resolveIpfsImage(src, { width, nftcdnUrl });
        if (token !== this.#token) return; // superseded
        if (resolved) {
            if (img.getAttribute("src") !== resolved) img.src = resolved;
        } else {
            img.removeAttribute("src");
            this.setAttribute("data-error", "");
            this.#emit("error");
        }
    }

    #emit(kind: "load" | "error"): void {
        this.dispatchEvent(new CustomEvent(`kora-ipfs-${kind}`, { bubbles: true, composed: true }));
    }
}

customElements.define("kora-ipfs-image", KoraIpfsImage);

declare global {
    interface HTMLElementTagNameMap {
        "kora-ipfs-image": KoraIpfsImage;
    }
}
