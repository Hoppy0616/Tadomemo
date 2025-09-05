// Lightweight ULID generator (Crockford base32)
// ULID: 26 chars = time(10) + randomness(16)
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford, no I,L,O,U

function encodeBase32(buffer: Uint8Array): string {
  let str = "";
  for (let i = 0; i < buffer.length; i += 5) {
    const chunk = (buffer[i]! << 32) >>> 0;
    const b1 = buffer[i + 1] ?? 0;
    const b2 = buffer[i + 2] ?? 0;
    const b3 = buffer[i + 3] ?? 0;
    const b4 = buffer[i + 4] ?? 0;
    const val =
      (BigInt(buffer[i]!) << 32n) |
      (BigInt(b1) << 24n) |
      (BigInt(b2) << 16n) |
      (BigInt(b3) << 8n) |
      BigInt(b4);
    let remaining = 40; // bits
    let v = val;
    const local: string[] = [];
    while (remaining > 0) {
      const idx = Number(v & 0x1fn);
      local.push(ALPHABET[idx]!);
      v >>= 5n;
      remaining -= 5;
    }
    str += local.reverse().join("");
  }
  return str;
}

export function ulid(timeMs?: number): string {
  const time = Math.max(0, Math.floor((timeMs ?? Date.now())));
  // time: 48 bits => 6 bytes
  const timeBuf = new Uint8Array(6);
  let t = BigInt(time);
  for (let i = 5; i >= 0; i--) {
    timeBuf[i] = Number(t & 0xffn);
    t >>= 8n;
  }
  // randomness: 80 bits => 10 bytes
  const rand = new Uint8Array(10);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(rand);
  } else {
    // Fallback: simple PRNG (not cryptographically secure)
    for (let i = 0; i < rand.length; i++) rand[i] = Math.floor(Math.random() * 256);
  }
  const timeStr = encodeBase32(timeBuf).slice(0, 10); // 10 chars
  const randStr = encodeBase32(rand).slice(0, 16); // 16 chars
  return timeStr + randStr;
}

export function monotonicUlidFactory() {
  let lastTime = 0;
  let lastId = "";
  return (t?: number) => {
    const now = t ?? Date.now();
    if (now === lastTime) {
      // bump randomness when within same ms
      let id = ulid(now);
      while (id <= lastId) id = ulid(now);
      lastId = id;
      return id;
    }
    lastTime = now;
    lastId = ulid(now);
    return lastId;
  };
}

