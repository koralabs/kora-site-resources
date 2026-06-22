/**
 * Minimal bech32 *encoder* (BIP-173), vendored so the core stays free of bare-specifier dependencies
 * and works with no bundler / no import map. Cardano addresses exceed bech32's 90-char reference
 * limit, so we encode directly without that validation cap. Encode-only — we never decode here.
 */
const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values: number[]): number {
    let chk = 1;
    for (const value of values) {
        const top = chk >>> 25;
        chk = ((chk & 0x1ffffff) << 5) ^ value;
        for (let i = 0; i < 5; i++) if ((top >> i) & 1) chk ^= GENERATOR[i]!;
    }
    return chk;
}

function hrpExpand(hrp: string): number[] {
    const out: number[] = [];
    for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) >> 5);
    out.push(0);
    for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) & 31);
    return out;
}

function createChecksum(hrp: string, data: number[]): number[] {
    const values = hrpExpand(hrp).concat(data, [0, 0, 0, 0, 0, 0]);
    const mod = polymod(values) ^ 1;
    const out: number[] = [];
    for (let i = 0; i < 6; i++) out.push((mod >> (5 * (5 - i))) & 31);
    return out;
}

/** Regroup 8-bit bytes into 5-bit groups, padding the final group with zero bits. */
function toWords(bytes: Uint8Array): number[] {
    let acc = 0;
    let bits = 0;
    const out: number[] = [];
    for (const b of bytes) {
        acc = (acc << 8) | b;
        bits += 8;
        while (bits >= 5) {
            bits -= 5;
            out.push((acc >> bits) & 31);
        }
    }
    if (bits > 0) out.push((acc << (5 - bits)) & 31);
    return out;
}

/** Encode raw bytes as a bech32 string under the given human-readable prefix. */
export function bech32Encode(hrp: string, bytes: Uint8Array): string {
    const data = toWords(bytes);
    const combined = data.concat(createChecksum(hrp, data));
    let out = `${hrp}1`;
    for (const d of combined) out += CHARSET[d];
    return out;
}

function hexToBytes(hex: string): Uint8Array {
    const clean = hex.length % 2 ? `0${hex}` : hex;
    const out = new Uint8Array(clean.length / 2);
    for (let i = 0; i < out.length; i++) {
        const byte = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
        if (Number.isNaN(byte)) throw new Error("invalid hex");
        out[i] = byte;
    }
    return out;
}

/**
 * Encode a hex Cardano address (payment or stake/reward) as bech32 (`addr1…` / `stake1…`). The
 * human-readable prefix is derived from the address header byte: the high nibble is the address
 * type (0b1110/0b1111 = reward), the low nibble is the network id (1 = mainnet, else testnet).
 * Returns null for empty/invalid input — callers can fall back to the raw hex.
 */
export function addressBech32(hex: string | null | undefined): string | null {
    if (!hex) return null;
    let bytes: Uint8Array;
    try {
        bytes = hexToBytes(hex);
    } catch {
        return null;
    }
    if (bytes.length === 0) return null;
    const header = bytes[0]!;
    const type = header >> 4;
    const isStake = type === 0b1110 || type === 0b1111;
    const network = header & 0x0f;
    const base = isStake ? "stake" : "addr";
    const hrp = network === 1 ? base : `${base}_test`;
    return bech32Encode(hrp, bytes);
}
