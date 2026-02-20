import { getCached, setCached } from '@/lib/simple-cache';

export interface PopularTimesResult {
  busyness: number[] | null;
  source: 'google-maps-scrape' | 'unavailable';
}

const POPULAR_TIMES_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function parsePopularTimesFromHtml(html: string): number[] | null {
  const match = html.match(/\"popular_times\":(\[[^\]]+\])/);
  if (!match?.[1]) return null;

  try {
    const raw = JSON.parse(match[1]) as unknown;
    if (!Array.isArray(raw)) return null;
    const numbers = raw.filter((v): v is number => typeof v === 'number').map(v => Math.max(0, Math.min(100, v)));
    return numbers.length > 0 ? numbers : null;
  } catch {
    return null;
  }
}

/**
 * Best-effort Google Maps Popular Times scraper.
 * Returns null busyness when scraping is unavailable/blocked.
 */
export async function getPopularTimes(placeName: string, lat: number, lng: number): Promise<PopularTimesResult> {
  const cacheKey = `popular-times:${placeName}:${lat.toFixed(4)}:${lng.toFixed(4)}`;
  const cached = await getCached<PopularTimesResult>(cacheKey);
  if (cached) return cached;

  try {
    const q = encodeURIComponent(`${placeName} ${lat},${lng}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'VendRadar/1.0',
      },
      signal: AbortSignal.timeout(4500),
    });

    if (!res.ok) {
      const fallback: PopularTimesResult = { busyness: null, source: 'unavailable' };
      await setCached(cacheKey, fallback, POPULAR_TIMES_TTL_MS);
      return fallback;
    }

    const html = await res.text();
    const busyness = parsePopularTimesFromHtml(html);
    const result: PopularTimesResult = {
      busyness,
      source: busyness ? 'google-maps-scrape' : 'unavailable',
    };

    await setCached(cacheKey, result, POPULAR_TIMES_TTL_MS);
    return result;
  } catch {
    const fallback: PopularTimesResult = { busyness: null, source: 'unavailable' };
    await setCached(cacheKey, fallback, POPULAR_TIMES_TTL_MS);
    return fallback;
  }
}
