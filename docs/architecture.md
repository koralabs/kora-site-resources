# Architecture & Decisions

This package is one framework-neutral source of truth for the Kora / Ada Handle visual identity
and wallet UX, shipped as native web components + design tokens. It consolidates two diverging
packages (`handles-shared-components` for React, `handles-shared-lit-components` for Lit) so the
design language is implemented once and reused everywhere.

## Locked decisions

1. **Replaces both old packages.** `handles-shared-components` (React) and
   `handles-shared-lit-components` (Lit) are absorbed here and then deprecated. Migration is a
   first-class goal, not an afterthought.

2. **No framework — vanilla custom elements.** The platform supplies everything we need:
   - **Templating**: tagged template literals + the `<template>` element + DOM APIs.
   - **Reactivity (change detection)**: `Proxy` + `Reflect` wrap component state, so plain
     mutation is observable. This is the same primitive Vue's reactivity is built on.
   - **Reactivity (DOM update)**: capture the dynamic nodes once (refs) and write to them
     directly in `update()`. Coarse-grained (any change re-runs the small `update()`), which is
     ample for our component surface. No diffing engine.
   - We do **not** depend on Lit. It was considered for SSR/templating ergonomics, but SSR needs
     no framework (it's just HTML strings), and our reactive surface is small enough that the
     native `<template>`+refs pattern is adequate. Lit could still be adopted later inside an
     isolated component if one ever needs complex, frequently-rebuilt reactive lists.

3. **Light DOM by default.** `renderRoot === this`. Benefits: trivial SSR + hydration, global CSS
   and design tokens apply without piercing a boundary, native form participation, intact ARIA
   IDREF associations, smoother framework interop. Shadow DOM is reserved for a small set of
   client-only interactive widgets (e.g. a wallet-connect modal) where style-leakage risk is
   highest and SSR is irrelevant.

4. **Theming = design tokens + cascade layers.** Tokens are CSS custom properties (they inherit
   through any boundary). `@layer kora.reset, kora.tokens, kora.components, kora.overrides`
   makes app-vs-library precedence explicit without specificity wars. This is the encapsulation
   strategy that replaces shadow DOM for light-DOM components. We control every consuming site
   (they're upgraded on assimilation), so defending against hostile host CSS is not required.

5. **SSR is a hard requirement** (most Lit sites server-render). Contract: **attributes are the
   single source of truth.** The server emits inner markup matching what the client would render
   for those attributes, plus the `data-kora-ssr` marker on the host. On connect the element
   adopts that markup (wires refs, runs one idempotent `update()`) instead of re-rendering — no
   flicker, no clobbering. Elements created client-side (no marker) render fresh from `template()`.

6. **Wallet layer owns a small framework-agnostic reactive store** (planned) so every site gets
   consistent connect/disconnect/network-switch behavior. Seeded from the existing
   `walletConnector.ts` (zero-dep raw CIP-30 primitives); `@cardano-sdk` layers in for the
   hex→bech32 + balance decoding that apps currently each do themselves.

## Dependencies policy

Minimal, and only for things too risky/complex to write ourselves. Runtime deps target: just
`@cardano-sdk/*` (wallet), `@koralabs/kora-labs-common` (peer types), `@koralabs/handle-svg`,
and possibly `qr-code-styling`. No animation library, no UI kit, no icon-component package — that
bloat is exactly what we are leaving behind. (devDependencies like the TS compiler and a DOM for
tests do not count against this.)

## The KoraElement base class

`src/components/base/kora-element.ts` implements the model above. Subclasses provide:

- `initialState()` — reactive state shape + defaults (wrapped in the `Proxy`).
- `observedAttributes` + a typed `attributeChangedCallback` — map attributes → state.
- `template()` — fresh-render inner HTML (must match SSR output for equivalent attributes).
- `hydrate()` — capture node refs / attach listeners, once, against rendered-or-adopted DOM.
- `update()` — apply state to the DOM via refs; idempotent, mutates nodes in place.

`kora-button` is the reference implementation and the proof exercised by the tests.

## Composition (light-DOM slotting)

Container components (`kora-header`, `kora-footer`, `kora-drawer`) host app-provided content. The
base supports this without shadow DOM: a component sets `preservesChildren = true`, and authored
children are captured before the fresh render and re-projected into the template's mount points —
an element with `slot="x"` goes to `[data-kora-slot="x"]`, everything else to `[data-kora-content]`.
On SSR adoption the server already placed them, so projection is skipped. Dividers and similar are
drawn in CSS, not markup (e.g. the footer's pipe separators).

## Environment-aware links

`src/env/` builds handle.me-ecosystem URLs. Mainnet drops the subdomain prefix; preview/preprod add
it (`merch.handle.me` vs `preview.merch.handle.me`). Because a framework-agnostic component can't
read the apps' build-time `NEXT_PUBLIC_NETWORK`, the environment is derived at runtime from the
host's leading label (`getEnvironment()`), with an explicit `env`/`hostname` override for SSR.
`koraNavLinks()` / `koraFooterLinks()` / `koraResourceLinks()` give the canonical, env-aware link
sets — and apply the prefix to H.A.L. and Merch too (handle.me hardcodes those bare; fixed here).
The top nav (`koraNavLinks`) is just the global destinations (Mint / H.A.L. / Merch); the
handle-scoped actions (Personalize / Portal / SubHandles) live in the wallet drawer, tied to the
selected handle — built with `portalUrl` / `personalizeUrl` / `subhandlesUrl`.
`koraResourceLinks({ extra })` is the shared default set behind the header's `kora-menu` (Resources
hamburger): the defaults appear on every site, and `extra` (or slotted `<a>` children) lets a site
add its own without losing them.

## Clearing site data

`clearHandleSiteData()` clears caches, localStorage, sessionStorage, IndexedDB, and cookies scoped
to the shared `.handle.me` parent domain. **Cross-subdomain limit:** the same-origin policy means
one origin cannot clear another subdomain's web storage — only the shared-domain cookies are truly
cross-subdomain. A full cross-subdomain storage wipe would need a hidden-iframe broadcast to a
shared clear page on each subdomain (a deliberate future addition, not achievable from one origin).

## Wallet (CIP-30)

`src/wallet/` is the start of the wallet layer. `cip30.ts` holds zero-dependency discovery
(`listAvailableWallets`) + `enableWallet`, returning RAW CIP-30 values (hex addresses, CBOR
balance) — decoding stays app-side or a future `@cardano-sdk` adapter, matching handle.me's
`walletConnector.ts`. `WalletStore` is a framework-agnostic reactive store (same Proxy + batched
notify as KoraElement) holding connection state with `connect`/`disconnect`/`subscribe`/`signTx`.
A `walletStore` singleton is exported for app-wide use. `kora-wallet-button` subscribes to a store
and renders the connect/connecting/connected flow (picker for multiple wallets, swapping in
`kora-handle-indicator` when connected).

**Auto-reconnect + memory.** A successful `connect()` remembers the wallet key; `autoConnect()`
silently reconnects it on a later visit — but ONLY a wallet the user connected before, so a
first-ever visit never gets an unsolicited prompt (and an explicit `disconnect()` forgets it).
`src/wallet/persistence.ts` stores the last wallet + handle as cookies on the shared `.handle.me`
parent domain, so the choice carries across sites (host-only cookie on localhost). `chooseDefault
Handle(handles, preferred)` prefers the remembered handle when it's still owned. (Cross-subdomain
memory only skips the picker; each subdomain still needs its own CIP-30 authorization for a truly
silent reconnect.)

### Handle resolution adapter

`src/wallet/handles.ts` (subpath `@koralabs/kora-site-resources/wallet/handles`) turns a connected
wallet's CIP-30 value — the `getBalance()` CBOR (or `getUtxos()`) — into the list of Ada Handles it
holds, so the indicator shows the real chosen `$handle` and the drawer lists them all. It's the
deliberate decoding layer kept OUT of the zero-dep store: it depends on `cborg` (pure-ESM,
zero-dependency, browser-native CBOR), walks the multiasset map, filters by handle policy IDs, and
UTF-8-decodes the asset name (stripping CIP-68 222/444 labels; reference 100/000 tokens excluded).

The handle policy IDs + CIP-68 labels live in a dependency-free `wallet/policies.ts` (mirrored from
kora-labs-common's HANDLE_POLICIES / AssetNameLabel) rather than imported — importing that package
would drag AWS SDK / libsodium into a browser bundle. **Dependency note:** because the CBOR resolver
imports the bare specifier `cborg`, a no-bundler consumer needs an import map for it (the demo
includes one); bundler-based sites resolve it normally. The core store + all components remain
bare-specifier-free.

### SubHandle / full-list lookup (Handle API)

`src/wallet/handle-api.ts` (`fetchWalletHandles`, exported from `./wallet` and `./wallet/handle-api`)
fetches EVERY handle held by a stake key — regular handles, NFT subhandles, and **virtual
SubHandles** — from the public Ada Handle API. Verified live: `POST /handles/list?type=stakekeyhash`
accepts the hex reward address that CIP-30's `getRewardAddresses()` returns **as-is** (the full `e1…`
form), so there's NO bech32/address-encoding step and NO new dependency — just `fetch`. The endpoint
is public + CORS-open; unauthenticated calls are limited to 5 req/sec/IP, ample for a once-per-connect
lookup (a client can't safely hold the `api-key` that lifts the limit). Each result carries a
`handle_type` (so virtuals get the panel's Virtual badge) and `resolved_addresses`.

**Pagination (fix-ready).** The API caps a JSON response at 250 handles (`MAX_PAGINATED_RESULTS`), so
`fetchWalletHandles` requests 250/page and stops on two signals: the `x-handles-search-total` header
as the authoritative grand total *once it's trustworthy*, else a short page. Today that header
reports the *page* count on the JSON path (a known bug the team is fixing to report the grand total),
so we only trust it once it exceeds a single page's returned count — which the page-count value can
never do. This keeps it correct both now and after the fix, and the trusted-total path also covers
the edge where a full page of names yields fewer JSON objects (the API drops UTxO-less handles),
which a short-page-only rule would misread as the end. Almost everyone resolves in one request; the
few wallets with >250 handles fan out over a handful of sequential pages (well within 5 req/sec).

This is the richer, network-backed source; the CBOR resolver remains the trustless/offline path. The
demo uses the API as primary and falls back to CBOR (on-chain names only) if it's unreachable.

## Design sources

Tokens and components are distilled from the live sites (design language only — none of their
React/Tailwind/Headless-UI/framer-motion runtime carries over):

- **handle.me** → header, footer, wallet-connect UX, the chosen-handle indicator, the side drawer.
- **hal.handle.me** → the layered background and the aero/glass panels. (Its Three.js/GLB hero is
  site-specific and intentionally NOT in this package; render such content in your own layer.)

Branding is configurable: `kora-brand` defaults to `$handle` and each site rebrands via `label`
(e.g. `H.A.L.`). The grid texture image stays app-provided (`--kora-bg-grid-image`) so the package
ships no binary assets.

## Layout

```
src/
  components/base/kora-element.ts      # the vanilla reactive base (+ light-DOM slotting)
  components/primitives/kora-button/   # reference component: template.ts (pure/SSR) + element + css
  components/chrome/                    # kora-brand, kora-header, kora-footer, kora-background
  components/wallet/                    # kora-handle-indicator
  components/overlay/                   # kora-drawer
  tokens/                              # tokens.css (source of truth) + typed token refs
  styles/                              # cascade layers + reset + glass/aero utilities
  ssr/index.ts                         # server-safe pure renderers (no DOM)
  utils/                               # html escaping, etc.
demo/server.mjs                        # vanilla-Node SSR demo (npm run demo)
test/                                  # node --test; SSR (pure) + element behavior (happy-dom)
```

## Migration path

1. Scaffold (this) — base, tokens, build/SSR, tests. **← current**
2. Shared shell (header/footer) + wallet store/UI; adopt in one upgraded site as the proving ground.
3. Port Lit primitives; migrate Lit sites (lowest friction).
4. Migrate React sites (on modern React); replace `handles-shared-components` piece by piece.
5. Deprecate both old packages.
