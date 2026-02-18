import { LocationData, Category, Demographics, Competition, FootTraffic } from './types';
import { calculateLocationScore, generateAIReasoning } from './scoring';

// ─── Known city coordinates ──────────────────────────────────────────
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'san diego': { lat: 32.7157, lng: -117.1611 },
  'austin': { lat: 30.2672, lng: -97.7431 },
  'denver': { lat: 39.7392, lng: -104.9903 },
  'phoenix': { lat: 33.4484, lng: -112.0740 },
  'nashville': { lat: 36.1627, lng: -86.7816 },
  'chicago': { lat: 41.8781, lng: -87.6298 },
  'miami': { lat: 25.7617, lng: -80.1918 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  'seattle': { lat: 47.6062, lng: -122.3321 },
  'portland': { lat: 45.5152, lng: -122.6784 },
  'dallas': { lat: 32.7767, lng: -96.7970 },
  'houston': { lat: 29.7604, lng: -95.3698 },
  'atlanta': { lat: 33.7490, lng: -84.3880 },
  'boston': { lat: 42.3601, lng: -71.0589 },
  'las vegas': { lat: 36.1699, lng: -115.1398 },
  'minneapolis': { lat: 44.9778, lng: -93.2650 },
  'tampa': { lat: 27.9506, lng: -82.4572 },
  'orlando': { lat: 28.5383, lng: -81.3792 },
  'charlotte': { lat: 35.2271, lng: -80.8431 },
  'salt lake city': { lat: 40.7608, lng: -111.8910 },
  'san antonio': { lat: 29.4241, lng: -98.4936 },
  'detroit': { lat: 42.3314, lng: -83.0458 },
  'pittsburgh': { lat: 40.4406, lng: -79.9959 },
  'columbus': { lat: 39.9612, lng: -82.9988 },
  'indianapolis': { lat: 39.7684, lng: -86.1581 },
  'washington': { lat: 38.9072, lng: -77.0369 },
  'philadelphia': { lat: 39.9526, lng: -75.1652 },
  'raleigh': { lat: 35.7796, lng: -78.6382 },
};

// ─── Deterministic seed ──────────────────────────────────────────────
function deterministicSeed(input: string): number {
  let hash = 0;
  const normalized = input.trim().toLowerCase();
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Deterministic pseudo-random from seed (returns 0-1)
function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed + index * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

// ─── Resolve city coordinates from query ─────────────────────────────
function resolveCityCoords(query: string): { lat: number; lng: number } {
  const normalized = query.toLowerCase().replace(/[,.\s]+/g, ' ').trim();

  // Try exact match first, then partial match
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (normalized.includes(city)) return coords;
  }

  // Deterministic fallback for unknown cities (still in continental US)
  const seed = deterministicSeed(normalized);
  return {
    lat: 33 + (seed % 1000) / 100,        // 33-43°N (continental US range)
    lng: -120 + (seed % 500) / 12.5,       // -120 to -80°W
  };
}

