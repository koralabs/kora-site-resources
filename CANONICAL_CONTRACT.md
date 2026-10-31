# kora-site-resources canonical contract

## Purpose and authority

I am `@koralabs/kora-site-resources`, the vanilla web-component and wallet-UX library shared by Kora Labs and Handle sites (design tokens, header/footer chrome, CIP-30 wallet connect, Handle resolution, IPFS/NFTCDN image helpers), published to npm. Every site that uses me trusts me to show the right Handle for a wallet, point links at the right network, and never act with a wallet on its own. I hold no keys, sign nothing myself and mint nothing. Ecosystem rules: `../AGENTS.md` (Critical Correctness). Paths in [`.enclave`](./.enclave) need operator approval to merge.

## Invariants (must never be violated)

1. A policy id counts as a Handle only if it is the standard or DeMi Handle policy in `src/wallet/policies.ts`. A look-alike policy never shows up as a Handle in a wallet. (Tests: `test/handles.test.mjs` "isHandlePolicy recognizes only handle policies" and "resolveWalletHandles extracts owned handles".)
2. Handle names are decoded exactly: the CIP-68 222 label (`000de140`) is stripped once and the rest is UTF-8 decoded. Addresses derived from wallet bytes use the correct bech32 prefix for the network header. (Tests: `handles.test.mjs`, `ipfs.test.mjs` bech32 reference vector and `addressBech32`.)
3. Connecting a wallet only calls the wallet's own `enable`, reads state and lists Handles. `signTx`, `signData` and `submitTx` are thin pass-throughs to the CIP-30 wallet API, so the wallet's own prompt is the only authority; I never build, alter, sign or submit a transaction myself and never persist anything that can sign. (`src/wallet/store.ts`, `cip30.ts`, `persistence.ts`; `test/wallet.test.mjs`, `persistence.test.mjs`. No test asserts that persistence omits secrets.)
4. The NFTCDN signing key never reaches a browser bundle. Only the pre-signed URL does; `signNftcdnUrl` and `nftcdnImageUrl` are server-side only. (`src/nftcdn/index.ts`; `test/nftcdn.test.mjs` checks the signature against `node:crypto`. Nothing enforces server-only use. It is a documented rule.)
5. URLs are built per network from one rule: mainnet has no prefix; `preview.` and `preprod.` prefix the host. Preview and preprod never link to mainnet and vice versa. (`src/env/index.ts`; `test/env.test.mjs`.)
6. Only reviewed source is published: `package.json` and the deploy workflow change only with operator approval, because every version I publish ships into the wallet-connect path of other sites.
7. No secrets in git.

## Boundaries and known limits

- Handle ownership shown to the user comes from the Handle API (`fetchWalletHandles`) or the wallet's own balance. I do not verify either against the chain; the API is authoritative for ecosystem sites and the chain for the wallet value. A wrong API reply would show a wrong list.
- `fetchWalletHandles` trusts a non-array reply as empty and stops on a short page or on the total header. A truncated list is possible if the API misreports totals (tests cover the current header behavior).
- The deploy workflow runs lint, tests and build in GitHub Actions before publishing; the operator rule is that tests run locally only, so that workflow is out of step with the rule.
- The wallet and handle choice persist in two cookies (`kora_wallet`, `kora_handle`) shared across the whole registrable domain for a year. They carry only a wallet key and a handle name, but are written without the `Secure` flag.
- Invariant 4 relies on callers; nothing here can stop a site from bundling the key.
- No test checks that a connect flow cannot call `signTx`/`submitTx` without an explicit call from the host app.

## Refactors needed to enforce this

- Add a test that connect, handle resolution and persistence never call the wallet's `signTx`, `signData` or `submitTx`, using a recording fake wallet.
- Add a test that `persistence` writes only the wallet name and selected handle.
- Split the signing functions into a server-only entry point (`./nftcdn/server`) so the browser entry cannot import them.
- Move test execution out of `deploy.yml` per the ecosystem test rule, and keep lint, build and publish there.
