/**
 * Pure markup for <kora-background> — the layered page backdrop distilled from hal.handle.me:
 * a dark base, an optional grid texture, a top-down gradient veil, and soft blurred accent blobs.
 *
 * The site-specific 3D/canvas content (e.g. HAL's GLB model) is NOT part of this — render that in
 * your own fixed layer in front. The grid IMAGE is app-provided via the `--kora-bg-grid-image`
 * custom property, so this package ships no binary assets.
 */
export interface KoraBackgroundState {
    grid: boolean;
}

export interface KoraBackgroundProps {
    /** Show the grid texture layer (requires --kora-bg-grid-image to be set). Default false. */
    grid?: boolean;
}

export function backgroundInnerHTML(_state: KoraBackgroundState): string {
    // The grid layer is always present; its visibility is driven by the host's `grid` attribute
    // in CSS, so toggling it never restructures the DOM.
    return (
        `<div class="kora-bg" aria-hidden="true">` +
        `<div class="kora-bg__grid"></div>` +
        `<div class="kora-bg__gradient"></div>` +
        `<span class="kora-bg__blob kora-bg__blob--cyan"></span>` +
        `<span class="kora-bg__blob kora-bg__blob--green"></span>` +
        `</div>`
    );
}

export function renderKoraBackground(props: KoraBackgroundProps = {}): string {
    const state: KoraBackgroundState = { grid: !!props.grid };
    const attrs = ["data-kora-ssr"];
    if (state.grid) attrs.push("grid");
    return `<kora-background ${attrs.join(" ")}>${backgroundInnerHTML(state)}</kora-background>`;
}
