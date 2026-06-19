/** Pure markup for <kora-loader> — the dual-rotating-ring spinner from handle.me, in pure CSS. */
export interface KoraLoaderState {
    size: number;
}

export interface KoraLoaderProps {
    /** Diameter in px. Default 48. */
    size?: number;
    label?: string;
}

export function loaderInnerHTML(_state: KoraLoaderState): string {
    return (
        `<span class="kora-loader__ring kora-loader__ring--outer"></span>` +
        `<span class="kora-loader__ring kora-loader__ring--inner"></span>`
    );
}

export function renderKoraLoader(props: KoraLoaderProps = {}): string {
    const size = props.size ?? 48;
    const label = props.label ?? "Loading";
    const state: KoraLoaderState = { size };
    return (
        `<kora-loader data-kora-ssr size="${size}" role="status" aria-label="${label}" style="--kora-loader-size:${size}px">` +
        loaderInnerHTML(state) +
        `</kora-loader>`
    );
}
