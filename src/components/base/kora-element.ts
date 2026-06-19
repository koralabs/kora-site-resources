/**
 * KoraElement — the vanilla custom-element base for the Kora / Ada Handle component library.
 *
 * NO FRAMEWORK. Reactivity is assembled from native platform primitives only:
 *
 *   1. Proxy + Reflect wrap `state`, so ordinary mutation (`this.state.x = 1`) is observable.
 *      The `set`/`deleteProperty` traps forward the real operation via Reflect (preserving
 *      correct receiver semantics) and then schedule a render.
 *   2. A `<template>`-derived light-DOM tree whose dynamic nodes are captured once as refs in
 *      hydrate(); update() writes to those refs directly. No diffing engine, no re-parse.
 *
 * LIGHT DOM by default (renderRoot === this) so server-rendered HTML hydrates trivially, host
 * CSS / design tokens apply without piercing a shadow boundary, forms participate natively, and
 * ARIA IDREF associations are not severed. Shadow DOM is reserved for client-only widgets that
 * subclass and override `renderRoot`.
 *
 * SSR CONTRACT: attributes are the single source of truth. The server renders inner markup that
 * matches what template() + update() would produce for those same attributes, and tags the host
 * with the SSR marker attribute. On the client the element ADOPTS that markup (wires refs, runs
 * one idempotent update()) instead of re-rendering — so there is no flicker and no clobbering.
 * An element created client-side (no marker) renders fresh from template().
 */

/** Host attribute the server sets to signal "I already rendered this element's children." */
export const SSR_MARKER = 'data-kora-ssr';

export abstract class KoraElement<S extends object = Record<string, unknown>> extends HTMLElement {
    protected readonly state: S;
    #scheduled = false;
    #connected = false;
    #initialized = false;

    constructor() {
        super();
        this.state = this.#reactive(this.initialState());
    }

    /** Reactive state shape + defaults. Override to declare fields. */
    protected initialState(): S {
        return {} as S;
    }

    /** Inner HTML for a fresh (client-side) first render. Must match what the SSR
     *  renderer emits for equivalent attributes so adoption is seamless. */
    protected abstract template(): string;

    /** Capture node refs and attach event listeners once, against whichever DOM exists
     *  (freshly rendered OR adopted from SSR). */
    protected hydrate(): void {}

    /** Apply current state to the DOM through captured refs. MUST be idempotent and MUST
     *  mutate existing nodes (never replace them) so SSR adoption stays seamless. */
    protected update(): void {}

    /** Render target. Light DOM by default; a client-only widget may override to a shadow root. */
    protected get renderRoot(): Element | ShadowRoot {
        return this;
    }

    /** Override to true for composition components that host app-provided children. When set,
     *  authored children are captured before the fresh render and re-projected into the template's
     *  mount points: an element with `slot="x"` goes to `[data-kora-slot="x"]`, everything else to
     *  `[data-kora-content]`. (On SSR adoption the server already placed them, so we skip this.) */
    protected get preservesChildren(): boolean {
        return false;
    }

    /** Wrap a plain object so writes schedule a batched re-render. This is the entire
     *  "change detection" half of reactivity — no setters, no framework. */
    #reactive<T extends object>(obj: T): T {
        const schedule = () => this.#schedule();
        return new Proxy(obj, {
            set(target, key, value, receiver) {
                const prev = Reflect.get(target, key, receiver);
                const ok = Reflect.set(target, key, value, receiver);
                if (ok && !Object.is(prev, value)) schedule();
                return ok;
            },
            deleteProperty(target, key) {
                const existed = Reflect.has(target, key);
                const ok = Reflect.deleteProperty(target, key);
                if (ok && existed) schedule();
                return ok;
            },
        });
    }

    /** Coalesce any number of synchronous mutations into a single microtask-deferred update(). */
    #schedule(): void {
        if (this.#scheduled || !this.#connected) return;
        this.#scheduled = true;
        queueMicrotask(() => {
            this.#scheduled = false;
            if (this.#connected) this.update();
        });
    }

    connectedCallback(): void {
        this.#connected = true;
        if (!this.#initialized) {
            // Hydration, in full: adopt server markup when the SSR marker is present;
            // otherwise this element was created client-side, so render fresh.
            if (this.hasAttribute(SSR_MARKER)) {
                this.removeAttribute(SSR_MARKER);
            } else {
                const preserved = this.preservesChildren ? Array.from(this.childNodes) : null;
                this.renderRoot.innerHTML = this.template();
                if (preserved) this.#projectChildren(preserved);
            }
            this.hydrate();
            this.#initialized = true;
        }
        this.update();
    }

    disconnectedCallback(): void {
        this.#connected = false;
    }

    /** Re-project captured authored children into the freshly rendered template's mount points. */
    #projectChildren(nodes: ChildNode[]): void {
        const root = this.renderRoot;
        const fallback = root.querySelector("[data-kora-content]") ?? root;
        for (const node of nodes) {
            const slot = node instanceof Element ? node.getAttribute("slot") : null;
            const target = (slot && root.querySelector(`[data-kora-slot="${slot}"]`)) || fallback;
            target.append(node);
        }
    }

    /** Default attribute→state bridge: mirrors the raw attribute value into state under a
     *  camelCased key. Override for typed parsing (booleans, numbers, enums). */
    attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        (this.state as Record<string, unknown>)[kebabToCamel(name)] = value;
    }
}

function kebabToCamel(s: string): string {
    return s.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
}
