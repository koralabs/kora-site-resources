/** Minimal HTML escaping for server-side string rendering. Vanilla, dependency-free. */

const TEXT: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
const ATTR: Record<string, string> = { ...TEXT, '"': '&quot;' };

/** Escape a string for use as element text content. */
export function escapeHtml(value: string): string {
    return value.replace(/[&<>]/g, (c) => TEXT[c]!);
}

/** Escape a string for use inside a double-quoted attribute value. */
export function escapeAttr(value: string): string {
    return value.replace(/[&<>"]/g, (c) => ATTR[c]!);
}
