import { getCached, setCached } from '@/lib/simple-cache';

export interface YelpBusinessSignals {
  reviewCount: number | null;
}

const TTL_MS = 24 * 60 * 60 * 1000;
const YELP_API_KEY = process.env.YELP_API_KEY || '';

export async function getYelpSignals(
  placeName: string,
  lat: number,
  lng: number,
): Promise<YelpBusinessSignals> {
  if (!YELP_API_KEY) return { reviewCount: null };

  const key = `yelp:${lat.toFixed(5)},${lng.toFixed(5)}:${placeName.toLowerCase()}`;
  const cached = await getCached<YelpBusinessSignals>(key);
  if (cached) return cached;

  try {
    const url = new URL('https://api.yelp.com/v3/businesses/search');
    url.searchParams.set('term', placeName);
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('limit', '1');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${YELP_API_KEY}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return { reviewCount: null };

    const data = (await res.json()) as { businesses?: Array<{ review_count?: number }> };
    const reviewCount = data.businesses?.[0]?.review_count;

    const result: YelpBusinessSignals = {
      reviewCount: typeof reviewCount === 'number' ? reviewCount : null,
    };

    await setCached(key, result, TTL_MS);
    return result;
  } catch {
    return { reviewCount: null };
  }
}
