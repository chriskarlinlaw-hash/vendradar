/**
 * Data Provider — Client-side wrapper
 *
 * Calls /api/search (server-side) which handles Google Places + Census lookups,
 * then returns scored LocationData[]. Falls back to mock data if the API route
 * returns an error or if no Google key is configured.
 */

import { LocationData, Category, HeatMapDataPoint } from './types';

// ─── Interface ────────────────────────────────────────────────────────────

export interface SearchResponse {
  locations: LocationData[];
  center?: { lat: number; lng: number };
  heatMapPoints?: HeatMapDataPoint[];
}

export interface DataProvider {
  searchLocations(query: string, categories: Category[], lat?: number, lng?: number): Promise<SearchResponse>;
  getLocationByAddress(address: string, category: Category): Promise<LocationData | null>;
}

// ─── Real Data Provider (calls server API route) ──────────────────────────

class RealDataProvider implements DataProvider {
  async searchLocations(query: string, categories: Category[], lat?: number, lng?: number): Promise<SearchResponse> {
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, categories, lat, lng }),
      });

      if (!res.ok) throw new Error(`API returned ${res.status}`);

      const data = await res.json();

      // If the server couldn't geocode, fall back to mock
      if (data.fallback) {
        const { searchLocations: mockSearch } = await import('./mock-data');
        const locations = await mockSearch(query, categories);
        return { locations };
      }

      return {
        locations: data.locations as LocationData[],
        center: data.center,
        heatMapPoints: data.heatMapPoints as HeatMapDataPoint[] | undefined,
      };
    } catch (err) {
      console.error('Search API error, falling back to mock:', err);
      const { searchLocations: mockSearch } = await import('./mock-data');
      const locations = await mockSearch(query, categories);
      return { locations };
    }
  }

  async getLocationByAddress(address: string, category: Category): Promise<LocationData | null> {
    const result = await this.searchLocations(address, [category]);
    return result.locations[0] || null;
  }
}

// ─── Mock Data Provider (no API key) ──────────────────────────────────────

class MockDataProvider implements DataProvider {
  async searchLocations(query: string, categories: Category[]): Promise<SearchResponse> {
    const { searchLocations } = await import('./mock-data');
    const locations = await searchLocations(query, categories);
    return { locations };
  }

  async getLocationByAddress(address: string, category: Category): Promise<LocationData | null> {
    const { getLocationByAddress } = await import('./mock-data');
    return getLocationByAddress(address, category);
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────

const GOOGLE_MAPS_API_KEY = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  : '';

const hasGoogleKey = GOOGLE_MAPS_API_KEY.length > 0 && GOOGLE_MAPS_API_KEY !== 'your_google_maps_api_key_here';

export function getDataProvider(): DataProvider {
  if (hasGoogleKey) {
    return new RealDataProvider();
  }
  return new MockDataProvider();
}

export const dataProvider = getDataProvider();