// ─── Mock data for known cities ──────────────────────────────────────
const MOCK_LOCATIONS: Record<string, Partial<LocationData>[]> = {
  'san diego': [
    {
      address: '1230 Columbia St, San Diego, CA 92101',
      lat: 32.7157, lng: -117.1611,
      demographics: { medianIncome: 78500, population: 12450, medianAge: 34, employmentRate: 0.89 },
      competition: { count: 0, nearestDistance: 0.8, saturationLevel: 'low' },
      footTraffic: { score: 85, peakHours: ['8am', '12pm', '5pm'], dailyEstimate: 1200, proximityToTransit: true },
    },
    {
      address: '550 West B St, San Diego, CA 92101',
      lat: 32.7170, lng: -117.1630,
      demographics: { medianIncome: 82000, population: 8900, medianAge: 31, employmentRate: 0.92 },
      competition: { count: 1, nearestDistance: 0.4, saturationLevel: 'medium' },
      footTraffic: { score: 78, peakHours: ['9am', '1pm', '6pm'], dailyEstimate: 950, proximityToTransit: true },
    },
    {
      address: '402 W Broadway, San Diego, CA 92101',
      lat: 32.7145, lng: -117.1650,
      demographics: { medianIncome: 68000, population: 15200, medianAge: 36, employmentRate: 0.85 },
      competition: { count: 2, nearestDistance: 0.3, saturationLevel: 'medium' },
      footTraffic: { score: 72, peakHours: ['11am', '3pm', '7pm'], dailyEstimate: 800, proximityToTransit: false },
    },
  ],
  'san francisco': [
    {
      address: '101 Market St, San Francisco, CA 94105',
      lat: 37.7936, lng: -122.3950,
      demographics: { medianIncome: 112000, population: 18500, medianAge: 35, employmentRate: 0.93 },
      competition: { count: 1, nearestDistance: 0.3, saturationLevel: 'medium' },
      footTraffic: { score: 91, peakHours: ['8am', '12pm', '5pm'], dailyEstimate: 2100, proximityToTransit: true },
    },
    {
      address: '555 California St, San Francisco, CA 94104',
      lat: 37.7922, lng: -122.4036,
      demographics: { medianIncome: 105000, population: 15200, medianAge: 33, employmentRate: 0.91 },
      competition: { count: 0, nearestDistance: 0.7, saturationLevel: 'low' },
      footTraffic: { score: 87, peakHours: ['7am', '12pm', '6pm'], dailyEstimate: 1800, proximityToTransit: true },
    },
    {
      address: '1 Ferry Building, San Francisco, CA 94111',
      lat: 37.7956, lng: -122.3935,
      demographics: { medianIncome: 98000, population: 21000, medianAge: 36, employmentRate: 0.90 },
      competition: { count: 2, nearestDistance: 0.2, saturationLevel: 'medium' },
      footTraffic: { score: 93, peakHours: ['7am', '11am', '5pm'], dailyEstimate: 2500, proximityToTransit: true },
    },
  ],
  'austin': [
    {
      address: '701 Brazos St, Austin, TX 78701',
      lat: 30.2672, lng: -97.7431,
      demographics: { medianIncome: 72000, population: 18500, medianAge: 29, employmentRate: 0.91 },
      competition: { count: 0, nearestDistance: 1.2, saturationLevel: 'low' },
      footTraffic: { score: 88, peakHours: ['8am', '12pm', '5pm'], dailyEstimate: 1500, proximityToTransit: true },
    },
    {
      address: '300 W 6th St, Austin, TX 78701',
      lat: 30.2690, lng: -97.7450,
      demographics: { medianIncome: 76000, population: 12200, medianAge: 28, employmentRate: 0.93 },
      competition: { count: 1, nearestDistance: 0.6, saturationLevel: 'low' },
      footTraffic: { score: 82, peakHours: ['9am', '1pm', '6pm'], dailyEstimate: 1100, proximityToTransit: true },
    },
  ],
  'denver': [
    {
      address: '1600 Glenarm Pl, Denver, CO 80202',
      lat: 39.7447, lng: -104.9950,
      demographics: { medianIncome: 68000, population: 14200, medianAge: 32, employmentRate: 0.88 },
      competition: { count: 0, nearestDistance: 0.9, saturationLevel: 'low' },
      footTraffic: { score: 80, peakHours: ['8am', '12pm', '5pm'], dailyEstimate: 1050, proximityToTransit: true },
    },
    {
      address: '1700 Lincoln St, Denver, CO 80203',
      lat: 39.7430, lng: -104.9870,
      demographics: { medianIncome: 71000, population: 16800, medianAge: 30, employmentRate: 0.90 },
      competition: { count: 1, nearestDistance: 0.5, saturationLevel: 'medium' },
      footTraffic: { score: 75, peakHours: ['9am', '1pm', '6pm'], dailyEstimate: 900, proximityToTransit: false },
    },
  ],
  'phoenix': [
    {
      address: '2 E Jefferson St, Phoenix, AZ 85004',
      lat: 33.4484, lng: -112.0740,
      demographics: { medianIncome: 58000, population: 22100, medianAge: 33, employmentRate: 0.87 },
      competition: { count: 1, nearestDistance: 0.6, saturationLevel: 'low' },
      footTraffic: { score: 76, peakHours: ['8am', '12pm', '5pm'], dailyEstimate: 980, proximityToTransit: true },
    },
    {
      address: '101 N 1st Ave, Phoenix, AZ 85003',
      lat: 33.4490, lng: -112.0770,
      demographics: { medianIncome: 62000, population: 18500, medianAge: 31, employmentRate: 0.89 },
      competition: { count: 0, nearestDistance: 1.1, saturationLevel: 'low' },
      footTraffic: { score: 82, peakHours: ['7am', '12pm', '4pm'], dailyEstimate: 1150, proximityToTransit: true },
    },
  ],
  'nashville': [
    {
      address: '222 2nd Ave N, Nashville, TN 37201',
      lat: 36.1627, lng: -86.7816,
      demographics: { medianIncome: 64000, population: 16700, medianAge: 30, employmentRate: 0.90 },
      competition: { count: 0, nearestDistance: 0.9, saturationLevel: 'low' },
      footTraffic: { score: 84, peakHours: ['9am', '12pm', '6pm'], dailyEstimate: 1300, proximityToTransit: true },
    },
    {
      address: '401 Commerce St, Nashville, TN 37219',
      lat: 36.1640, lng: -86.7780,
      demographics: { medianIncome: 71000, population: 13400, medianAge: 34, employmentRate: 0.91 },
      competition: { count: 1, nearestDistance: 0.5, saturationLevel: 'medium' },
      footTraffic: { score: 77, peakHours: ['8am', '1pm', '5pm'], dailyEstimate: 950, proximityToTransit: true },
    },
  ],
  'chicago': [
    {
      address: '233 S Wacker Dr, Chicago, IL 60606',
      lat: 41.8789, lng: -87.6359,
      demographics: { medianIncome: 82000, population: 24500, medianAge: 33, employmentRate: 0.91 },
      competition: { count: 2, nearestDistance: 0.2, saturationLevel: 'medium' },
      footTraffic: { score: 92, peakHours: ['7am', '12pm', '5pm'], dailyEstimate: 2200, proximityToTransit: true },
    },
    {
      address: '875 N Michigan Ave, Chicago, IL 60611',
      lat: 41.8983, lng: -87.6235,
      demographics: { medianIncome: 95000, population: 19200, medianAge: 36, employmentRate: 0.93 },
      competition: { count: 3, nearestDistance: 0.1, saturationLevel: 'high' },
      footTraffic: { score: 88, peakHours: ['10am', '1pm', '4pm'], dailyEstimate: 1800, proximityToTransit: true },
    },
  ],
  'miami': [
    {
      address: '200 S Biscayne Blvd, Miami, FL 33131',
      lat: 25.7720, lng: -80.1870,
      demographics: { medianIncome: 72000, population: 17800, medianAge: 35, employmentRate: 0.88 },
      competition: { count: 1, nearestDistance: 0.5, saturationLevel: 'low' },
      footTraffic: { score: 81, peakHours: ['8am', '12pm', '5pm'], dailyEstimate: 1100, proximityToTransit: true },
    },
    {
      address: '1111 Lincoln Rd, Miami Beach, FL 33139',
      lat: 25.7907, lng: -80.1394,
      demographics: { medianIncome: 68000, population: 14500, medianAge: 32, employmentRate: 0.86 },
      competition: { count: 0, nearestDistance: 0.8, saturationLevel: 'low' },
      footTraffic: { score: 86, peakHours: ['10am', '2pm', '7pm'], dailyEstimate: 1400, proximityToTransit: false },
    },
  ],
};

