import { Category, FootTraffic, FootTrafficSignals } from '@/lib/types';
import { getPopularTimes } from '@/lib/popular-times';
import { getYelpSignals } from '@/lib/yelp';
import { getOSMSignals } from '@/lib/osm';

type Weights = Record<keyof FootTrafficSignals, number>;
type NormalizedSignals = Record<keyof FootTrafficSignals, number>;

const CATEGORY_WEIGHTS: Record<Category, Weights> = {
  office: { googleRatings: 15, popularTimes: 30, yelpReviews: 5, poiDensity: 20, transit: 15, buildingSize: 10, censusDensity: 5 },
  gym: { googleRatings: 25, popularTimes: 25, yelpReviews: 15, poiDensity: 10, transit: 5, buildingSize: 15, censusDensity: 5 },
  hospital: { googleRatings: 10, popularTimes: 35, yelpReviews: 5, poiDensity: 15, transit: 10, buildingSize: 20, censusDensity: 5 },
  school: { googleRatings: 10, popularTimes: 30, yelpReviews: 5, poiDensity: 15, transit: 15, buildingSize: 20, censusDensity: 5 },
  manufacturing: { googleRatings: 10, popularTimes: 30, yelpReviews: 5, poiDensity: 10, transit: 10, buildingSize: 25, censusDensity: 10 },
  apartment: { googleRatings: 15, popularTimes: 25, yelpReviews: 10, poiDensity: 15, transit: 10, buildingSize: 20, censusDensity: 5 },
  hotel: { googleRatings: 25, popularTimes: 30, yelpReviews: 15, poiDensity: 15, transit: 10, buildingSize: 5, censusDensity: 0 },
  transit: { googleRatings: 10, popularTimes: 40, yelpReviews: 5, poiDensity: 20, transit: 25, buildingSize: 0, censusDensity: 0 },
};

