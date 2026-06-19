// Registers a real DOM (with customElements support) as globals before tests load, so the
// vanilla custom elements can be exercised under `node --test`. happy-dom is a devDependency only.
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// A real document URL is needed so document.cookie persists (cookie-based persistence tests).
// A handle.me host also exercises the shared-parent-domain (.handle.me) cookie path.
GlobalRegistrator.register({ url: "https://demo.handle.me/" });
