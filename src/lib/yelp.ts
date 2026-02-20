import { getCached, setCached } from '@/lib/simple-cache';

export interface YelpBusinessSignals {
  reviewCount: number | null;
  rating: number | null;
}

const YELP_TTL_MS = 24 * 60 * 60 * 1000;
const YELP_API_KEY = process.env.YELP_API_KEY || '';

export async function getYelpSignals(placeName: string, lat: number, lng: number): Promise<YelpBusinessSignals | null> {
  if (!YELP_API_KEY) return null;

  const cacheKey = `yelp:${placeName}:${lat.toFixed(4)}:${lng.toFixed(4)}`;
  const cached = await getCached<YelpBusinessSignals>(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL('https://api.yelp.com/v3/businesses/search');
    url.searchParams.set('term', placeName);
    url.searchParams.set('latitude', String(lat));
    url.searchParams.set('longitude', String(lng));
    url.searchParams.set('limit', '1');
    url.searchParams.set('sort_by', 'best_match');

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${YELP_API_KEY}`,
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { businesses?: Array<{ review_count?: number; rating?: number }> };
    const first = data.businesses?.[0];
    if (!first) return null;

    const result: YelpBusinessSignals = {
      reviewCount: typeof first.review_count === 'number' ? first.review_count : null,
      rating: typeof first.rating === 'number' ? first.rating : null,
    };

    await setCached(cacheKey, result, YELP_TTL_MS);
    return result;
  } catch {
    return null;
  }
}
