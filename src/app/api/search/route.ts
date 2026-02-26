/**
 * /api/search — V2 Server-side location search
 *
 * Flow: Geocode → Nearby Search → Place Details → Census → V2 Scoring
 * Returns fully scored LocationData[] + HeatMapDataPoint[]
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  Category,
  Demographics,
  Competition,
  FootTraffic,
  LocationData,
  HeatMapDataPoint,
} from '@/lib/types';
import { calculateLocationScore, generateAIReasoning, V2ScoringInput } from '@/lib/scoring';
import { buildFootTraffic } from '@/lib/foot-traffic-aggregator';

const YELP_API_KEY = process.env.YELP_API_KEY || '';
void YELP_API_KEY; // consumed by yelp.ts via env directly

// ─── Keys ───────────────────────────────────────────────────────────────────
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const CENSUS_API_KEY = process.env.CENSUS_API_KEY || '';

// ─── Caches (in-memory, serverless function lifetime) ───────────────────────
const demographicsCache = new Map<string, Demographics>();
const placeDetailsCache = new Map<string, PlaceDetails>();

// ─── Helpers ────────────────────────────────────────────────────────────────

function deterministicSeed(input: string): number {
  let hash = 0;
  const normalized = input.trim().toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function categoryToPlaceTypes(category: Category): string[] {
  // Return multiple relevant place types to cast a wider net
  switch (category) {
    case 'office':        return ['office', 'accounting', 'insurance_agency', 'real_estate_agency', 'lawyer'];
    case 'gym':           return ['gym', 'health', 'physiotherapist', 'spa'];
    case 'hospital':      return ['hospital', 'doctor', 'dentist', 'pharmacy'];
    case 'school':        return ['school', 'university', 'library', 'secondary_school'];
    case 'manufacturing': return ['storage', 'moving_company', 'car_repair', 'electrician'];
    case 'apartment':     return ['real_estate_agency', 'laundry', 'convenience_store'];
    case 'hotel':         return ['lodging', 'hotel', 'motel'];
    case 'transit':       return ['transit_station', 'bus_station', 'subway_station', 'train_station'];
    default:              return ['establishment'];
  }
}

/** Keyword-based text search types for broader discovery */
export function categoryToKeywords(category: Category): string[] {
  switch (category) {
    case 'office':        return ['office building', 'coworking space', 'business center'];
    case 'gym':           return ['fitness center', 'gym', 'recreation center'];
    case 'hospital':      return ['hospital', 'medical center', 'clinic'];
    case 'school':        return ['school', 'college', 'university campus'];
    case 'manufacturing': return ['warehouse', 'industrial park', 'factory'];
    case 'apartment':     return ['apartment complex', 'residential building'];
    case 'hotel':         return ['hotel', 'resort', 'motel'];
    case 'transit':       return ['train station', 'bus terminal', 'transit hub'];
    default:              return ['commercial building'];
  }
}

// ─── Google APIs ────────────────────────────────────────────────────────────

interface GeoResult { lat: number; lng: number; formattedAddress: string }

export async function geocode(query: string): Promise<GeoResult | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const match = data?.results?.[0];
    if (!match) return null;
    return {
      lat: match.geometry.location.lat,
      lng: match.geometry.location.lng,
      formattedAddress: match.formatted_address,
    };
  } catch { return null; }
}

interface NearbyPlace {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingsTotal?: number;
  types: string[];
  businessStatus?: string;
}

