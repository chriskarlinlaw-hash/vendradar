import { LocationData, Category, Demographics, Competition, FootTraffic } from './types';
import { calculateLocationScore, generateAIReasoning } from './scoring';

// Mock data for demo purposes
const MOCK_LOCATIONS: Record<string, Partial<LocationData>[]> = {
  'san diego': [
    {
      address: '1230 Columbia St, San Diego, CA 92101',
      lat: 32.7157,
      lng: -117.1611,
      demographics: { medianIncome: 78500, population: 12450, medianAge: 34, employmentRate: 0.89 },
      competition: { count: 0, nearestDistance: 0.8, saturationLevel: 'low' },
      footTraffic: { score: 85, peakHours: ['8am', '12pm', '5pm'], dailyEstimate: 1200, proximityToTransit: true },
    },
    {
      address: '550 West B St, San Diego, CA 92101',
      lat: 32.7170,
      lng: -117.1630,
      demographics: { medianIncome: 82000, population: 8900, medianAge: 31, employmentRate: 0.92 },
      competition: { count: 1, nearestDistance: 0.4, saturationLevel: 'medium' },
      footTraffic: { score: 78, peakHours: ['9am', '1pm', '6pm'], dailyEstimate: 950, proximityToTransit: true },
    },
    {
      address: '402 W Broadway, San Diego, CA 92101',
      lat: 32.7145,
      lng: -117.1650,
      demographics: { medianIncome: 68000, population: 15200, medianAge: 36, employmentRate: 0.85 },
      competition: { count: 2, nearestDistance: 0.3, saturationLevel: 'medium' },
      footTraffic: { score: 72, peakHours: ['11am', '3pm', '7pm'], dailyEstimate: 800, proximityToTransit: false },
    },
  ],
  'austin': [
    {
      address: '701 Brazos St, Austin, TX 78701',
      lat: 30.2672,
      lng: -97.7431,
      demographics: { medianIncome: 72000, population: 18500, medianAge: 29, employmentRate: 0.91 },
      competition: { count: 0, nearestDistance: 1.2, saturationLevel: 'low' },
      footTraffic: { score: 88, peakHours: ['8am', '12pm', '5pm'], dailyEstimate: 1500, proximityToTransit: true },
    },
    {
      address: '300 W 6th St, Austin, TX 78701',
      lat: 30.2690,
      lng: -97.7450,
      demographics: { medianIncome: 76000, population: 12200, medianAge: 28, employmentRate: 0.93 },
      competition: { count: 1, nearestDistance: 0.6, saturationLevel: 'low' },
      footTraffic: { score: 82, peakHours: ['9am', '1pm', '6pm'], dailyEstimate: 1100, proximityToTransit: true },
    },
  ],
  'denver': [
    {
      address: '1600 Glenarm Pl, Denver, CO 80202',
      lat: 39.7447,
      lng: -104.9950,
      demographics: { medianIncome: 68000, population: 14200, medianAge: 32, employmentRate: 0.88 },
      competition: { count: 0, nearestDistance: 0.9, saturationLevel: 'low' },
      footTraffic: { score: 80, peakHours: ['8am', '12pm', '5pm'], dailyEstimate: 1050, proximityToTransit: true },
    },
    {
      address: '1700 Lincoln St, Denver, CO 80203',
      lat: 39.7430,
      lng: -104.9870,
      demographics: { medianIncome: 71000, population: 16800, medianAge: 30, employmentRate: 0.90 },
      competition: { count: 1, nearestDistance: 0.5, saturationLevel: 'medium' },
      footTraffic: { score: 75, peakHours: ['9am', '1pm', '6pm'], dailyEstimate: 900, proximityToTransit: false },
    },
  ],
  'phoenix': [
    {
      address: '2 E Jefferson St, Phoenix, AZ 85004',
      lat: 33.4484,
      lng: -112.0740,
      demographics: { medianIncome: 58000, population: 22100, medianAge: 33, employmentRate: 0.87 },
      competition: { count: 1, nearestDistance: 0.6, saturationLevel: 'low' },
      footTraffic: { score: 76, peakHours: ['8am', '12pm', '5pm'], dailyEstimate: 980, proximityToTransit: true },
    },
    {
      address: '101 N 1st Ave, Phoenix, AZ 85003',
      lat: 33.4490,
      lng: -112.0770,
      demographics: { medianIncome: 62000, population: 18500, medianAge: 31, employmentRate: 0.89 },
      competition: { count: 0, nearestDistance: 1.1, saturationLevel: 'low' },
      footTraffic: { score: 82, peakHours: ['7am', '12pm', '4pm'], dailyEstimate: 1150, proximityToTransit: true },
    },
    {
      address: '4455 E Camelback Rd, Phoenix, AZ 85018',
      lat: 33.5092,
      lng: -111.9780,
      demographics: { medianIncome: 85000, population: 9800, medianAge: 38, employmentRate: 0.92 },
      competition: { count: 2, nearestDistance: 0.3, saturationLevel: 'medium' },
      footTraffic: { score: 70, peakHours: ['10am', '1pm', '6pm'], dailyEstimate: 750, proximityToTransit: false },
    },
  ],
  'nashville': [
    {
      address: '222 2nd Ave N, Nashville, TN 37201',
      lat: 36.1627,
      lng: -86.7816,
      demographics: { medianIncome: 64000, population: 16700, medianAge: 30, employmentRate: 0.90 },
      competition: { count: 0, nearestDistance: 0.9, saturationLevel: 'low' },
      footTraffic: { score: 84, peakHours: ['9am', '12pm', '6pm'], dailyEstimate: 1300, proximityToTransit: true },
    },
    {
      address: '401 Commerce St, Nashville, TN 37219',
      lat: 36.1640,
      lng: -86.7780,
      demographics: { medianIncome: 71000, population: 13400, medianAge: 34, employmentRate: 0.91 },
      competition: { count: 1, nearestDistance: 0.5, saturationLevel: 'medium' },
      footTraffic: { score: 77, peakHours: ['8am', '1pm', '5pm'], dailyEstimate: 950, proximityToTransit: true },
    },
  ],
  'chicago': [
    {
      address: '233 S Wacker Dr, Chicago, IL 60606',
      lat: 41.8789,
      lng: -87.6359,
      demographics: { medianIncome: 82000, population: 24500, medianAge: 33, employmentRate: 0.91 },
      competition: { count: 2, nearestDistance: 0.2, saturationLevel: 'medium' },
      footTraffic: { score: 92, peakHours: ['7am', '12pm', '5pm'], dailyEstimate: 2200, proximityToTransit: true },
    },
    {
      address: '875 N Michigan Ave, Chicago, IL 60611',
      lat: 41.8983,
      lng: -87.6235,
      demographics: { medianIncome: 95000, population: 19200, medianAge: 36, employmentRate: 0.93 },
      competition: { count: 3, nearestDistance: 0.1, saturationLevel: 'high' },
      footTraffic: { score: 88, peakHours: ['10am', '1pm', '4pm'], dailyEstimate: 1800, proximityToTransit: true },
    },
    {
      address: '1 N State St, Chicago, IL 60602',
      lat: 41.8820,
      lng: -87.6278,
      demographics: { medianIncome: 74000, population: 21000, medianAge: 31, employmentRate: 0.89 },
      competition: { count: 1, nearestDistance: 0.4, saturationLevel: 'medium' },
      footTraffic: { score: 85, peakHours: ['8am', '12pm', '6pm'], dailyEstimate: 1600, proximityToTransit: true },
    },
  ],
  'miami': [
    {
      address: '200 S Biscayne Blvd, Miami, FL 33131',
      lat: 25.7720,
      lng: -80.1870,
      demographics: { medianIncome: 72000, population: 17800, medianAge: 35, employmentRate: 0.88 },
      competition: { count: 1, nearestDistance: 0.5, saturationLevel: 'low' },
      footTraffic: { score: 81, peakHours: ['8am', '12pm', '5pm'], dailyEstimate: 1100, proximityToTransit: true },
    },
    {
      address: '1111 Lincoln Rd, Miami Beach, FL 33139',
      lat: 25.7907,
      lng: -80.1394,
      demographics: { medianIncome: 68000, population: 14500, medianAge: 32, employmentRate: 0.86 },
      competition: { count: 0, nearestDistance: 0.8, saturationLevel: 'low' },
      footTraffic: { score: 86, peakHours: ['10am', '2pm', '7pm'], dailyEstimate: 1400, proximityToTransit: false },
    },
  ],
};

