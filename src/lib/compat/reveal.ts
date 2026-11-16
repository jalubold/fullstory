/**
 * The results "reveal" plays once per private link per browser. A cookie holds
 * short, non-reversible keys (derived from the link's hash, never the link
 * itself) for the results this browser has already seen, so the server can
 * leave the curtain out on later visits and nothing flashes.
 */
export const REVEAL_COOKIE = 'awc_rv';
export const REVEAL_MAX = 8;

export const parseRevealed = (raw: string | null | undefined): string[] => (raw ?? '').split('.').filter((k) => /^[0-9a-f]{10}$/.test(k)).slice(0, REVEAL_MAX);
