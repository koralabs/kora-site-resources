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
| `kora-footer` | handle.me | renders shared default links + appends site links; built-in Clear-site-data action; `default-links="false"` to opt out |
| `kora-background` | hal.handle.me | dark gradient + optional grid + blur blobs |
| `kora-handle-indicator` | handle.me | chosen-handle pill, emits `click` |
| `kora-wallet-button` | handle.me | connect picker → connecting → connected indicator (WalletStore); shows the auto-selected `$handle`; clicking the pill dispatches `kora-wallet-open` |
| `kora-wallet-panel` | handle.me | drawer body, **self-populating**: on connect the store resolves the wallet's handles (images via gateway failover) + friendly `addr1…`; profile, actions, search, handle list + badges. Opens its `<kora-drawer>` on `kora-wallet-open`. Fires `kora-handle-select` `{name, previous, source}` on any selection change (user or auto) |
| `kora-ipfs-image` | handle.me | `<img>` with the shared IPFS gateway failover (our → free → optional proxy); `<kora-ipfs-image src="ipfs://…" width="64">` |
| `kora-drawer` | handle.me | opt-in slide-out panel, `open` attr, `kora-drawer-close` event |
| `kora-modal` | handle.me | centered dialog shell (glass + gradient top border) |
| `kora-loader` | handle.me | dual-ring spinner |
| `kora-tooltip` | handle.me | positional hover/focus tooltip (pure CSS) |
| `koraToast` | handle.me | imperative glass toast controller (no react-toastify) |
| `kora-checkbox` / `kora-radio` / `kora-switch` / `kora-input` | handle.me | form controls over native inputs (form-participating) |
| `kora-select` | handle.me | custom dropdown + hidden input for form submission |
| `kora-tabs` | handle.me | segmented control, `kora-tab-change` event |
| `kora-collapsible` | handle.me | accordion (CSS grid-rows height animation) |
| `kora-icon` | Lucide | canonical icon: `<kora-icon name="wallet" size="20">`, currentColor, curated set built in; register more from `/icons/lucide` (no separate install) |
| `.kora-glass*` | hal.handle.me | frosted-glass utility classes |
| `.kora-scrollbar` / `.kora-focus-ring` / `.kora-inset-shadow*` | handle.me | style utilities (`styles/utilities.css`) |

Plus non-visual modules: `/env` (environment-aware handle.me URLs), `/wallet` (CIP-30 + reactive
`WalletStore` that auto-reconnects AND auto-resolves the wallet's handles + a friendly `addr1…`
address on connect), `/wallet/handles` (resolve on-chain Ada Handles from the CIP-30 balance,
offline/trustless), `/wallet/handle-api` (`fetchWalletHandles` — the full list incl. virtual
SubHandles from the Ada Handle API, no extra deps), `/ipfs` (shared gateway-failover image resolver
+ `configureKoraIpfs()`), and `clearHandleSiteData()`.

### Wallet UX is turnkey

Drop the wallet button + panel in and the kit wires the rest — no app glue:

```html
<kora-wallet-button slot="actions"></kora-wallet-button>
<kora-drawer title="Wallet & Handles"><kora-wallet-panel></kora-wallet-panel></kora-drawer>
<script type="module">
  import { walletStore } from "@koralabs/kora-site-resources";
  walletStore.autoConnect(); // silent reconnect; on connect the panel fills itself
</script>
```

On connect the store resolves the wallet's handles (with images), auto-selects a default (the
last-remembered one, else the first non-virtual), and exposes a friendly `addr1…` address — the
button shows the `$handle`, the panel lists the rest, and clicking the pill opens the drawer. Opt
out with `walletStore.autoResolve = false`, or feed a custom list via `panel.handles`.

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

The demo is **HTML-first**: [demo/index.html](demo/index.html) authors the components as plain
custom-element tags (`<kora-header>`, `<kora-button label="…">`, …) that render themselves
client-side once `/lib/index.js` registers them — the "drop the tags into any HTML page" path.
`demo/server.mjs` is just a static file server. (SSR via the `/ssr` `renderKora*` functions is also
supported and tested — it's the other consumption path, not what the demo uses.)
