import { Category, CategoryConfig, LocationScore, Demographics, Competition, FootTraffic } from './types';

export const CATEGORIES: CategoryConfig[] = [
  {
    id: 'office',
    name: 'Office Buildings',
    icon: 'building',
    description: 'Traditional vending for weekday workforce',
    idealDemographics: { minIncome: 45000, targetAgeRange: [25, 55], populationDensity: 'medium' },
    peakHours: '9am-12pm, 2-4pm',
    productFit: ['Coffee', 'Snacks', 'Cold drinks', 'Lunch items'],
    scoringWeights: { footTraffic: 25, demographics: 25, competition: 20, buildingType: 30 },
  },
  {
    id: 'gym',
    name: 'Gyms & Fitness',
    icon: 'dumbbell',
    description: 'Healthy vending for fitness enthusiasts',
    idealDemographics: { minIncome: 55000, targetAgeRange: [18, 45], populationDensity: 'high' },
    peakHours: '6-9am, 5-8pm',
    productFit: ['Protein bars', 'Healthy snacks', 'Recovery drinks', 'Water'],
    scoringWeights: { footTraffic: 30, demographics: 35, competition: 20, buildingType: 15 },
  },
  {
    id: 'hospital',
    name: 'Hospitals & Medical',
    icon: 'heart-pulse',
    description: '24/7 access with visitors and staff',
    idealDemographics: { minIncome: 40000, targetAgeRange: [25, 65], populationDensity: 'high' },
    peakHours: 'All hours',
    productFit: ['Grab-and-go meals', 'Coffee', 'Healthy options', 'Snacks'],
    scoringWeights: { footTraffic: 35, demographics: 20, competition: 15, buildingType: 30 },
  },
  {
    id: 'school',
    name: 'Schools & Universities',
    icon: 'graduation-cap',
    description: 'High volume with student traffic',
    idealDemographics: { minIncome: 35000, targetAgeRange: [15, 25], populationDensity: 'high' },
    peakHours: '8am-3pm',
    productFit: ['Healthy snacks', 'Drinks', 'Bulk items', 'Quick meals'],
    scoringWeights: { footTraffic: 30, demographics: 25, competition: 25, buildingType: 20 },
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & Warehouses',
    icon: 'factory',
    description: 'Shift workers need convenient options',
    idealDemographics: { minIncome: 38000, targetAgeRange: [22, 55], populationDensity: 'low' },
    peakHours: 'Shift changes (6am, 2pm, 10pm)',
    productFit: ['Energy drinks', 'Meal replacement', 'Bulk snacks', 'Coffee'],
    scoringWeights: { footTraffic: 30, demographics: 20, competition: 25, buildingType: 25 },
  },
  {
    id: 'apartment',
    name: 'Apartment Complexes',
    icon: 'home',
    description: 'Micro-markets for residents',
    idealDemographics: { minIncome: 50000, targetAgeRange: [25, 45], populationDensity: 'high' },
    peakHours: 'Evening/night (5-10pm)',
    productFit: ['Convenience items', 'Snacks', 'Drinks', 'Household essentials'],
    scoringWeights: { footTraffic: 25, demographics: 30, competition: 20, buildingType: 25 },
  },
  {
    id: 'hotel',
    name: 'Hotels',
    icon: 'bed',
    description: 'Travelers need grab-and-go options',
    idealDemographics: { minIncome: 55000, targetAgeRange: [25, 60], populationDensity: 'medium' },
    peakHours: 'Check-in/out times',
    productFit: ['Premium snacks', 'Branded items', 'Travel essentials', 'Drinks'],
    scoringWeights: { footTraffic: 35, demographics: 25, competition: 20, buildingType: 20 },
  },
  {
    id: 'transit',
    name: 'Transit Hubs',
    icon: 'train',
    description: 'High turnover locations',
    idealDemographics: { minIncome: 40000, targetAgeRange: [18, 55], populationDensity: 'high' },
    peakHours: 'Rush hours (7-9am, 4-7pm)',
    productFit: ['Grab-and-go', 'Quick snacks', 'Drinks', 'Travel items'],
    scoringWeights: { footTraffic: 40, demographics: 20, competition: 20, buildingType: 20 },
  },
];

// Calculate location score based on category-specific weights
export function calculateLocationScore(
  demographics: Demographics,
  competition: Competition,
  footTraffic: FootTraffic,
  category: Category
): LocationScore {
  const categoryConfig = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  const weights = categoryConfig.scoringWeights;

  // Demographics score (0-100)
  let demographicsScore = 50;
  if (demographics.medianIncome >= categoryConfig.idealDemographics.minIncome * 1.2) {
    demographicsScore = 90;
  } else if (demographics.medianIncome >= categoryConfig.idealDemographics.minIncome) {
    demographicsScore = 75;
  } else if (demographics.medianIncome >= categoryConfig.idealDemographics.minIncome * 0.8) {
    demographicsScore = 60;
  } else {
    demographicsScore = 40;
  }

  // Competition score (0-100) - lower competition = higher score
  let competitionScore = 50;
  if (competition.count === 0) {
    competitionScore = 95;
  } else if (competition.count === 1) {
    competitionScore = 75;
  } else if (competition.count <= 3) {
    competitionScore = 55;
  } else {
    competitionScore = 30;
  }

  // Foot traffic score (0-100)
  const footTrafficScore = footTraffic.score;

  // Building type score (0-100) - assumed good match for demo
  const buildingTypeScore = 75;

  // Calculate weighted overall score
  const overall = Math.round(
    (footTrafficScore * weights.footTraffic +
     demographicsScore * weights.demographics +
     competitionScore * weights.competition +
     buildingTypeScore * weights.buildingType) / 100
  );

  return {
    overall,
    footTraffic: footTrafficScore,
    demographics: demographicsScore,
    competition: competitionScore,
    buildingType: buildingTypeScore,
  };
}

// Generate AI reasoning based on scores
export function generateAIReasoning(score: LocationScore, category: Category): string[] {
  const reasons: string[] = [];
  const categoryName = CATEGORIES.find(c => c.id === category)?.name || 'Location';

  if (score.overall >= 80) {
    reasons.push(`Excellent fit for ${categoryName.toLowerCase()} vending with strong overall metrics.`);
  } else if (score.overall >= 60) {
    reasons.push(`Good potential for ${categoryName.toLowerCase()} with some optimization opportunities.`);
  } else {
    reasons.push(`Moderate potential - consider alternative locations in the area.`);
  }

  if (score.footTraffic >= 80) {
    reasons.push('High foot traffic with peak hours aligned to vending demand.');
  } else if (score.footTraffic >= 60) {
    reasons.push('Steady foot traffic throughout operating hours.');
  } else {
    reasons.push('Foot traffic is below optimal - consider high-visibility placement.');
  }

  if (score.competition >= 80) {
    reasons.push('No competition within 0.5 miles - first-mover advantage available.');
  } else if (score.competition >= 60) {
    reasons.push('Limited competition allows for market entry.');
  } else {
    reasons.push('Competitive area - differentiation will be key.');
  }

  if (score.demographics >= 80) {
    reasons.push('Target demographics align perfectly with product mix.');
  } else if (score.demographics >= 60) {
    reasons.push('Demographics support standard vending operations.');
  } else {
    reasons.push('Consider adjusting product mix for local demographics.');
  }

  return reasons;
}

// Get score color
export function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'; // Green
  if (score >= 60) return '#f59e0b'; // Yellow
  if (score >= 40) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

// Get score label
export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}