// Generate generic mock locations for unknown cities
function generateGenericLocations(query: string): Partial<LocationData>[] {
  const baseLat = 39.8283 + (Math.random() - 0.5) * 10;
  const baseLng = -98.5795 + (Math.random() - 0.5) * 20;
  
  return [
    {
      address: `${query} - Premium Location`,
      lat: baseLat,
      lng: baseLng,
      demographics: { medianIncome: 65000 + Math.random() * 30000, population: 10000 + Math.random() * 10000, medianAge: 30 + Math.random() * 10, employmentRate: 0.85 + Math.random() * 0.1 },
      competition: { count: Math.floor(Math.random() * 3), nearestDistance: 0.3 + Math.random() * 0.7, saturationLevel: Math.random() > 0.5 ? 'low' : 'medium' },
      footTraffic: { score: 65 + Math.floor(Math.random() * 25), peakHours: ['8am', '12pm', '5pm'], dailyEstimate: 600 + Math.floor(Math.random() * 800), proximityToTransit: Math.random() > 0.3 },
    },
    {
      address: `${query} - Alternative Location`,
      lat: baseLat + 0.01,
      lng: baseLng + 0.01,
      demographics: { medianIncome: 55000 + Math.random() * 25000, population: 8000 + Math.random() * 8000, medianAge: 32 + Math.random() * 8, employmentRate: 0.82 + Math.random() * 0.12 },
      competition: { count: Math.floor(Math.random() * 4), nearestDistance: 0.2 + Math.random() * 0.6, saturationLevel: Math.random() > 0.4 ? 'medium' : 'high' },
      footTraffic: { score: 55 + Math.floor(Math.random() * 30), peakHours: ['9am', '1pm', '6pm'], dailyEstimate: 500 + Math.floor(Math.random() * 700), proximityToTransit: Math.random() > 0.5 },
    },
  ];
}

// Generate mock location data
export async function searchLocations(
  query: string,
  categories: Category[]
): Promise<LocationData[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const normalizedQuery = query.toLowerCase();
  let baseLocations: Partial<LocationData>[] = [];

  // Find matching mock data or generate random
  for (const [city, locations] of Object.entries(MOCK_LOCATIONS)) {
    if (normalizedQuery.includes(city)) {
      baseLocations = locations;
      break;
    }
  }

  // If no match, generate generic mock data
  if (baseLocations.length === 0) {
    baseLocations = generateGenericLocations(query);
  }

  // Enrich with scores and reasoning for each category
  const results: LocationData[] = [];
  
  baseLocations.forEach((base, baseIndex) => {
    const demo = base.demographics as Demographics;
    const comp = base.competition as Competition;
    const ft = base.footTraffic as FootTraffic;
    
    categories.forEach((category, catIndex) => {
      const score = calculateLocationScore(demo, comp, ft, category);
      const reasoning = generateAIReasoning(score, category);

      results.push({
        id: `loc-${Date.now()}-${baseIndex}-${catIndex}`,
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
  
  // Sort by overall score (descending)
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