const GOOGLE_BENCHMARKS: Record<Category, { low: number; high: number }> = {
  office: { low: 50, high: 500 }, gym: { low: 100, high: 2000 }, hospital: { low: 200, high: 5000 }, school: { low: 50, high: 800 },
  manufacturing: { low: 20, high: 300 }, apartment: { low: 100, high: 1000 }, hotel: { low: 200, high: 3000 }, transit: { low: 100, high: 2000 },
};
const YELP_BENCHMARKS: Record<Category, { low: number; high: number }> = {
  office: { low: 15, high: 150 }, gym: { low: 30, high: 600 }, hospital: { low: 60, high: 1500 }, school: { low: 15, high: 250 },
  manufacturing: { low: 5, high: 100 }, apartment: { low: 30, high: 300 }, hotel: { low: 60, high: 900 }, transit: { low: 30, high: 600 },
};
const BUILDING_BENCHMARKS: Record<Category, { low: number; high: number }> = {
  office: { low: 5000, high: 100000 }, gym: { low: 5000, high: 30000 }, hospital: { low: 50000, high: 500000 }, school: { low: 30000, high: 300000 },
  manufacturing: { low: 20000, high: 500000 }, apartment: { low: 10000, high: 200000 }, hotel: { low: 10000, high: 100000 }, transit: { low: 5000, high: 50000 },
};
const DAILY_VISITS: Record<Category, { low: number; high: number }> = {
  office: { low: 200, high: 1000 }, gym: { low: 300, high: 1500 }, hospital: { low: 500, high: 3000 }, school: { low: 500, high: 5000 },
  manufacturing: { low: 100, high: 800 }, apartment: { low: 100, high: 500 }, hotel: { low: 200, high: 1000 }, transit: { low: 1000, high: 10000 },
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function normalizeByBenchmark(value: number, low: number, high: number): number {
  if (high <= low) return 50;
  return clamp(((value - low) / (high - low)) * 100);
}

export function normalizeGoogleRatings(ratingsTotal: number | null | undefined, category: Category): number {
  if (!ratingsTotal || ratingsTotal <= 0) return 50;
  const b = GOOGLE_BENCHMARKS[category];
  return normalizeByBenchmark(ratingsTotal, b.low, b.high);
}

export function normalizePopularTimes(busyness: number[] | null | undefined): number {
  if (!busyness || busyness.length === 0) return 50;
  const safe = busyness.filter(v => Number.isFinite(v)).map(v => clamp(v));
  if (safe.length === 0) return 50;
  const peak = Math.max(...safe);
  const average = safe.reduce((a, b) => a + b, 0) / safe.length;
  return clamp(peak * 0.6 + average * 0.4);
}

export function normalizeYelpReviews(reviewCount: number | null | undefined, category: Category): number {
  if (!reviewCount || reviewCount <= 0) return 50;
  const b = YELP_BENCHMARKS[category];
  return normalizeByBenchmark(reviewCount, b.low, b.high);
}

export function normalizePOIDensity(poiCount: number | null | undefined): number {
  if (!poiCount || poiCount <= 0) return 25;
  return clamp((poiCount / 50) * 100);
}

export function normalizeTransitProximity(distanceMiles: number | null | undefined): number {
  if (distanceMiles === null || distanceMiles === undefined) return 25;
  if (distanceMiles <= 0.25) return 100;
  if (distanceMiles <= 0.5) return 75;
  if (distanceMiles <= 1.0) return 50;
  return 25;
}

export function normalizeBuildingSize(sqft: number | null | undefined, category: Category): number {
  if (!sqft || sqft <= 0) return 50;
  const b = BUILDING_BENCHMARKS[category];
  return normalizeByBenchmark(sqft, b.low, b.high);
}

export function normalizeCensusDensity(popPerSqMi: number | null | undefined): number {
  if (!popPerSqMi || popPerSqMi <= 0) return 25;
  if (popPerSqMi < 5000) return 25;
  if (popPerSqMi < 10000) return 50;
  if (popPerSqMi < 20000) return 75;
  return 100;
}

function formatHour(hour: number): string {
  const h = hour % 24;
  const suffix = h >= 12 ? 'pm' : 'am';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${suffix}`;
}

export function extractPeakHours(busyness: number[] | null | undefined): string[] {
  if (!busyness || busyness.length === 0) return ['8am-10am', '12pm-2pm'];
  const peaks: Array<{ start: number; end: number }> = [];
  let start: number | null = null;

  for (let i = 0; i < busyness.length; i++) {
    const isPeak = (busyness[i] ?? 0) >= 70;
    if (isPeak && start === null) start = i;
    if ((!isPeak || i === busyness.length - 1) && start !== null) {
      const end = isPeak && i === busyness.length - 1 ? i + 1 : i;
      peaks.push({ start, end });
      start = null;
    }
  }

  if (peaks.length === 0) return ['8am-10am', '12pm-2pm'];
  return peaks.slice(0, 3).map(p => `${formatHour(p.start)}-${formatHour(p.end)}`);
}

function buildInsights(
  normalized: NormalizedSignals,
  category: Category,
  weights: Weights,
): { helping: string[]; hurting: string[] } {
  const helping: string[] = [];
  const hurting: string[] = [];

  if (normalized.googleRatings >= 80) helping.push(`High engagement volume (top 20% for ${category}s)`);
  if (normalized.googleRatings < 40) hurting.push('Low review volume suggests less foot traffic');

  if (normalized.popularTimes >= 80) helping.push('Strong peak hour patterns aligned with demand');
  if (normalized.popularTimes < 40) hurting.push('Inconsistent traffic patterns throughout the day');

  if (normalized.poiDensity >= 75) helping.push('High-density area with many nearby businesses');
  if (normalized.poiDensity < 30) hurting.push('Isolated location with few nearby attractions');

  if (normalized.transit >= 90) helping.push('Excellent transit access (walking distance)');
  if (normalized.transit === 25) hurting.push('No transit access nearby (requires vehicle)');

  if (normalized.buildingSize >= 75 && weights.buildingSize >= 15) helping.push('Large facility indicates high capacity');
  if (normalized.censusDensity >= 75) helping.push('Dense urban area with high population');

  return {
    helping: helping.length > 0 ? helping : ['Moderate conditions for vending placement'],
    hurting: hurting.length > 0 ? hurting : ['No major concerns identified'],
  };
}

interface BuildFootTrafficInput {
  category: Category;
  placeName: string;
  lat: number;
  lng: number;
  googleRatingsTotal?: number;
  censusDensity?: number;
}

export async function buildFootTraffic(input: BuildFootTrafficInput): Promise<FootTraffic> {
  const weights = CATEGORY_WEIGHTS[input.category];

  const [popularTimesRes, yelpRes, osmRes] = await Promise.allSettled([
    getPopularTimes(input.placeName, input.lat, input.lng),
    getYelpSignals(input.placeName, input.lat, input.lng),
    getOSMSignals(input.lat, input.lng),
  ]);

  const popularTimesData = popularTimesRes.status === 'fulfilled'
    ? popularTimesRes.value
    : { busynessHours: null, peakHours: [] };
  const yelp = yelpRes.status === 'fulfilled' ? yelpRes.value : { reviewCount: null };
  const osm = osmRes.status === 'fulfilled'
    ? osmRes.value
    : { poiCount: null, transitDistanceMiles: null, buildingSqft: null };

  const rawSignals: FootTrafficSignals = {
    googleRatings: input.googleRatingsTotal ?? null,
    popularTimes: popularTimesData.busynessHours,
    yelpReviews: yelp.reviewCount,
    poiDensity: osm.poiCount,
    transit: osm.transitDistanceMiles,
    buildingSize: osm.buildingSqft,
    censusDensity: input.censusDensity ?? null,
  };

  const normalized: NormalizedSignals = {
    googleRatings: normalizeGoogleRatings(rawSignals.googleRatings, input.category),
    popularTimes: normalizePopularTimes(rawSignals.popularTimes),
    yelpReviews: normalizeYelpReviews(rawSignals.yelpReviews, input.category),
    poiDensity: normalizePOIDensity(rawSignals.poiDensity),
    transit: normalizeTransitProximity(rawSignals.transit),
    buildingSize: normalizeBuildingSize(rawSignals.buildingSize, input.category),
    censusDensity: normalizeCensusDensity(rawSignals.censusDensity),
  };

  const score = clamp(
    normalized.googleRatings * (weights.googleRatings / 100) +
    normalized.popularTimes * (weights.popularTimes / 100) +
    normalized.yelpReviews * (weights.yelpReviews / 100) +
    normalized.poiDensity * (weights.poiDensity / 100) +
    normalized.transit * (weights.transit / 100) +
    normalized.buildingSize * (weights.buildingSize / 100) +
    normalized.censusDensity * (weights.censusDensity / 100)
  );

  const range = DAILY_VISITS[input.category];
  const estimate = Math.round(range.low + (range.high - range.low) * (score / 100));
  const lowerBound = Math.round(estimate * 0.8);
  const upperBound = Math.round(estimate * 1.2);

  // Yelp is deferred (paid API, no free tier). Only 6 signals are free/active.
  // Confidence thresholds are based on 6 available signals (Yelp excluded).
  const availableSignals = [
    rawSignals.googleRatings,
    rawSignals.popularTimes,
    // rawSignals.yelpReviews — deferred, paid API
    rawSignals.poiDensity,
    rawSignals.transit,
    rawSignals.buildingSize,
    rawSignals.censusDensity,
  ];
  const available = availableSignals.filter(v => v !== null && v !== undefined).length;
  const total = 6; // Yelp excluded until revenue justifies cost

  const confidence = available >= 5
    ? { level: 'HIGH' as const, accuracy: '±10%' as const }
    : available >= 3
      ? { level: 'MEDIUM' as const, accuracy: '±20%' as const }
      : { level: 'LOW' as const, accuracy: '±30%' as const };

  return {
    score: Math.round(score),
    peakHours: popularTimesData.peakHours.length > 0 ? popularTimesData.peakHours : extractPeakHours(popularTimesData.busynessHours),
    dailyEstimate: estimate,
    proximityToTransit: normalized.transit >= 50,
    dailyVisitRange: `${lowerBound.toLocaleString()}-${upperBound.toLocaleString()}`,
    confidence: {
      level: confidence.level,
      percentage: Math.round((available / total) * 100),
      available,
      total,
      accuracy: confidence.accuracy,
    },
    breakdown: {
      raw: rawSignals,
      normalized,
      weights,
      weightedScore: Math.round(score),
    },
    insights: buildInsights(normalized, input.category, weights),
  };
}
