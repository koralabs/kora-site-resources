/**
 * Re-export of the full Lucide icon catalog, so a site can pull ANY Lucide icon through this
 * package — no separate `lucide` install — and register it:
 *
 *   import { registerKoraIcons } from "@koralabs/kora-site-resources/icons";
 *   import { heart, star } from "@koralabs/kora-site-resources/icons/lucide";
 *   registerKoraIcons({ heart, star });
 *
 * A bundler tree-shakes this to just the icons imported. (No-bundler/native-ESM consumers importing
 * from here need an import map entry for "lucide", like the cborg one — or use the curated set.)
 */
export * from "lucide";
