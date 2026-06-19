/**
 * koraToast — a tiny, framework-free toast controller (handle.me uses react-toastify; this replaces
 * it with no dependency). Lazily creates a fixed toaster region in <body> and renders glassmorphic,
 * type-aware toasts that auto-dismiss. Imperative + client-only:
 *
 *   koraToast.success("Minted!", { message: "Tx submitted" });
 *   const id = koraToast.error("Failed", { duration: 0 }); // 0 = sticky
 *   koraToast.dismiss(id);
 */
export type KoraToastType = "info" | "success" | "error" | "warning";

export interface KoraToastOptions {
    message?: string;
    type?: KoraToastType;
    /** Auto-dismiss after ms; 0 keeps it until dismissed. Default 5000. */
    duration?: number;
}

const ICONS: Record<KoraToastType, string> = {
    success:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
};

const TOASTER_CLASS = "kora-toaster";
let counter = 0;

function ensureToaster(): HTMLElement {
    const doc = globalThis.document;
    let toaster = doc.querySelector<HTMLElement>(`.${TOASTER_CLASS}`);
    if (!toaster) {
        toaster = doc.createElement("div");
        toaster.className = TOASTER_CLASS;
        toaster.setAttribute("role", "region");
        toaster.setAttribute("aria-label", "Notifications");
        toaster.setAttribute("aria-live", "polite");
        doc.body.appendChild(toaster);
    }
    return toaster;
}

function escape(text: string): string {
    return text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

function dismiss(id: string): void {
    const el = globalThis.document?.getElementById(id);
    if (!el) return;
    el.classList.remove("is-visible");
    const remove = (): void => el.remove();
    el.addEventListener("transitionend", remove, { once: true });
    // Fallback if no transition fires (e.g. reduced motion / test env).
    setTimeout(remove, 300);
}

function show(title: string, options: KoraToastOptions = {}): string {
    const type = options.type ?? "info";
    const duration = options.duration ?? 5000;
    const toaster = ensureToaster();
    const id = `kora-toast-${++counter}`;

    const el = globalThis.document.createElement("div");
    el.id = id;
    el.className = `kora-toast kora-toast--${type}`;
    el.setAttribute("role", type === "error" ? "alert" : "status");
    el.innerHTML =
        `<span class="kora-toast__icon" aria-hidden="true">${ICONS[type]}</span>` +
        `<div class="kora-toast__content">` +
        `<p class="kora-toast__title">${escape(title)}</p>` +
        (options.message ? `<p class="kora-toast__message">${escape(options.message)}</p>` : "") +
        `</div>` +
        `<button class="kora-toast__close" type="button" aria-label="Dismiss">&times;</button>`;
    el.querySelector(".kora-toast__close")?.addEventListener("click", () => dismiss(id));
    toaster.appendChild(el);

    // Next frame → trigger the enter transition.
    (globalThis.requestAnimationFrame ?? ((cb: FrameRequestCallback) => setTimeout(cb, 0)))(() =>
        el.classList.add("is-visible"),
    );

    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
}

export const koraToast = {
    show,
    dismiss,
    info: (title: string, opts: Omit<KoraToastOptions, "type"> = {}) => show(title, { ...opts, type: "info" }),
    success: (title: string, opts: Omit<KoraToastOptions, "type"> = {}) =>
        show(title, { ...opts, type: "success" }),
    error: (title: string, opts: Omit<KoraToastOptions, "type"> = {}) =>
        show(title, { ...opts, type: "error" }),
    warning: (title: string, opts: Omit<KoraToastOptions, "type"> = {}) =>
        show(title, { ...opts, type: "warning" }),
};
