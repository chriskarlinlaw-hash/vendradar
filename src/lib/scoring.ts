/**
 * VendRadar V2 Scoring Engine
 *
 * Philosophy: scores reflect REAL viability for a $3K-$10K vending investment.
 * A residential home should score ~20-30, not 88. A legitimate office building
 * in a commercial district should score 75-90.
 *
 * Key changes from V1:
 *  - Foot traffic uses review count with population density ceiling (not log + floor 50)
 *  - Demographics uses gradual income function (not binary threshold)
 *  - Competition is contextual: 0 competitors in low-density = no demand, not first-mover
 *  - Building type validates Google Places types[] (not Census income heuristic)
 *  - Negative signals explain every score weakness
 *  - Data quality tracks confidence level
 */

import {
  Category,
  CategoryConfig,
  LocationScore,
  Demographics,
  Competition,
  FootTraffic,
} from './types';

// ─── Category Configurations ────────────────────────────────────────────────

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
    expectedPlaceTypes: ['office', 'corporate_office', 'accounting', 'insurance_agency', 'consulting_firm'],
    relatedPlaceTypes: ['real_estate_agency', 'lawyer', 'finance', 'bank', 'local_government_office', 'coworking_space'],
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
    expectedPlaceTypes: ['gym', 'fitness_center', 'health_club'],
    relatedPlaceTypes: ['sports_complex', 'yoga_studio', 'swimming_pool', 'martial_arts_school', 'dance_school'],
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
    expectedPlaceTypes: ['hospital', 'medical_center'],
    relatedPlaceTypes: ['doctor', 'dentist', 'physiotherapist', 'pharmacy', 'health', 'medical_lab', 'urgent_care_center'],
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
    expectedPlaceTypes: ['university', 'school', 'secondary_school', 'primary_school'],
    relatedPlaceTypes: ['library', 'community_college', 'preschool', 'training_center'],
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
    expectedPlaceTypes: ['storage', 'warehouse', 'industrial_area'],
    relatedPlaceTypes: ['moving_company', 'car_repair', 'auto_parts_store', 'distribution_center'],
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
    expectedPlaceTypes: ['apartment_complex', 'apartment_building'],
    relatedPlaceTypes: ['condominium_complex', 'housing_complex', 'real_estate_agency'],
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
    expectedPlaceTypes: ['lodging', 'hotel', 'motel', 'resort_hotel', 'extended_stay_hotel'],
    relatedPlaceTypes: ['bed_and_breakfast', 'guest_house', 'inn', 'hostel'],
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
    expectedPlaceTypes: ['transit_station', 'bus_station', 'train_station', 'subway_station', 'light_rail_station'],
    relatedPlaceTypes: ['airport', 'ferry_terminal', 'bus_stop', 'taxi_stand', 'parking'],
  },
];

// ─── V2 Scoring Functions ───────────────────────────────────────────────────

/**
 * Foot Traffic Score (0-100)
 *
 * Primary signal: user_ratings_total from Google Places (popularity proxy)
 * Capped by population density (suburban residential areas can't score high)
 * Penalized for closed businesses or missing data
 */
function calculateFootTrafficScore(
  userRatingsTotal: number,
  populationDensity: number,
  businessStatus?: string,
  hasOpeningHours?: boolean,
): number {
  // Business status gates
  if (businessStatus === 'CLOSED_PERMANENTLY') return 0;
  if (businessStatus === 'CLOSED_TEMPORARILY') return Math.min(20, userRatingsTotal > 0 ? 15 : 5);

  // Base score from review count (proxy for popularity/foot traffic)
  let score: number;
  if (userRatingsTotal <= 0) {
    score = 10;
  } else if (userRatingsTotal < 50) {
    // 1-49 reviews → 15-35
    score = 15 + Math.round((userRatingsTotal / 50) * 20);
  } else if (userRatingsTotal < 500) {
    // 50-499 reviews → 35-65
    score = 35 + Math.round(((userRatingsTotal - 50) / 450) * 30);
  } else if (userRatingsTotal < 2000) {
    // 500-1999 reviews → 65-80
    score = 65 + Math.round(((userRatingsTotal - 500) / 1500) * 15);
  } else {
    // 2000+ reviews → 80-95
    score = 80 + Math.min(15, Math.round(((userRatingsTotal - 2000) / 5000) * 15));
  }

  // Population density ceiling — suburban residential areas can't claim high foot traffic
  if (populationDensity < 3000) {
    score = Math.min(score, 40);
  } else if (populationDensity < 8000) {
    score = Math.min(score, 60);
  }

  // No opening hours data → small penalty (less data confidence)
  if (hasOpeningHours === false && score > 15) {
    score = Math.max(10, score - 15);
  }

  return Math.min(95, Math.max(0, score));
}

