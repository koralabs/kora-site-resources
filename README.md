# @koralabs/kora-site-resources

Framework-agnostic web components, design tokens, and wallet UX shared across Kora Labs / Ada
Handle websites. **No framework** — vanilla custom elements built on native ECMAScript/web-platform
primitives. Drops into React, Lit, or plain HTML identically, and server-renders cleanly.

This package replaces the two earlier shared-component packages:

- `@koralabs/handles-shared-components` (React)
- `@koralabs/handles-shared-lit-components` (Lit)

See [docs/architecture.md](docs/architecture.md) for the design decisions and rationale.

## Pillars

1. **Design tokens / theme** — the visual identity, as CSS custom properties (`tokens.css`),
   reconciled from the live handle.me + hal.handle.me palettes. Plus the **aero/glass** recipe
   (`styles/glass.css`).
2. **Shared shell** — `kora-header` (configurable `$handle` → `$H.A.L.` branding), `kora-footer`,
   `kora-background` (gradient + grid + accent blobs), and the opt-in `kora-drawer`.
3. **Wallet layer** — `kora-handle-indicator` (the chosen-handle pill) today; CIP-30 connection +
   a framework-agnostic reactive wallet store next (seeded from the existing `walletConnector.ts`).

## Components

| Element | Source | Notes |
| --- | --- | --- |
| `kora-button` | primitives | variants, loading/disabled |
| `kora-brand` | handle.me logo | `$handle` default; `label` rebrands (e.g. `H.A.L.`) |
| `kora-header` | handle.me | brand + slotted nav + `slot="actions"` |
| `kora-menu` | handle.me | "Resources" hamburger; shared default links + site extras |
| `kora-footer` | handle.me | slotted links, CSS pipe dividers |
| `kora-background` | hal.handle.me | dark gradient + optional grid + blur blobs |
| `kora-handle-indicator` | handle.me | chosen-handle pill, emits `click` |
| `kora-wallet-button` | handle.me | connect picker → connecting → connected indicator (WalletStore) |
| `kora-wallet-panel` | handle.me | drawer body: profile, View Portal/Personalize/SubHandles, search, handle list + badges |
| `kora-drawer` | handle.me | opt-in slide-out panel, `open` attr, `kora-drawer-close` event |
| `.kora-glass*` | hal.handle.me | frosted-glass utility classes |

Plus non-visual modules: `/env` (environment-aware handle.me URLs), `/wallet` (CIP-30 + reactive
`WalletStore` + auto-reconnect), `/wallet/handles` (resolve on-chain Ada Handles from the CIP-30
balance, offline/trustless), `/wallet/handle-api` (`fetchWalletHandles` — the full list incl. virtual
SubHandles from the Ada Handle API, no extra deps), and `clearHandleSiteData()`.

## How it works (no framework)

- **Custom elements** are the unit of reuse — React, Lit, and vanilla all consume them natively.
- **Reactivity** = `Proxy`/`Reflect` (observe state mutation) + a `<template>`-cloned tree whose
  dynamic nodes are captured once and updated in place (no diffing engine).
- **Light DOM by default** so SSR and hydration are trivial and host CSS / tokens apply directly.
  Shadow DOM is reserved for client-only interactive widgets.
- **Theming via tokens + CSS cascade layers** (`@layer`) — the encapsulation strategy that
  replaces shadow DOM for light-DOM components.

## Usage

```html
<!-- import order: layers → tokens → component styles -->
<link rel="stylesheet" href="@koralabs/kora-site-resources/styles/layers.css" />
<link rel="stylesheet" href="@koralabs/kora-site-resources/tokens.css" />
```

```js
// Client: registers the custom elements
import "@koralabs/kora-site-resources";

// or a single component
import "@koralabs/kora-site-resources/components/primitives/kora-button";
```

```js
// Server (Node): pure string renderers, no DOM. The client adopts this markup.
import { renderKoraButton } from "@koralabs/kora-site-resources/ssr";
const html = renderKoraButton({ label: "Mint", variant: "primary" });
```

## Develop

```bash
npm install
npm run build   # tsc → lib/, then copies *.css assets
npm test        # builds, then runs node --test under a happy-dom global
npm run demo    # builds, then serves a sample SSR home page at http://localhost:8088
```

The demo (`demo/server.mjs`, vanilla Node, no deps) server-renders a home page with every
component via the `/ssr` entry and serves the compiled package so it hydrates in the browser —
a working reference for how to consume the library in an SSR site.
