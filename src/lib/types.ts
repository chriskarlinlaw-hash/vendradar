// Types for VendRadar MVP

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
}

export interface Demographics {
  medianIncome: number;
  population: number;
  medianAge: number;
  employmentRate: number;
}

export interface Competition {
  count: number;
  nearestDistance: number;
  saturationLevel: 'low' | 'medium' | 'high';
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
}

export interface SearchResult {
  locations: LocationData[];
  searchArea: {
    center: { lat: number; lng: number };
    radius: number;
  };
}