/**
 * Demographics Score (0-100)
 *
 * Gradual income function instead of binary threshold.
 * Age fit bonus. Employment rate factor.
 */
function calculateDemographicsScore(
  demographics: Demographics,
  category: Category,
): number {
  const config = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  const idealIncome = config.idealDemographics.minIncome;
  const [targetAgeMin, targetAgeMax] = config.idealDemographics.targetAgeRange;

  // Gradual income scoring
  let incomeScore: number;
  const incomeRatio = demographics.medianIncome / idealIncome;
  if (incomeRatio < 0.6) {
    incomeScore = 20;
  } else if (incomeRatio < 0.8) {
    incomeScore = 35;
  } else if (incomeRatio < 1.0) {
    incomeScore = 55;
  } else if (incomeRatio < 1.3) {
    incomeScore = 75;
  } else if (incomeRatio < 1.8) {
    incomeScore = 85;
  } else {
    incomeScore = 90;
  }

  // Age fit bonus (+5 if median age falls in target range)
  if (demographics.medianAge >= targetAgeMin && demographics.medianAge <= targetAgeMax) {
    incomeScore = Math.min(95, incomeScore + 5);
  }

  // Employment rate factor: penalize low-employment areas proportionally
  // Baseline expectation: 75% employment rate
  const employmentFactor = Math.min(1.0, demographics.employmentRate / 0.75);
  const finalScore = Math.round(incomeScore * employmentFactor);

  return Math.min(95, Math.max(10, finalScore));
}

/**
 * Competition Score (0-100) — Contextual
 *
 * Key insight: 0 competitors in a low-density suburb means NO DEMAND, not opportunity.
 * 0 competitors in a high-density urban area might mean underserved market.
 * Some competition actually validates demand (1-2 is healthy).
 */
function calculateCompetitionScore(
  competition: Competition,
  populationDensity: number,
): number {
  const { count, nearestDistance, placeCountInRadius } = competition;
  const totalInRadius = placeCountInRadius || count;

  let score: number;

  if (totalInRadius === 0) {
    // No competing businesses — meaning depends on context
    if (populationDensity < 5000) {
      // Low density + no competitors = no commercial demand signal
      score = 20;
    } else if (populationDensity < 10000) {
      // Medium density + no competitors = possibly underserved
      score = 50;
    } else {
      // High density + no competitors = likely underserved market
      score = 65;
    }
  } else if (totalInRadius <= 2) {
    // Light competition = validated demand, room for more
    score = 75;
  } else if (totalInRadius <= 5) {
    // Moderate competition
    score = 55;
  } else if (totalInRadius <= 8) {
    // Heavy competition
    score = 35;
  } else {
    // Saturated
    score = 20;
  }

  // Distance bonus: if nearest competitor is far away, more breathing room
  if (count > 0 && nearestDistance > 1.0) {
    score = Math.min(90, score + 10);
  } else if (count > 0 && nearestDistance > 0.5) {
    score = Math.min(90, score + 5);
  }

  return Math.min(95, Math.max(5, score));
}

/**
 * Building Type Score (0-100) — Uses Google Places types[]
 *
 * This is the biggest single fix: validates that the location's actual building
 * classification matches the vending category. A residential home will score
 * 15-25 for office vending instead of the V1 score of 88.
 */
function calculateBuildingTypeScore(
  placeTypes: string[],
  category: Category,
  isAreaLevel: boolean,
  demographics?: Demographics,
): number {
  const config = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

  // Area-level result (no specific place found) → low score
  if (isAreaLevel || !placeTypes || placeTypes.length === 0) {
    // Give a small Census-heuristic boost, but cap at 40
    if (demographics) {
      const heuristic = estimateBuildingTypeFallback(demographics, category);
      return Math.min(40, Math.max(15, heuristic));
    }
    return 20;
  }

  // Check for exact type match
  const hasExactMatch = placeTypes.some(t =>
    config.expectedPlaceTypes.includes(t)
  );
  if (hasExactMatch) {
    return 90; // Strong match
  }

  // Check for related type match
  const hasRelatedMatch = placeTypes.some(t =>
    config.relatedPlaceTypes.includes(t)
  );
  if (hasRelatedMatch) {
    return 60; // Partial match
  }

  // Check for general commercial indicators
  const commercialTypes = [
    'store', 'shopping_mall', 'shopping_center', 'supermarket',
    'restaurant', 'cafe', 'food', 'establishment', 'point_of_interest',
    'business_center', 'commercial_building',
  ];
  const isCommercial = placeTypes.some(t => commercialTypes.includes(t));
  if (isCommercial) {
    return 40; // Generic commercial, not category-specific
  }

  // Residential or unrelated types
  const residentialTypes = [
    'premise', 'street_address', 'route', 'neighborhood',
    'sublocality', 'locality', 'political', 'geocode',
    'single_family_residential', 'residential_area',
  ];
  const isResidential = placeTypes.some(t => residentialTypes.includes(t));
  if (isResidential) {
    return 15; // Clearly wrong for commercial vending
  }

  // Unknown type — cautious score
  return 25;
}

