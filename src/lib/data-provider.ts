/**
 * Data Provider Abstraction Layer
 *
 * This module defines the interface for location data and provides
 * both mock and real API implementations. The app auto-selects based
 * on available API keys.
 *
 * To switch from mock to real data:
 * 1. Add CENSUS_API_KEY to .env.local
 * 2. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local
 * 3. The provider will automatically use real APIs
 */

import { LocationData, Category, Demographics, Competition, FootTraffic } from './types';
import { calculateLocationScore, generateAIReasoning } from './scoring';

// ─── Interface ────────────────────────────────────────────────────────

export interface DataProvider {
  searchLocations(query: string, categories: Category[]): Promise<LocationData[]>;
  getLocationByAddress(address: string, category: Category): Promise<LocationData | null>;
}

// ─── Census API Client ────────────────────────────────────────────────

const CENSUS_API_KEY = process.env.CENSUS_API_KEY || '';
const hasCensusKey = CENSUS_API_KEY.length > 0 && CENSUS_API_KEY !== 'your_census_api_key_here';

interface CensusGeoResult {
  state: string;
  county: string;
  tract: string;
  lat: number;
  lng: number;
}

/**
 * Use Google Geocoding to convert city name to lat/lng, then reverse geocode to Census tract.
 * Census geocoder needs street addresses, not city names.
 */
async function geocodeToCensusTract(query: string): Promise<CensusGeoResult | null> {
  try {
    // First, try Census geocoder directly (works for street addresses)
    const encodedQuery = encodeURIComponent(query);
    let url = `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=${encodedQuery}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;

    let res = await fetch(url);
    if (!res.ok) return null;

    let data = await res.json();
    let match = data?.result?.addressMatches?.[0];
    
    // If Census geocoder fails (city name without address), use Google Geocoding
    if (!match) {
      const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      if (!googleApiKey) return null;
      
      const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedQuery}&key=${googleApiKey}`;
      const googleRes = await fetch(googleUrl);
      if (!googleRes.ok) return null;
      
      const googleData = await googleRes.json();
      const googleMatch = googleData?.results?.[0];
      if (!googleMatch) return null;
      
      const lat = googleMatch.geometry.location.lat;
      const lng = googleMatch.geometry.location.lng;
      
      // Reverse geocode lat/lng to Census tract
      url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
      res = await fetch(url);
      if (!res.ok) return null;
      
      data = await res.json();
      const censusResult = data?.result?.geographies?.['Census Tracts']?.[0];
      if (!censusResult) return null;
      
      return {
        state: censusResult.STATE,
        county: censusResult.COUNTY,
        tract: censusResult.TRACT,
        lat,
        lng,
      };
    }

    const geographies = match.geographies?.['Census Tracts']?.[0];
    if (!geographies) return null;

    // Extract coordinates from geocoder response
    const coords = match.coordinates;
    const lat = coords?.y || 0;
    const lng = coords?.x || 0;

    return {
      state: geographies.STATE,
      county: geographies.COUNTY,
      tract: geographies.TRACT,
      lat,
      lng,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch demographics from US Census ACS 5-Year Estimates.
 * Variables:
 *   B19013_001E = Median household income
 *   B01003_001E = Total population
 *   B01002_001E = Median age
 *   B23025_004E = Employed population (civilian labor force)
 *   B23025_003E = Civilian labor force total
 */
async function fetchCensusDemographics(geo: CensusGeoResult): Promise<Demographics | null> {
  try {
    const variables = 'B19013_001E,B01003_001E,B01002_001E,B23025_004E,B23025_003E';
    const url = `https://api.census.gov/data/2022/acs/acs5?get=${variables}&for=tract:${geo.tract}&in=state:${geo.state}+county:${geo.county}&key=${CENSUS_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.length < 2) return null;

    // First row is headers, second row is values
    const values = data[1];
    const medianIncome = parseInt(values[0]) || 55000;
    const population = parseInt(values[1]) || 10000;
    const medianAge = parseFloat(values[2]) || 35;
    const employed = parseInt(values[3]) || 0;
    const laborForce = parseInt(values[4]) || 1;
    const employmentRate = laborForce > 0 ? Math.min(employed / laborForce, 1) : 0.85;

    return {
      medianIncome: Math.max(medianIncome, 0), // Census returns -666666666 for missing data
      population,
      medianAge,
      employmentRate: Math.round(employmentRate * 100) / 100,
    };
  } catch {
    return null;
  }
}

// ─── Real Data Provider (Census API) ──────────────────────────────────

class CensusDataProvider implements DataProvider {
  async searchLocations(query: string, categories: Category[]): Promise<LocationData[]> {
    // For MVP, geocode the query and fetch tract-level demographics
    const geo = await geocodeToCensusTract(query);
    if (!geo) {
      // Fallback to mock if geocoding fails
      const { searchLocations: mockSearch } = await import('./mock-data');
      return mockSearch(query, categories);
    }

    const demographics = await fetchCensusDemographics(geo);
    if (!demographics) {
      const { searchLocations: mockSearch } = await import('./mock-data');
      return mockSearch(query, categories);
    }

    // TODO: Replace these with real Google Places API data
    // For now, use real Census demographics + estimated foot traffic & competition
    const footTraffic: FootTraffic = {
      score: 70 + Math.floor(Math.random() * 20),
      peakHours: ['8am', '12pm', '5pm'],
      dailyEstimate: 800 + Math.floor(Math.random() * 600),
      proximityToTransit: true,
    };

    const competition: Competition = {
      count: Math.floor(Math.random() * 3),
      nearestDistance: 0.3 + Math.random() * 0.7,
      saturationLevel: 'low',
    };

    // Generate results for each category
    return categories.map((category, index) => {
      const score = calculateLocationScore(demographics, competition, footTraffic, category);
      const reasoning = generateAIReasoning(score, category);

      return {
        id: `loc-census-${Date.now()}-${index}`,
        address: query,
        lat: geo.lat,
        lng: geo.lng,
        category,
        score,
        demographics,
        competition,
        footTraffic,
        aiReasoning: reasoning,
      };
    });
  }

  async getLocationByAddress(address: string, category: Category): Promise<LocationData | null> {
    const results = await this.searchLocations(address, [category]);
    return results[0] || null;
  }
}

// ─── Mock Data Provider (fallback) ────────────────────────────────────

class MockDataProvider implements DataProvider {
  async searchLocations(query: string, categories: Category[]): Promise<LocationData[]> {
    const { searchLocations } = await import('./mock-data');
    return searchLocations(query, categories);
  }

  async getLocationByAddress(address: string, category: Category): Promise<LocationData | null> {
    const { getLocationByAddress } = await import('./mock-data');
    return getLocationByAddress(address, category);
  }
}

// ─── Factory ──────────────────────────────────────────────────────────

/**
 * Returns the appropriate data provider based on available API keys.
 *
 * Priority:
 * 1. Census API (if CENSUS_API_KEY is set) — real demographics
 * 2. Mock data (fallback) — hardcoded demo data
 */
export function getDataProvider(): DataProvider {
  if (hasCensusKey) {
    return new CensusDataProvider();
  }
  return new MockDataProvider();
}

// Export a default instance
export const dataProvider = getDataProvider();
