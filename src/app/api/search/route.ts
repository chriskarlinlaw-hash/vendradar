/**
 * /api/search — Server-side location search
 *
 * Proxies Google Places Nearby Search + Census ACS calls that can't run
 * from the browser (CORS). Returns fully scored LocationData[].
 */

import { NextRequest, NextResponse } from 'next/server';
import { Category, Demographics, Competition, FootTraffic, LocationData } from '@/lib/types';
import { calculateLocationScore, generateAIReasoning } from '@/lib/scoring';

// ─── Keys (server-side only — no NEXT_PUBLIC prefix needed for Census) ──
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const CENSUS_API_KEY = process.env.CENSUS_API_KEY || '';

// ─── Helpers ─────────────────────────────────────────────────────────────

function deterministicSeed(input: string): number {
  let hash = 0;
  const normalized = input.trim().toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function categoryToPlaceTypes(category: Category): string[] {
  switch (category) {
    case 'office':        return ['office'];
    case 'gym':           return ['gym'];
    case 'hospital':      return ['hospital'];
    case 'school':        return ['school'];
    case 'manufacturing': return ['storage'];
    case 'apartment':     return ['apartment_complex'];
    case 'hotel':         return ['lodging'];
    case 'transit':       return ['transit_station'];
    default:              return ['establishment'];
  }
}

// ─── Google APIs ─────────────────────────────────────────────────────────

interface GeoResult { lat: number; lng: number; formattedAddress: string }

async function geocode(query: string): Promise<GeoResult | null> {
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
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingsTotal?: number;
  types: string[];
}

async function findNearbyPlaces(lat: number, lng: number, category: Category, radius = 3000): Promise<NearbyPlace[]> {
  const placeTypes = categoryToPlaceTypes(category);
  const allPlaces: NearbyPlace[] = [];

  for (const type of placeTypes.slice(0, 1)) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.results) {
        for (const place of data.results.slice(0, 8)) {
          allPlaces.push({
            name: place.name,
            address: place.vicinity || place.formatted_address || place.name,
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            rating: place.rating,
            userRatingsTotal: place.user_ratings_total,
            types: place.types || [],
          });
        }
      }
    } catch { continue; }
  }
  return allPlaces;
}

// ─── Census APIs ─────────────────────────────────────────────────────────

interface CensusTract { state: string; county: string; tract: string }

async function getCensusTract(lat: number, lng: number): Promise<CensusTract | null> {
  try {
    const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const tract = data?.result?.geographies?.['Census Tracts']?.[0];
    if (!tract) return null;
    return { state: tract.STATE, county: tract.COUNTY, tract: tract.TRACT };
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
    return {
      medianIncome: Math.max(medianIncome, 0),
      population,
      medianAge,
      employmentRate: Math.round(employmentRate * 100) / 100,
    };
  } catch { return null; }
}

// In-memory cache for the lifetime of the serverless function
const demographicsCache = new Map<string, Demographics>();

async function getDemographicsForLocation(lat: number, lng: number): Promise<Demographics> {
  const fallback: Demographics = { medianIncome: 55000, population: 10000, medianAge: 35, employmentRate: 0.85 };
  const tract = await getCensusTract(lat, lng);
  if (!tract) return fallback;

  const cacheKey = `${tract.state}-${tract.county}-${tract.tract}`;
  if (demographicsCache.has(cacheKey)) return demographicsCache.get(cacheKey)!;

  if (CENSUS_API_KEY) {
    const demo = await fetchDemographics(tract);
    if (demo) {
      demographicsCache.set(cacheKey, demo);
      return demo;
    }
  }
  return fallback;
}

// ─── Scoring helpers ─────────────────────────────────────────────────────

function estimateFootTraffic(place: NearbyPlace, demographics: Demographics): FootTraffic {
  const seed = deterministicSeed(place.name + place.address);
  const ratingsProxy = place.userRatingsTotal || 100;
  const baseScore = Math.min(95, 50 + Math.floor(Math.log(ratingsProxy + 1) * 10));
  const densityBonus = demographics.population > 15000 ? 5 : demographics.population > 8000 ? 2 : 0;

  return {
    score: Math.min(98, baseScore + densityBonus),
    peakHours: ['8am', '12pm', '5pm'],
    dailyEstimate: Math.max(200, Math.floor(ratingsProxy * 3 + (seed % 300))),
    proximityToTransit: demographics.population > 12000,
  };
}

function estimateCompetition(allPlaces: NearbyPlace[], currentIndex: number): Competition {
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
  };
}

// ─── Route Handler ───────────────────────────────────────────────────────

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

    // Step 2: For each category, find real nearby places and enrich
    const results: LocationData[] = [];

    for (const category of categories) {
      const places = await findNearbyPlaces(centerLat, centerLng, category);

      if (places.length === 0) {
        // Return a single area-level result
        const demographics = await getDemographicsForLocation(centerLat, centerLng);
        const seed = deterministicSeed(query + category);
        const footTraffic: FootTraffic = {
          score: 65 + (seed % 20),
          peakHours: ['8am', '12pm', '5pm'],
          dailyEstimate: 500 + ((seed * 7) % 800),
          proximityToTransit: demographics.population > 12000,
        };
        const competition: Competition = { count: 0, nearestDistance: 1.5, saturationLevel: 'low' };
        const score = calculateLocationScore(demographics, competition, footTraffic, category);
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
          footTraffic,
          aiReasoning: reasoning,
        });
        continue;
      }

      // Process up to 6 places per category
      const placesToProcess = places.slice(0, 6);
      for (let i = 0; i < placesToProcess.length; i++) {
        const place = placesToProcess[i];
        const demographics = await getDemographicsForLocation(place.lat, place.lng);
        const footTraffic = estimateFootTraffic(place, demographics);
        const competition = estimateCompetition(placesToProcess, i);
        const score = calculateLocationScore(demographics, competition, footTraffic, category);
        const reasoning = generateAIReasoning(score, category);

        results.push({
          id: `loc-${Date.now()}-${category}-${i}`,
          address: `${place.name}, ${place.address}`,
          lat: place.lat,
          lng: place.lng,
          category,
          score,
          demographics,
          competition,
          footTraffic,
          aiReasoning: reasoning,
        });
      }
    }

    // Sort by overall score descending
    results.sort((a, b) => b.score.overall - a.score.overall);

    return NextResponse.json({ locations: results, center: { lat: centerLat, lng: centerLng } });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
