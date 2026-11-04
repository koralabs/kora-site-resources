# kora-site-resources canonical contract

`@koralabs/kora-site-resources`, the web-component and wallet-UX library shared by Kora Labs and Handle sites (design tokens, header/footer, CIP-30 wallet connect, Handle resolution, IPFS/NFTCDN image helpers). It holds no keys and mints nothing.

1. A policy id counts as a Handle only if it is the standard or DeMi Handle policy in `src/wallet/policies.ts`; a look-alike policy never shows as a Handle.
2. Handle names are decoded exactly: the CIP-68 222 label (`000de140`) is stripped once and the rest is UTF-8 decoded. Addresses derived from wallet bytes use the bech32 prefix for the network header.
3. Connecting a wallet only calls the wallet's own `enable`, reads state and lists Handles. `signTx`, `signData` and `submitTx` are thin pass-throughs to the CIP-30 wallet; the library never builds, alters, signs or submits a transaction itself and never persists anything that can sign.
4. The NFTCDN signing key is server-side only; `signNftcdnUrl` and `nftcdnImageUrl` produce pre-signed URLs and the key never reaches a browser bundle.
5. URLs are built per network from one rule: mainnet has no prefix, `preview.` and `preprod.` prefix the host, and a network never links to another.
6. Handle ownership shown comes from the Handle API or the wallet balance; the library does not verify it against the chain.