export async function findNearbyPlaces(lat: number, lng: number, category: Category, radius = 5000): Promise<NearbyPlace[]> {
  const placeTypes = categoryToPlaceTypes(category);
  const keywords = categoryToKeywords(category);
  const seen = new Set<string>(); // Dedupe by placeId
  const allPlaces: NearbyPlace[] = [];

  function addPlace(place: NearbyPlace) {
    if (!seen.has(place.placeId)) {
      seen.add(place.placeId);
      allPlaces.push(place);
    }
  }

  function parsePlaceResult(r: Record<string, unknown>): NearbyPlace {
    const geo = r.geometry as { location: { lat: number; lng: number } };
    return {
      placeId: r.place_id as string,
      name: r.name as string,
      address: (r.vicinity || r.formatted_address || r.name) as string,
      lat: geo.location.lat,
      lng: geo.location.lng,
      rating: r.rating as number | undefined,
      userRatingsTotal: r.user_ratings_total as number | undefined,
      types: (r.types as string[]) || [],
      businessStatus: r.business_status as string | undefined,
    };
  }

  // Strategy 1: Nearby Search by type (up to 3 types, all results)
  const typeSearches = placeTypes.slice(0, 3).map(async (type) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (data.results) {
        for (const r of data.results.slice(0, 20)) {
          addPlace(parsePlaceResult(r));
        }
      }
    } catch { /* skip */ }
  });

  // Strategy 2: Text Search for broader keyword-based discovery (1 keyword)
  const textSearches = keywords.slice(0, 1).map(async (keyword) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword)}&location=${lat},${lng}&radius=${radius}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (data.results) {
        for (const r of data.results.slice(0, 20)) {
          addPlace(parsePlaceResult(r));
        }
      }
    } catch { /* skip */ }
  });

  // Run all searches in parallel
  await Promise.all([...typeSearches, ...textSearches]);

  // Sort by rating/popularity so we process the best ones first
  allPlaces.sort((a, b) => (b.userRatingsTotal || 0) - (a.userRatingsTotal || 0));

  return allPlaces;
}

// ─── Google Places Details API ──────────────────────────────────────────────

interface PlaceDetails {
  types: string[];
  businessStatus?: string;
  userRatingsTotal?: number;
  rating?: number;
  hasOpeningHours: boolean;
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  // Check cache first
  if (placeDetailsCache.has(placeId)) {
    return placeDetailsCache.get(placeId)!;
  }

  try {
    const fields = 'types,business_status,user_ratings_total,rating,opening_hours';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.result;
    if (!result) return null;

    const details: PlaceDetails = {
      types: result.types || [],
      businessStatus: result.business_status,
      userRatingsTotal: result.user_ratings_total,
      rating: result.rating,
      hasOpeningHours: !!(result.opening_hours),
    };

    placeDetailsCache.set(placeId, details);
    return details;
  } catch { return null; }
}

// ─── Census APIs ────────────────────────────────────────────────────────────

interface CensusTract {
  state: string;
  county: string;
  tract: string;
  areaLandSqMeters?: number;
}

async function getCensusTract(lat: number, lng: number): Promise<CensusTract | null> {
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const tract = data?.result?.geographies?.['Census Tracts']?.[0];
    if (!tract) return null;
    return {
      state: tract.STATE,
      county: tract.COUNTY,
      tract: tract.TRACT,
      areaLandSqMeters: tract.AREALAND ? parseInt(tract.AREALAND) : undefined,
    };
  } catch { return null; }
}