/**
 * Fallback building type estimation from Census data.
 * Used ONLY when Google Places types are unavailable.
 * Deliberately scores lower than V1 — max 40.
 */
function estimateBuildingTypeFallback(demographics: Demographics, category: Category): number {
  const { medianIncome, population, employmentRate } = demographics;

  switch (category) {
    case 'office':
      if (medianIncome >= 65000 && employmentRate >= 0.7) return 35;
      if (medianIncome >= 50000) return 28;
      return 20;
    case 'hospital':
      if (population >= 20000) return 35;
      return 22;
    case 'transit':
      if (population >= 25000) return 38;
      return 20;
    default:
      return 25;
  }
}

// ─── Negative Signal Detection ──────────────────────────────────────────────

export function detectNegativeSignals(
  placeTypes: string[],
  category: Category,
  demographics: Demographics,
  competition: Competition,
  businessStatus?: string,
  isAreaLevel?: boolean,
): string[] {
  const signals: string[] = [];
  const config = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

  // Business status
  if (businessStatus === 'CLOSED_PERMANENTLY') {
    signals.push('Business is permanently closed');
  } else if (businessStatus === 'CLOSED_TEMPORARILY') {
    signals.push('Business is temporarily closed');
  }

  // Area-level result (no places found)
  if (isAreaLevel) {
    signals.push(`No ${config.name.toLowerCase()} found within search radius`);
  }

  // Building type mismatch
  if (placeTypes && placeTypes.length > 0) {
    const hasMatch = placeTypes.some(t =>
      config.expectedPlaceTypes.includes(t) || config.relatedPlaceTypes.includes(t)
    );
    if (!hasMatch) {
      const typeLabel = placeTypes.slice(0, 3).join(', ');
      signals.push(`Building type mismatch: classified as [${typeLabel}], expected ${config.name.toLowerCase()} types`);
    }
  }

  // Low population density
  if ((demographics.populationDensity ?? 0) < 3000) {
    signals.push('Low population density area — limited foot traffic potential');
  }

  // Competition context
  if ((competition.placeCountInRadius || competition.count) === 0 && (demographics.populationDensity ?? 0) < 5000) {
    signals.push('No competing businesses in low-density area — weak commercial demand signal');
  }

  // Income mismatch
  const incomeRatio = demographics.medianIncome / config.idealDemographics.minIncome;
  if (incomeRatio < 0.6) {
    signals.push(`Median income ($${Math.round(demographics.medianIncome).toLocaleString()}) significantly below ideal for ${config.name.toLowerCase()}`);
  }

  // Low employment
  if (demographics.employmentRate < 0.5) {
    signals.push(`Low employment rate (${Math.round(demographics.employmentRate * 100)}%) — fewer daytime workers nearby`);
  }

  return signals;
}

// ─── Data Quality Assessment ────────────────────────────────────────────────

export function determineDataQuality(
  hasPlaceDetails: boolean,
  hasCensusData: boolean,
  isAreaLevel: boolean,
  placeTypes: string[],
): 'high' | 'medium' | 'low' {
  if (isAreaLevel) return 'low';
  if (hasPlaceDetails && hasCensusData && placeTypes.length > 0) return 'high';
  if (hasPlaceDetails || hasCensusData) return 'medium';
  return 'low';
}

// ─── Main Scoring Function ──────────────────────────────────────────────────

export interface V2ScoringInput {
  demographics: Demographics;
  competition: Competition;
  footTraffic: FootTraffic;
  category: Category;
  placeTypes: string[];
  userRatingsTotal: number;
  businessStatus?: string;
  hasOpeningHours?: boolean;
  isAreaLevel: boolean;
  hasPlaceDetails: boolean;
  hasCensusData: boolean;
}