// ─── Generate deterministic mock locations for any city ──────────────
function generateGenericLocations(query: string): Partial<LocationData>[] {
  const coords = resolveCityCoords(query);
  const seed = deterministicSeed(query);

  return [
    {
      address: `${query} - Downtown Business District`,
      lat: coords.lat,
      lng: coords.lng,
      demographics: {
        medianIncome: 65000 + Math.round(seededRandom(seed, 1) * 30000),
        population: 10000 + Math.round(seededRandom(seed, 2) * 10000),
        medianAge: Math.round(30 + seededRandom(seed, 3) * 10),
        employmentRate: Math.round((0.85 + seededRandom(seed, 4) * 0.1) * 100) / 100,
      },
      competition: {
        count: Math.floor(seededRandom(seed, 5) * 3),
        nearestDistance: Math.round((0.3 + seededRandom(seed, 6) * 0.7) * 10) / 10,
        saturationLevel: seededRandom(seed, 7) > 0.5 ? 'low' : 'medium',
      },
      footTraffic: {
        score: 65 + Math.floor(seededRandom(seed, 8) * 25),
        peakHours: ['8am', '12pm', '5pm'],
        dailyEstimate: 600 + Math.floor(seededRandom(seed, 9) * 800),
        proximityToTransit: seededRandom(seed, 10) > 0.3,
      },
    },
    {
      address: `${query} - Commercial Corridor`,
      lat: coords.lat + 0.008,
      lng: coords.lng + 0.005,
      demographics: {
        medianIncome: 55000 + Math.round(seededRandom(seed, 11) * 25000),
        population: 8000 + Math.round(seededRandom(seed, 12) * 8000),
        medianAge: Math.round(32 + seededRandom(seed, 13) * 8),
        employmentRate: Math.round((0.82 + seededRandom(seed, 14) * 0.12) * 100) / 100,
      },
      competition: {
        count: Math.floor(seededRandom(seed, 15) * 4),
        nearestDistance: Math.round((0.2 + seededRandom(seed, 16) * 0.6) * 10) / 10,
        saturationLevel: seededRandom(seed, 17) > 0.4 ? 'medium' : 'low',
      },
      footTraffic: {
        score: 55 + Math.floor(seededRandom(seed, 18) * 30),
        peakHours: ['9am', '1pm', '6pm'],
        dailyEstimate: 500 + Math.floor(seededRandom(seed, 19) * 700),
        proximityToTransit: seededRandom(seed, 20) > 0.5,
      },
    },
    {
      address: `${query} - Mixed-Use Hub`,
      lat: coords.lat - 0.005,
      lng: coords.lng + 0.010,
      demographics: {
        medianIncome: 60000 + Math.round(seededRandom(seed, 21) * 20000),
        population: 12000 + Math.round(seededRandom(seed, 22) * 6000),
        medianAge: Math.round(28 + seededRandom(seed, 23) * 12),
        employmentRate: Math.round((0.84 + seededRandom(seed, 24) * 0.10) * 100) / 100,
      },
      competition: {
        count: Math.floor(seededRandom(seed, 25) * 2),
        nearestDistance: Math.round((0.4 + seededRandom(seed, 26) * 0.8) * 10) / 10,
        saturationLevel: 'low',
      },
      footTraffic: {
        score: 70 + Math.floor(seededRandom(seed, 27) * 20),
        peakHours: ['7am', '12pm', '6pm'],
        dailyEstimate: 700 + Math.floor(seededRandom(seed, 28) * 600),
        proximityToTransit: seededRandom(seed, 29) > 0.4,
      },
    },
  ];
}

