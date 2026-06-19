// Importing this registers <kora-icon> and seeds the curated default icon set.
import "./kora-icon.js";

export { KoraIcon } from "./kora-icon.js";
export { iconSVG, renderKoraIcon } from "./render.js";
export {
    registerKoraIcons,
    getKoraIcon,
    hasKoraIcon,
    koraIconNames,
} from "./registry.js";
export type { IconNode, IconChild, IconAttrs } from "./registry.js";
