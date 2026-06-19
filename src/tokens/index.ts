/**
 * Typed references to the design tokens defined in tokens.css. Use these from JS/TS so token
 * names are checked at compile time, e.g. `el.style.color = token.color.primary`.
 * Values are `var(--kora-*)` references, NOT raw colors — the CSS custom properties remain the
 * single source of truth, so theme overrides flow through automatically.
 */
export const token = {
    color: {
        bg: "var(--kora-color-bg)",
        surface: "var(--kora-color-surface)",
        surfaceRaised: "var(--kora-color-surface-raised)",
        text: "var(--kora-color-text)",
        textMuted: "var(--kora-color-text-muted)",
        textDisabled: "var(--kora-color-text-disabled)",
        primary: "var(--kora-color-primary)",
        primaryContrast: "var(--kora-color-primary-contrast)",
        accent: "var(--kora-color-accent)",
        danger: "var(--kora-color-danger)",
        border: "var(--kora-color-border)",
    },
    radius: {
        sm: "var(--kora-radius-sm)",
        md: "var(--kora-radius-md)",
        lg: "var(--kora-radius-lg)",
        pill: "var(--kora-radius-pill)",
    },
    font: {
        sans: "var(--kora-font-sans)",
        mono: "var(--kora-font-mono)",
    },
    motion: {
        durationFast: "var(--kora-duration-fast)",
        durationBase: "var(--kora-duration-base)",
        ease: "var(--kora-ease)",
    },
} as const;