// ─── Search ──────────────────────────────────────────────────────────
export async function searchLocations(
  query: string,
  categories: Category[]
): Promise<LocationData[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));

  const normalizedQuery = query.toLowerCase().replace(/[,.]/g, ' ').trim();
  let baseLocations: Partial<LocationData>[] = [];

  // Find matching mock data
  for (const [city, locations] of Object.entries(MOCK_LOCATIONS)) {
    if (normalizedQuery.includes(city)) {
      baseLocations = locations;
      break;
    }
  }

  // Generate deterministic mock data for unrecognized cities
  if (baseLocations.length === 0) {
    baseLocations = generateGenericLocations(query);
  }

  // Enrich with scores
  const results: LocationData[] = [];

  baseLocations.forEach((base, baseIndex) => {
    const demo = base.demographics as Demographics;
    const comp = base.competition as Competition;
    const ft = base.footTraffic as FootTraffic;

    categories.forEach((category, catIndex) => {
      const score = calculateLocationScore(demo, comp, ft, category);
      const reasoning = generateAIReasoning(score, category);

      results.push({
        id: `mock-${deterministicSeed(query + baseIndex + catIndex)}-${baseIndex}-${catIndex}`,
        address: base.address || 'Unknown Location',
        lat: base.lat || 0,
        lng: base.lng || 0,
        category,
        score,
        demographics: demo,
        competition: comp,
        footTraffic: ft,
        aiReasoning: reasoning,
      });
    });
  });

  return results.sort((a, b) => b.score.overall - a.score.overall);
}

// Get single location by address (mock)
export async function getLocationByAddress(
  address: string,
  category: Category
): Promise<LocationData | null> {
  const results = await searchLocations(address, [category]);
  return results[0] || null;
}
