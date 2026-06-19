/**
 * Minimal static file server for the HTML-first demo (vanilla Node, no deps). The page itself is
 * authored HTML — see demo/index.html — so this just serves files:
 *   - "/"                  → demo/index.html
 *   - "/demo.css"          → demo/demo.css
 *   - "/lib/*"             → the built package (ESM + CSS)
 *   - "/node_modules/cborg/*" → cborg, for the import map (handle resolution)
 *
 * Run: `npm run demo` (builds first), then open http://localhost:8088
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, normalize, extname } from "node:path";

const DEMO = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(DEMO);
const PORT = Number(process.env.PORT) || 8088;

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript",
    ".css": "text/css",
    ".map": "application/json",
};

async function send(res, filePath) {
    try {
        const body = await readFile(filePath);
        res.writeHead(200, { "content-type": MIME[extname(filePath)] ?? "application/octet-stream" });
        res.end(body);
    } catch {
        res.writeHead(404).end("Not found");
    }
}

const server = createServer((req, res) => {
    const url = (req.url ?? "/").split("?")[0];

    if (url === "/" || url === "/index.html") return void send(res, join(DEMO, "index.html"));
    if (url === "/demo.css") return void send(res, join(DEMO, "demo.css"));

    if (url.startsWith("/lib/") || url.startsWith("/node_modules/cborg/")) {
        const filePath = normalize(join(ROOT, url));
        const allowed = [join(ROOT, "lib"), join(ROOT, "node_modules", "cborg")];
        if (!allowed.some((dir) => filePath.startsWith(dir))) return void res.writeHead(403).end("Forbidden");
        return void send(res, filePath);
    }

    res.writeHead(404).end("Not found");
});

server.listen(PORT, () => {
    console.log(`kora-site-resources demo → http://localhost:${PORT}`);
});