async function fetchDemographics(tract: CensusTract): Promise<Demographics | null> {
  try {
    const variables = 'B19013_001E,B01003_001E,B01002_001E,B23025_004E,B23025_003E';
    const url = `https://api.census.gov/data/2022/acs/acs5?get=${variables}&for=tract:${tract.tract}&in=state:${tract.state}+county:${tract.county}&key=${CENSUS_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length < 2) return null;
    const v = data[1];
    const medianIncome = parseInt(v[0]) || 55000;
    const population = parseInt(v[1]) || 10000;
    const medianAge = parseFloat(v[2]) || 35;
    const employed = parseInt(v[3]) || 0;
    const laborForce = parseInt(v[4]) || 1;
    const employmentRate = laborForce > 0 ? Math.min(employed / laborForce, 1) : 0.85;

    // Calculate population density (people per square mile)
    let populationDensity = 5000; // Default: moderate urban
    if (tract.areaLandSqMeters && tract.areaLandSqMeters > 0) {
      const areaSqMiles = tract.areaLandSqMeters / 2_589_988;
      populationDensity = areaSqMiles > 0 ? Math.round(population / areaSqMiles) : 5000;
    }

    return {
      medianIncome: Math.max(medianIncome, 0),
      population,
      medianAge,
      employmentRate: Math.round(employmentRate * 100) / 100,
      populationDensity,
    };
  } catch { return null; }
}

export async function getDemographicsForLocation(lat: number, lng: number): Promise<{ demographics: Demographics; hasCensusData: boolean }> {
  const fallback: Demographics = {
    medianIncome: 55000,
    population: 10000,
    medianAge: 35,
    employmentRate: 0.85,
    populationDensity: 5000,
  };
  const tract = await getCensusTract(lat, lng);
  if (!tract) return { demographics: fallback, hasCensusData: false };

  const cacheKey = `${tract.state}-${tract.county}-${tract.tract}`;
  if (demographicsCache.has(cacheKey)) {
    return { demographics: demographicsCache.get(cacheKey)!, hasCensusData: true };
  }

  if (CENSUS_API_KEY) {
    const demo = await fetchDemographics(tract);
    if (demo) {
      demographicsCache.set(cacheKey, demo);
      return { demographics: demo, hasCensusData: true };
    }
  }
  return { demographics: fallback, hasCensusData: false };
}

// ─── Foot Traffic Estimation (aggregator-powered) ────────────────────────────

async function estimateFootTraffic(
  placeName: string,
  lat: number,
  lng: number,
  userRatingsTotal: number,
  demographics: Demographics,
  category: Category,
): Promise<FootTraffic> {
  // censusDensity: derive from populationDensity (already per sq mi from Census)
  const censusDensity = demographics.populationDensity ?? null;

  return buildFootTraffic({
    category,
    placeName,
    lat,
    lng,
    googleRatingsTotal: userRatingsTotal || undefined,
    censusDensity: censusDensity ?? undefined,
  });
}

// ─── V2 Competition Estimation ──────────────────────────────────────────────

export function estimateCompetition(allPlaces: NearbyPlace[], currentIndex: number): Competition {
  const count = Math.max(0, allPlaces.length - 1);
  const saturationLevel: 'low' | 'medium' | 'high' = count <= 2 ? 'low' : count <= 5 ? 'medium' : 'high';

  const current = allPlaces[currentIndex];
  let nearestDist = 999;
  allPlaces.forEach((p, i) => {
    if (i === currentIndex) return;
    const dlat = (p.lat - current.lat) * 69;
    const dlng = (p.lng - current.lng) * 54.6;
    const dist = Math.sqrt(dlat * dlat + dlng * dlng);
    if (dist < nearestDist) nearestDist = dist;
  });

  return {
    count: Math.min(count, 5),
    nearestDistance: nearestDist === 999 ? 1.5 : Math.round(nearestDist * 10) / 10,
    saturationLevel,
    placeCountInRadius: allPlaces.length,
  };
}

// ─── Heat Map Data Generation ───────────────────────────────────────────────

function generateHeatMapData(
  allPlaces: NearbyPlace[],
  scores: Map<string, number>,
): HeatMapDataPoint[] {
  const points: HeatMapDataPoint[] = [];

  // Each place becomes a weighted point
  for (const place of allPlaces) {
    const scoreVal = scores.get(place.placeId) || 50;
    points.push({
      lat: place.lat,
      lng: place.lng,
      weight: Math.max(0.1, scoreVal / 100),
      placeCount: 1,
    });
  }

  return points;
}

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, categories, lat, lng } = body as {
      query: string;
      categories: Category[];
      lat?: number;
      lng?: number;
    };

    if (!query || !categories?.length) {
      return NextResponse.json({ error: 'Missing query or categories' }, { status: 400 });
    }

    // Step 1: Resolve center coordinates
    let centerLat = lat;
    let centerLng = lng;

    if (!centerLat || !centerLng) {
      const geo = await geocode(query);
      if (!geo) {
        return NextResponse.json({ locations: [], fallback: true });
      }
      centerLat = geo.lat;
      centerLng = geo.lng;
    }

    // Step 2: For each category, find real nearby places and enrich with V2 scoring
    const results: LocationData[] = [];
    const allFoundPlaces: NearbyPlace[] = [];
    const placeScores = new Map<string, number>();

    for (const category of categories) {
      const places = await findNearbyPlaces(centerLat, centerLng, category);

      if (places.length === 0) {
        // Area-level result — V2 scores this LOW with negative signals
        const { demographics, hasCensusData } = await getDemographicsForLocation(centerLat, centerLng);

        const footTraffic: FootTraffic = {
          score: 0,
          peakHours: ['N/A'],
          dailyEstimate: Math.max(50, Math.round(demographics.population * 0.003)),
          proximityToTransit: false,
        };
        const competition: Competition = {
          count: 0,
          nearestDistance: 0,
          saturationLevel: 'low',
          placeCountInRadius: 0,
        };

        const scoringInput: V2ScoringInput = {
          demographics,
          competition,
          footTraffic,
          category,
          placeTypes: [],
          userRatingsTotal: 0,
          isAreaLevel: true,
          hasPlaceDetails: false,
          hasCensusData,
        };

        const score = calculateLocationScore(scoringInput);
        const reasoning = generateAIReasoning(score, category);

        results.push({
          id: `loc-area-${Date.now()}-${category}`,
          address: query,
          lat: centerLat,
          lng: centerLng,
          category,
          score,
          demographics,
          competition,
          footTraffic: { ...footTraffic, score: score.footTraffic },
          aiReasoning: reasoning,
          placeTypes: [],
          businessStatus: undefined,
          userRatingsTotal: 0,
        });
        continue;
      }

      // Process up to 20 places per category
      const placesToProcess = places.slice(0, 20);

      // Fetch Place Details in parallel (batched to avoid rate limits)
      const detailsPromises = placesToProcess.map(p => getPlaceDetails(p.placeId));
      const allDetails = await Promise.all(detailsPromises);

      // Get demographics for search center once (all places are in same general area)
      const { demographics: areaDemographics, hasCensusData: areaHasCensus } =
        await getDemographicsForLocation(centerLat, centerLng);

      for (let i = 0; i < placesToProcess.length; i++) {
        const place = placesToProcess[i];
        const details = allDetails[i];
        allFoundPlaces.push(place);

        // Use area-level demographics (same census tract for nearby places)
        const demographics = areaDemographics;
        const hasCensusData = areaHasCensus;

        // Merge Nearby Search + Details data
        const placeTypes = details?.types || place.types || [];
        const userRatingsTotal = details?.userRatingsTotal ?? place.userRatingsTotal ?? 0;
        const businessStatus = details?.businessStatus || place.businessStatus;
        const hasOpeningHours = details?.hasOpeningHours ?? undefined;

        const footTraffic = await estimateFootTraffic(place.name, place.lat, place.lng, userRatingsTotal, demographics, category);
        const competition = estimateCompetition(placesToProcess, i);

        const scoringInput: V2ScoringInput = {
          demographics,
          competition,
          footTraffic,
          category,
          placeTypes,
          userRatingsTotal,
          businessStatus,
          hasOpeningHours,
          isAreaLevel: false,
          hasPlaceDetails: !!details,
          hasCensusData,
        };

        const score = calculateLocationScore(scoringInput);
        const reasoning = generateAIReasoning(score, category);

        placeScores.set(place.placeId, score.overall);

        results.push({
          id: `loc-${Date.now()}-${category}-${i}`,
          address: `${place.name}, ${place.address}`,
          lat: place.lat,
          lng: place.lng,
          category,
          score,
          demographics,
          competition,
          footTraffic: { ...footTraffic, score: score.footTraffic },
          aiReasoning: reasoning,
          placeTypes,
          businessStatus: businessStatus as LocationData['businessStatus'],
          userRatingsTotal,
        });
      }
    }

    // Sort by overall score descending
    results.sort((a, b) => b.score.overall - a.score.overall);

    // Generate heat map data from all found places
    const heatMapPoints = generateHeatMapData(allFoundPlaces, placeScores);

    return NextResponse.json({
      locations: results,
      center: { lat: centerLat, lng: centerLng },
      heatMapPoints,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