export function calculateLocationScore(input: V2ScoringInput): LocationScore;
export function calculateLocationScore(
  demographics: Demographics,
  competition: Competition,
  footTraffic: FootTraffic,
  category: Category,
): LocationScore;
export function calculateLocationScore(
  inputOrDemographics: V2ScoringInput | Demographics,
  competition?: Competition,
  footTraffic?: FootTraffic,
  category?: Category,
): LocationScore {
  // Support both V2 input object and legacy V1 signature
  let input: V2ScoringInput;

  if ('category' in inputOrDemographics && 'placeTypes' in inputOrDemographics) {
    input = inputOrDemographics as V2ScoringInput;
  } else {
    // Legacy V1 call — wrap in V2 format with defaults
    input = {
      demographics: inputOrDemographics as Demographics,
      competition: competition!,
      footTraffic: footTraffic!,
      category: category!,
      placeTypes: [],
      userRatingsTotal: 0,
      isAreaLevel: false,
      hasPlaceDetails: false,
      hasCensusData: true,
    };
  }

  const categoryConfig = CATEGORIES.find(c => c.id === input.category) || CATEGORIES[0];
  const weights = categoryConfig.scoringWeights;

  // Calculate each sub-score using V2 algorithms
  const ftScore = calculateFootTrafficScore(
    input.userRatingsTotal,
    input.demographics.populationDensity || 5000,
    input.businessStatus,
    input.hasOpeningHours,
  );

  const demoScore = calculateDemographicsScore(input.demographics, input.category);

  const compScore = calculateCompetitionScore(
    input.competition,
    input.demographics.populationDensity || 5000,
  );

  const btScore = calculateBuildingTypeScore(
    input.placeTypes,
    input.category,
    input.isAreaLevel,
    input.demographics,
  );

  // Weighted overall
  const overall = Math.round(
    (ftScore * weights.footTraffic +
     demoScore * weights.demographics +
     compScore * weights.competition +
     btScore * weights.buildingType) / 100
  );

  // Detect negative signals
  const negativeSignals = detectNegativeSignals(
    input.placeTypes,
    input.category,
    input.demographics,
    input.competition,
    input.businessStatus,
    input.isAreaLevel,
  );

  // Data quality
  const dataQuality = determineDataQuality(
    input.hasPlaceDetails,
    input.hasCensusData,
    input.isAreaLevel,
    input.placeTypes,
  );

  return {
    overall: Math.min(99, Math.max(1, overall)),
    footTraffic: ftScore,
    demographics: demoScore,
    competition: compScore,
    buildingType: btScore,
    negativeSignals,
    dataQuality,
  };
}

// ─── AI Reasoning Generation ────────────────────────────────────────────────

export function generateAIReasoning(score: LocationScore, category: Category): string[] {
  const reasons: string[] = [];
  const config = CATEGORIES.find(c => c.id === category);
  const categoryName = config?.name || 'Location';

  // Overall assessment
  if (score.overall >= 75) {
    reasons.push(`Strong fit for ${categoryName.toLowerCase()} vending — multiple positive signals.`);
  } else if (score.overall >= 55) {
    reasons.push(`Moderate potential for ${categoryName.toLowerCase()} — review specific metrics before committing.`);
  } else if (score.overall >= 35) {
    reasons.push(`Below average for ${categoryName.toLowerCase()} — significant concerns identified.`);
  } else {
    reasons.push(`Poor fit for ${categoryName.toLowerCase()} vending — consider alternative locations.`);
  }

  // Foot traffic insight
  if (score.footTraffic >= 70) {
    reasons.push('High foot traffic area with strong visitor volume.');
  } else if (score.footTraffic >= 45) {
    reasons.push('Moderate foot traffic — may need high-visibility placement.');
  } else if (score.footTraffic >= 20) {
    reasons.push('Low foot traffic — location may not generate enough daily visits.');
  } else {
    reasons.push('Very low foot traffic signal — area lacks commercial activity.');
  }

  // Building type insight
  if (score.buildingType >= 80) {
    reasons.push(`Location type is a strong match for ${categoryName.toLowerCase()} vending.`);
  } else if (score.buildingType >= 50) {
    reasons.push('Building type is a partial match — verify fit on-site.');
  } else if (score.buildingType >= 30) {
    reasons.push('Building type does not match the selected vending category.');
  } else {
    reasons.push('No category-matching businesses found at this location.');
  }

  // Competition insight
  if (score.competition >= 70) {
    reasons.push('Healthy competitive landscape — demand is validated with room for entry.');
  } else if (score.competition >= 45) {
    reasons.push('Moderate competition — differentiation needed.');
  } else {
    reasons.push('Competitive landscape is unfavorable (saturated or no demand signal).');
  }

  // Surface negative signals as reasons
  if ((score.negativeSignals?.length ?? 0) > 0) {
    reasons.push(`⚠ ${score.negativeSignals![0]}`);
    if (score.negativeSignals!.length > 1) {
      reasons.push(`⚠ ${score.negativeSignals![1]}`);
    }
  }

  return reasons;
}

// ─── UI Helpers ─────────────────────────────────────────────────────────────

export function getScoreColor(score: number): string {
  if (score >= 75) return '#22c55e'; // Green
  if (score >= 55) return '#f59e0b'; // Yellow
  if (score >= 35) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

export function getScoreLabel(score: number): string {
  if (score >= 75) return 'Excellent';
  if (score >= 55) return 'Good';
  if (score >= 35) return 'Fair';
  return 'Poor';
}
