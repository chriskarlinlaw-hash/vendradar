import { getCached, setCached } from '@/lib/simple-cache';

export interface PopularTimesResult {
  busynessHours: number[] | null;
  peakHours: string[];
}

const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REQUEST_INTERVAL_MS = 1000; // 1 req/sec max

let lastRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rateLimitPopularTimes(): Promise<void> {
  const now = Date.now();
  const wait = REQUEST_INTERVAL_MS - (now - lastRequestAt);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function hourLabel(hour: number): string {
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
}

function toPeakHours(hours: number[] | null): string[] {
  if (!hours || hours.length !== 24) return [];
  const threshold = 70;
  const ranges: string[] = [];
  let start = -1;

  for (let i = 0; i < 24; i++) {
    const isPeak = hours[i] >= threshold;
    if (isPeak && start === -1) start = i;
    if ((!isPeak || i === 23) && start !== -1) {
      const end = isPeak && i === 23 ? 24 : i;
      ranges.push(`${hourLabel(start)}-${hourLabel(end % 24)}`);
      start = -1;
    }
  }

  return ranges.slice(0, 3);
}

function parsePopularTimesFromHtml(html: string): number[] | null {
  const dayPatterns = [
    /"popular_times"\s*:\s*(\[[\s\S]*?\]\])/, 
    /"popularTimes"\s*:\s*(\[[\s\S]*?\]\])/, 
  ];

  for (const pattern of dayPatterns) {
    const match = html.match(pattern);
    if (!match?.[1]) continue;

    try {
      const parsed = JSON.parse(match[1]) as unknown;
      // Shapes seen in the wild include number[] or [{ data: number[] }, ...7days]
      if (Array.isArray(parsed) && parsed.length === 24 && parsed.every(v => typeof v === 'number')) {
        return parsed.map(v => clamp(v as number));
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        const today = parsed.find((d: unknown) => {
          if (!d || typeof d !== 'object') return false;
          const obj = d as Record<string, unknown>;
          return Array.isArray(obj.data) && obj.data.length === 24;
        }) as Record<string, unknown> | undefined;

        if (today && Array.isArray(today.data)) {
          const vals = today.data.filter((v): v is number => typeof v === 'number').slice(0, 24);
          if (vals.length === 24) return vals.map(clamp);
        }
      }
    } catch {
      // continue searching with other patterns
    }
  }

  return null;
}

export async function getPopularTimes(
  placeName: string,
  lat: number,
  lng: number,
): Promise<PopularTimesResult> {
  const key = `popular-times:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = await getCached<PopularTimesResult>(key);
  if (cached) return cached;

  try {
    await rateLimitPopularTimes();
    const q = encodeURIComponent(`${placeName} ${lat},${lng}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${q}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 VendRadar/1.0',
        Accept: 'text/html',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) {
      const fallback: PopularTimesResult = { busynessHours: null, peakHours: [] };
      await setCached(key, fallback, TTL_MS);
      return fallback;
    }

    const html = await res.text();
    const busynessHours = parsePopularTimesFromHtml(html);
    const result: PopularTimesResult = {
      busynessHours,
      peakHours: toPeakHours(busynessHours),
    };

    await setCached(key, result, TTL_MS);
    return result;
  } catch {
    const fallback: PopularTimesResult = { busynessHours: null, peakHours: [] };
    await setCached(key, fallback, TTL_MS);
    return fallback;
  }
}
