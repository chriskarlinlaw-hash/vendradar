// Types for VendRadar V2

export type Category =
  | 'office'
  | 'gym'
  | 'hospital'
  | 'school'
  | 'manufacturing'
  | 'apartment'
  | 'hotel'
  | 'transit';

export interface CategoryConfig {
  id: Category;
  name: string;
  icon: string;
  description: string;
  idealDemographics: {
    minIncome: number;
    targetAgeRange: [number, number];
    populationDensity: 'low' | 'medium' | 'high';
  };
  peakHours: string;
  productFit: string[];
  scoringWeights: {
    footTraffic: number;
    demographics: number;
    competition: number;
    buildingType: number;
  };
  /** Google Places types that indicate an exact match for this category */
  expectedPlaceTypes: string[];
  /** Google Places types that indicate a partial/related match */
  relatedPlaceTypes: string[];
}

export interface Demographics {
  medianIncome: number;
  population: number;
  medianAge: number;
  employmentRate: number;
  /** People per square mile, derived from Census tract area */
  populationDensity?: number;
}

export interface Competition {
  count: number;
  nearestDistance: number;
  saturationLevel: 'low' | 'medium' | 'high';
  /** Total category-matching places found in search radius */
  placeCountInRadius?: number;
}

export interface FootTraffic {
  score: number;
  peakHours: string[];
  dailyEstimate: number;
  proximityToTransit: boolean;
}

export interface LocationScore {
  overall: number;
  footTraffic: number;
  demographics: number;
  competition: number;
  buildingType: number;
  /** Warning/caution signals explaining score weaknesses */
  negativeSignals?: string[];
  /** Confidence in the score based on data availability */
  dataQuality?: 'high' | 'medium' | 'low';
}

export interface LocationData {
  id: string;
  address: string;
  lat: number;
  lng: number;
  category: Category;
  score: LocationScore;
  demographics: Demographics;
  competition: Competition;
  footTraffic: FootTraffic;
  aiReasoning: string[];
  /** Google Places types[] for this location */
  placeTypes?: string[];
  /** Business operational status */
  businessStatus?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';
  /** Google review count (used as popularity proxy) */
  userRatingsTotal?: number;
}

export interface SearchResult {
  locations: LocationData[];
  searchArea: {
    center: { lat: number; lng: number };
    radius: number;
  };
}

// ─── Heat Map Types ──────────────────────────────────────────────

export interface HeatMapDataPoint {
  lat: number;
  lng: number;
  /** Weight 0-1 for heat map intensity */
  weight: number;
  /** Number of category-matching places at this point */
  placeCount: number;
}

export interface HeatMapData {
  points: HeatMapDataPoint[];
  center: { lat: number; lng: number };
  category: Category;
}
