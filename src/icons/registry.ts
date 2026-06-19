/**
 * The canonical icon registry. Names map to icon data in Lucide's shape — an array of SVG-child
 * tuples `["path", { d: "…" }]` — so a Lucide icon export can be registered as-is. The curated
 * default set is seeded here; `registerKoraIcons` adds more (e.g. from
 * "@koralabs/kora-site-resources/icons/lucide" or your own SVGs).
 */
export type IconAttrs = Record<string, string | number>;
export type IconChild = ReadonlyArray<string | IconAttrs>; // [tag, attrs]
export type IconNode = ReadonlyArray<IconChild>;

const registry = new Map<string, IconNode>();

/** Register icons by name (kebab-case recommended). Existing names are overwritten. */
export function registerKoraIcons(icons: Record<string, IconNode>): void {
    for (const [name, node] of Object.entries(icons)) registry.set(name, node);
}

export function getKoraIcon(name: string): IconNode | undefined {
    return registry.get(name);
}

export function hasKoraIcon(name: string): boolean {
    return registry.has(name);
}

/** All currently-registered icon names. */
export function koraIconNames(): string[] {
    return [...registry.keys()];
}

// Seed the curated default set (vendored data — no dependency).
import { CURATED_ICONS } from "./curated.js";
registerKoraIcons(CURATED_ICONS);
