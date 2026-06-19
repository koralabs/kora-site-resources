/**
 * Tiny demo server (vanilla Node, no deps) showing the library in a realistic SSR setup:
 *   - "/"        → a sample home page server-rendered with the `renderKora*` functions.
 *   - "/lib/*"   → the compiled package (ESM + CSS), so the page hydrates in the browser.
 *
 * Run: `npm run demo` (builds first), then open http://localhost:8088
 * This is a demo harness, not part of the published package.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize, extname } from "node:path";

import {
    renderKoraBackground,
    renderKoraHeader,
    renderKoraFooter,
    renderKoraDrawer,
    renderKoraButton,
    renderKoraWalletButton,
    renderKoraMenu,
    renderKoraInput,
    renderKoraSelect,
    renderKoraCheckbox,
    renderKoraRadio,
    renderKoraSwitch,
    renderKoraTabs,
    renderKoraCollapsible,
    renderKoraTooltip,
    renderKoraLoader,
    renderKoraModal,
} from "../lib/ssr/index.js";
import { koraNavLinks, koraFooterLinks } from "../lib/env/links.js";
import { getEnvironment } from "../lib/env/index.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.env.PORT) || 8088;

const MIME = { ".js": "text/javascript", ".css": "text/css", ".map": "application/json" };

// Stylesheet order: layers first (declares the cascade-layer order), then tokens, then components.
const STYLES = [
    "/lib/styles/layers.css",
    "/lib/styles/reset.css",
    "/lib/tokens/tokens.css",
    "/lib/styles/glass.css",
    "/lib/components/primitives/kora-button/kora-button.css",
    "/lib/components/chrome/kora-brand/kora-brand.css",
    "/lib/components/chrome/kora-background/kora-background.css",
    "/lib/components/chrome/kora-header/kora-header.css",
    "/lib/components/chrome/kora-footer/kora-footer.css",
    "/lib/components/chrome/kora-menu/kora-menu.css",
    "/lib/components/wallet/kora-handle-indicator/kora-handle-indicator.css",
    "/lib/components/wallet/kora-wallet-button/kora-wallet-button.css",
    "/lib/components/wallet/kora-wallet-panel/kora-wallet-panel.css",
    "/lib/components/overlay/kora-drawer/kora-drawer.css",
    "/lib/components/overlay/kora-modal/kora-modal.css",
    "/lib/styles/utilities.css",
    "/lib/components/feedback/kora-loader/kora-loader.css",
    "/lib/components/feedback/kora-tooltip/kora-tooltip.css",
    "/lib/components/feedback/kora-toast/kora-toast.css",
    "/lib/components/forms/kora-checkbox/kora-checkbox.css",
    "/lib/components/forms/kora-radio/kora-radio.css",
    "/lib/components/forms/kora-switch/kora-switch.css",
    "/lib/components/forms/kora-input/kora-input.css",
    "/lib/components/forms/kora-select/kora-select.css",
    "/lib/components/navigation/kora-tabs/kora-tabs.css",
    "/lib/components/navigation/kora-collapsible/kora-collapsible.css",
];

function page(env) {
    // Env-aware nav: mainnet → merch.handle.me, preview → preview.merch.handle.me, etc.
    // No handle passed (disconnected) → handle-scoped items (Personalize/Portal/SubHandles) are
    // omitted, matching real behavior; they'd be added once a wallet/handle is connected.
    const nav = koraNavLinks({ env })
        .map((l) => `<a href="${l.href}"${l.external ? ' target="_blank" rel="noopener"' : ""}>${l.label}</a>`)
        .join("");

    // The shared wallet panel (profile + actions + search + handle list). Populated client-side
    // from the WalletStore + handle resolution (no mock data).
    const drawerBody = `<kora-wallet-panel env="${env}"></kora-wallet-panel>`;

    // Footer links all point back to handle.me / docs.handle.me (env-aware); the last is an action.
    const links = koraFooterLinks({ env });

    const styleLinks = STYLES.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n    ");

    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Kora Site Resources — demo</title>
    <!-- The handle-resolution adapter imports the bare specifier "cborg"; map it for native ESM.
         (Sites with a bundler don't need this — their bundler resolves it.) -->
    <script type="importmap">{ "imports": { "cborg": "/node_modules/cborg/cborg.js" } }</script>
    ${styleLinks}
    <style>
        body { margin: 0; min-height: 100vh; color: var(--kora-color-text); font-family: var(--kora-font-sans); }
        .demo-main { max-width: 960px; margin: 0 auto; padding: var(--kora-space-8) var(--kora-space-4); display: grid; gap: var(--kora-space-8); }
        .demo-hero { padding: var(--kora-space-8); text-align: center; }
        .demo-hero h1 { font-size: 2.5rem; margin: 0 0 var(--kora-space-3); }
        .demo-hero p { color: var(--kora-gray-300); margin: 0 0 var(--kora-space-6); }
        .demo-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: var(--kora-space-4); }
        .demo-card { padding: var(--kora-space-6); }
        .demo-card h3 { margin: 0 0 var(--kora-space-2); color: var(--kora-color-cyan); }
        .demo-card p { margin: 0; color: var(--kora-gray-300); font-size: var(--kora-text-sm); }
        .demo-profile { padding: var(--kora-space-4); margin-bottom: var(--kora-space-4); }
        .demo-profile__name { margin: 0; font-weight: 700; }
        .demo-profile__addr { margin: var(--kora-space-1) 0 0; font-family: var(--kora-font-mono); font-size: var(--kora-text-sm); color: var(--kora-drawer-ink-muted); }
        .demo-handles { display: grid; gap: var(--kora-space-2); }
        .demo-handle { padding: var(--kora-space-3) var(--kora-space-4); font-family: var(--kora-font-mono); }
        .demo-components { padding: var(--kora-space-8); display: grid; gap: var(--kora-space-6); }
        .demo-components h2 { margin: 0; }
        .demo-row { display: flex; flex-wrap: wrap; gap: var(--kora-space-4); align-items: flex-start; }
        .demo-row--center { align-items: center; }
        .demo-help { display: inline-flex; align-items: center; justify-content: center; width: 1.5rem; height: 1.5rem; border-radius: 50%; background: var(--kora-surface-2); cursor: help; }
    </style>
</head>
<body>
    ${renderKoraBackground({ grid: false })}
    ${renderKoraHeader({
        brandLabel: "handle",
        brandHref: "/",
        nav,
        actions: renderKoraWalletButton() + renderKoraMenu({ env }),
    })}

    <main class="demo-main">
        <section class="kora-glass kora-glass--xl kora-glass--glow demo-hero">
            <h1>One design language. Every site.</h1>
            <p>Framework-agnostic header, footer, wallet UX, and aero/glass — server-rendered here, hydrated in your browser.</p>
            ${renderKoraButton({ label: "Mint a Handle", variant: "primary" })}
        </section>

        <section class="demo-cards">
            <div class="kora-glass demo-card"><h3>Header</h3><p>Configurable $handle branding, swappable per site to $H.A.L.</p></div>
            <div class="kora-glass demo-card"><h3>Wallet</h3><p>The chosen-handle indicator — click it (top right) to open the drawer.</p></div>
            <div class="kora-glass demo-card"><h3>Aero / Glass</h3><p>These very panels: the frosted recipe from hal.handle.me.</p></div>
        </section>

        <section class="kora-glass demo-components">
            <h2>Common components</h2>
            ${renderKoraTabs({ tabs: [{ id: "a", label: "Overview" }, { id: "b", label: "Details" }, { id: "c", label: "More" }] })}

            <div class="demo-row">
                ${renderKoraInput({ label: "Handle", placeholder: "your handle" })}
                ${renderKoraSelect({ placeholder: "Network", options: [{ value: "mainnet", label: "Mainnet" }, { value: "preview", label: "Preview" }, { value: "preprod", label: "Preprod" }] })}
            </div>

            <div class="demo-row demo-row--center">
                ${renderKoraCheckbox({ label: "I agree", checked: true })}
                ${renderKoraSwitch({ label: "Notifications", checked: true })}
                ${renderKoraRadio({ name: "plan", value: "free", label: "Free", checked: true })}
                ${renderKoraRadio({ name: "plan", value: "pro", label: "Pro" })}
                ${renderKoraTooltip({ text: "This is a tooltip", position: "top", trigger: '<span class="demo-help">?</span>' })}
                ${renderKoraLoader({ size: 28 })}
            </div>

            <div class="demo-row demo-row--center">
                ${renderKoraButton({ label: "Open dialog", variant: "primary" })}
                ${renderKoraButton({ label: "Success toast", variant: "secondary" })}
                ${renderKoraButton({ label: "Error toast", variant: "outline" })}
            </div>

            ${renderKoraCollapsible({ title: "What is a Handle?", body: "<p>An Ada Handle is an NFT that doubles as your wallet address and identity across the ecosystem.</p>" })}
        </section>
    </main>

    ${renderKoraFooter({ links })}
    ${renderKoraDrawer({ title: "Wallet & Handles", body: drawerBody })}
    ${renderKoraModal({ title: "Example dialog", body: "<p>This is a kora-modal — the shared dialog shell. Close it with the ✕, the backdrop, or Escape.</p>" })}

    <!-- Client entry: registers + hydrates every element. No bundler — native ESM. -->
    <script type="module" src="/lib/index.js"></script>
    <script type="module">
        import {
            clearHandleSiteData, walletStore, rememberHandle, recallHandle,
            fetchWalletHandles, HANDLE_POLICY_DEMI, koraToast,
        } from "/lib/index.js";
        import { resolveWalletHandles, chooseDefaultHandle } from "/lib/wallet/handles.js";

        const walletBtn = document.querySelector("kora-wallet-button");
        const panel = document.querySelector("kora-wallet-panel");
        const drawer = document.querySelector("kora-drawer");

        // On connect, fetch the full handle list (incl. virtual SubHandles) from the Handle API using
        // the hex reward address; fall back to the trustless on-chain CBOR resolver if the API is
        // unreachable (names only, no virtuals). Prefer the last-remembered handle as the default.
        async function loadHandles(s) {
            let items;
            try {
                const api = await fetchWalletHandles(s.rewardAddressHex);
                items = api.map((h) => ({
                    name: h.name,
                    virtual: h.handle_type === "virtual_subhandle",
                    isDeMi: h.policy === HANDLE_POLICY_DEMI,
                }));
            } catch {
                items = resolveWalletHandles(s.balanceCbor).map((h) => ({
                    name: h.name, isDeMi: h.isDeMi, virtual: h.name.includes("@"),
                }));
            }
            const firstRegular = items.find((i) => !i.virtual && !i.name.includes("@"))?.name;
            const chosen = chooseDefaultHandle(items, recallHandle() ?? firstRegular);
            if (panel) { panel.handles = items; panel.selected = chosen; }
            if (chosen) walletBtn?.setAttribute("handle", chosen);
            else walletBtn?.removeAttribute("handle");
        }

        let loadedFor = null;
        walletStore.subscribe((s) => {
            if (s.status === "connected") {
                if (loadedFor !== s.rewardAddressHex) { loadedFor = s.rewardAddressHex; loadHandles(s); }
            } else {
                loadedFor = null;
                walletBtn?.removeAttribute("handle");
                if (panel) { panel.handles = []; panel.selected = null; }
            }
        });

        // Selecting a handle updates the header pill and is remembered for next time.
        panel?.addEventListener("kora-handle-select", (e) => {
            walletBtn?.setAttribute("handle", e.detail.name);
            rememberHandle(e.detail.name);
        });
        panel?.addEventListener("kora-disconnect", () => drawer?.removeAttribute("open"));

        // Silently reconnect the previously-used wallet (no prompt on a first-ever visit).
        walletStore.autoConnect();

        document.addEventListener("click", (e) => {
            // The connected handle indicator opens the drawer.
            if (e.target.closest("kora-handle-indicator")) drawer?.setAttribute("open", "");
            // Footer "Clear site data" action.
            const link = e.target.closest(".kora-footer__link");
            if (link && link.tagName === "BUTTON" && link.textContent === "Clear site data") {
                clearHandleSiteData();
            }
            // Showcase buttons (matched by their label).
            const label = e.target.closest("kora-button")?.getAttribute("label");
            if (label === "Open dialog") document.querySelector("kora-modal")?.setAttribute("open", "");
            else if (label === "Success toast") koraToast.success("Minted!", { message: "Transaction submitted." });
            else if (label === "Error toast") koraToast.error("Something went wrong", { message: "Please try again." });
        });
    </script>
</body>
</html>`;
}

const server = createServer(async (req, res) => {
    const [url, query = ""] = (req.url ?? "/").split("?");

    if (url === "/" || url === "/index.html") {
        // Real detection: derive the environment from the request's own host (the SSR equivalent of
        // the subdomain detection getEnvironment() does from window.location.hostname). On a real
        // deploy, preview.x.handle.me → "preview" automatically. The ?env override exists only
        // because localhost has no preview./preprod. label to detect.
        const envParam = new URLSearchParams(query).get("env");
        const env =
            envParam === "preview" || envParam === "preprod" || envParam === "mainnet"
                ? envParam
                : getEnvironment(req.headers.host);
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        res.end(page(env));
        return;
    }

    if (url.startsWith("/lib/") || url.startsWith("/node_modules/cborg/")) {
        // Confine to the lib/ directory and the cborg package (for the import map).
        const filePath = normalize(join(ROOT, url));
        const allowed = [join(ROOT, "lib"), join(ROOT, "node_modules", "cborg")];
        if (!allowed.some((dir) => filePath.startsWith(dir))) {
            res.writeHead(403).end("Forbidden");
            return;
        }
        try {
            const body = await readFile(filePath);
            res.writeHead(200, { "content-type": MIME[extname(filePath)] ?? "application/octet-stream" });
            res.end(body);
        } catch {
            res.writeHead(404).end("Not found");
        }
        return;
    }

    res.writeHead(404).end("Not found");
});

server.listen(PORT, () => {
    console.log(`kora-site-resources demo → http://localhost:${PORT}`);
});
