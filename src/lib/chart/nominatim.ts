import type { GeoHit } from './types';

const ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const MIN_INTERVAL_MS = 1100;
const cache = new Map<string, GeoHit[]>();
let lastAt = 0;
let chain = Promise.resolve();

async function throttle(): Promise<void> {
  const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastAt));
  if (wait) await new Promise((r) => setTimeout(r, wait));
  lastAt = Date.now();
}

/**
 * Nominatim search. Browser sends its User-Agent and Referer (the policy
 * accepts a valid Referer identifying the app). We rate-limit to 1 req/s
 * and cache for the session. Coordinates are the only thing we take back;
 * the birth moment is never sent.
 */
export function searchPlace(query: string): Promise<GeoHit[]> {
  const q = query.trim();
  if (q.length < 2) return Promise.resolve([]);
  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);

  const run = async () => {
    await throttle();
    const url = new URL(ENDPOINT);
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '5');
    url.searchParams.set('addressdetails', '0');
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);
    const rows = (await res.json()) as { display_name: string; lat: string; lon: string }[];
    const hits: GeoHit[] = rows.map((r) => ({
      label: r.display_name,
      lat: Number(r.lat),
      lon: Number(r.lon),
    }));
    cache.set(key, hits);
    return hits;
  };

  const next = chain.then(run, run);
  chain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}
