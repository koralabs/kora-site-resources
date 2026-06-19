/** Hex ↔ bytes helpers (pure, browser-safe — no Node Buffer). */

export function hexToBytes(hex: string): Uint8Array {
    const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
    const length = clean.length >> 1;
    const out = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
}

export function bytesToHex(bytes: Uint8Array): string {
    let hex = "";
    for (const byte of bytes) hex += byte.toString(16).padStart(2, "0");
    return hex;
}
