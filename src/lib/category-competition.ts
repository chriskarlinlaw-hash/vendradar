/**
 * Category-Aware Competition Analysis (Roadmap #4)
 *
 * Upgrades competition scoring from raw machine count to category-specific
 * saturation. Three Coca-Cola machines nearby is bad for a beverage placement
 * but irrelevant for a snack machine. This module classifies nearby machines
 * by type and scores competition overlap against the operator's intended category.
 *
 * Uses Google Places "vending_machine" type results + brand/name inference.
 */

import { Category, CategoryCompetition, NearbyMachineInfo } from './types';

// ─── Brand-to-Category Mapping ──────────────────────────────────────────
// Maps known vending machine brands/keywords to machine categories.
// Used to infer what TYPE of machine is at a location from its Google Places name.

const BRAND_PATTERNS: { pattern: RegExp; category: NearbyMachineInfo['inferredCategory']; brand?: string }[] = [
  // Beverage brands
  { pattern: /coca[\s-]?cola|coke/i, category: 'beverage', brand: 'Coca-Cola' },
  { pattern: /pepsi/i, category: 'beverage', brand: 'Pepsi' },
  { pattern: /dr[\s.]?pepper/i, category: 'beverage', brand: 'Dr Pepper' },
  { pattern: /red\s?bull/i, category: 'beverage', brand: 'Red Bull' },
  { pattern: /monster\s?(energy)?/i, category: 'beverage', brand: 'Monster' },
  { pattern: /gatorade|powerade/i, category: 'beverage', brand: 'Sports Drink' },
  { pattern: /\b(soda|drink|beverage|water)\s*(machine|vending)/i, category: 'beverage' },

  // Snack brands
  { pattern: /frito[\s-]?lay|lay'?s|doritos|cheetos/i, category: 'snack', brand: 'Frito-Lay' },
  { pattern: /mars|snickers|m&m|twix/i, category: 'snack', brand: 'Mars' },
  { pattern: /\b(snack|candy|chip)\s*(machine|vending)/i, category: 'snack' },

  // Healthy options
  { pattern: /healthy\s?(you|vending|choice)|fresh\s?(healthy|market)/i, category: 'healthy' },
  { pattern: /natura(l|e)|organic|farm/i, category: 'healthy' },
  { pattern: /\b(salad|fruit|fresh|healthy)\s*(machine|vending)/i, category: 'healthy' },

  // Combo machines
  { pattern: /combo|dual|multi/i, category: 'combo' },

  // Specialty
  { pattern: /coffee|keurig|nespresso|java/i, category: 'specialty', brand: 'Coffee' },
  { pattern: /ice\s*cream|frozen/i, category: 'specialty' },
  { pattern: /redbox|dvd|game/i, category: 'specialty' },
  { pattern: /laundry|detergent|soap/i, category: 'specialty' },
  { pattern: /pharmacy|medicine|otc/i, category: 'specialty' },
];

// ─── Category Overlap Matrix ────────────────────────────────────────────
// Defines how much each nearby machine category competes with the
// operator's intended placement category. 1.0 = full competition,
// 0.0 = no competition.

type MachineCategory = NearbyMachineInfo['inferredCategory'];

const OVERLAP_MATRIX: Record<Category, Record<MachineCategory, number>> = {
  office: {
    beverage: 0.5,   // Office workers buy from both, but beverage-only leaves snack gap
    snack: 0.8,      // Direct competitor for office snacking
    healthy: 0.6,    // Moderate overlap
    combo: 0.9,      // Combo machines are direct competitors
    specialty: 0.3,  // Coffee machines compete, but others don't
    unknown: 0.5,    // Assume moderate
  },
  gym: {
    beverage: 0.3,   // Gym-goers want different drinks (protein, electrolyte)
    snack: 0.2,      // Standard snacks don't compete with protein bars
    healthy: 0.9,    // Direct competitor
    combo: 0.5,      // Moderate
    specialty: 0.2,  // Low
    unknown: 0.4,
  },
  hospital: {
    beverage: 0.4,
    snack: 0.6,
    healthy: 0.5,
    combo: 0.7,
    specialty: 0.3,
    unknown: 0.5,
  },
  school: {
    beverage: 0.5,
    snack: 0.8,
    healthy: 0.4,   // Schools may prefer healthy options (different market)
    combo: 0.7,
    specialty: 0.2,
    unknown: 0.5,
  },
  manufacturing: {
    beverage: 0.5,
    snack: 0.7,
    healthy: 0.3,
    combo: 0.8,
    specialty: 0.4,
    unknown: 0.5,
  },
  apartment: {
    beverage: 0.4,
    snack: 0.5,
    healthy: 0.4,
    combo: 0.7,
    specialty: 0.3,
    unknown: 0.4,
  },
  hotel: {
    beverage: 0.4,
    snack: 0.5,
    healthy: 0.3,
    combo: 0.6,
    specialty: 0.5,
    unknown: 0.4,
  },
  transit: {
    beverage: 0.5,
    snack: 0.6,
    healthy: 0.3,
    combo: 0.7,
    specialty: 0.3,
    unknown: 0.5,
  },
};

// ─── Machine Classification ─────────────────────────────────────────────

/**
 * Classify a vending machine by its name/brand into a category.
 * Uses pattern matching against known brands and keywords.
 */
export function classifyMachine(name: string): { category: MachineCategory; brand?: string } {
  const normalized = name.trim();

  for (const { pattern, category, brand } of BRAND_PATTERNS) {
    if (pattern.test(normalized)) {
      return { category, brand };
    }
  }

  // If name contains "vending" but no recognizable brand, it's unknown
  if (/vending|machine/i.test(normalized)) {
    return { category: 'unknown' };
  }

  return { category: 'unknown' };
}

// ─── Competition Scoring ────────────────────────────────────────────────

/**
 * Calculate category-aware competition for a location.
 *
 * @param nearbyMachines - Nearby vending machines from Google Places
 * @param targetCategory - The operator's intended machine category
 * @param totalNearbyPlaces - Count of all nearby places (for base competition)
 * @param nearestDistance - Distance to nearest competitor in miles
 * @returns CategoryCompetition with overlap-aware saturation assessment
 */
export function calculateCategoryCompetition(
  nearbyMachines: { name: string; distance: number }[],
  targetCategory: Category,
  totalNearbyPlaces: number,
  nearestDistance: number
): CategoryCompetition {
  // Classify each nearby machine
  const classified: NearbyMachineInfo[] = nearbyMachines.map(m => {
    const classification = classifyMachine(m.name);
    return {
      name: m.name,
      inferredCategory: classification.category,
      brand: classification.brand,
      distance: m.distance,
    };
  });

  // Count same-category vs different-category
  const overlapMatrix = OVERLAP_MATRIX[targetCategory];
  let competitiveOverlap = 0;
  let sameCategoryCount = 0;
  let differentCategoryCount = 0;

  for (const machine of classified) {
    const overlap = overlapMatrix[machine.inferredCategory];
    competitiveOverlap += overlap;

    // "Same category" = overlap >= 0.6 (material competition)
    if (overlap >= 0.6) {
      sameCategoryCount++;
    } else {
      differentCategoryCount++;
    }
  }

  // Determine category-specific saturation
  let categorySaturation: 'underserved' | 'moderate' | 'saturated';
  if (sameCategoryCount === 0) {
    categorySaturation = 'underserved';
  } else if (sameCategoryCount <= 2 && competitiveOverlap < 2.0) {
    categorySaturation = 'moderate';
  } else {
    categorySaturation = 'saturated';
  }

  // Overall competition still uses total count for the base Competition interface
  const count = nearbyMachines.length;
  const saturationLevel: 'low' | 'medium' | 'high' =
    count <= 2 ? 'low' : count <= 5 ? 'medium' : 'high';

  return {
    count,
    nearestDistance,
    saturationLevel,
    sameCategoryCount,
    differentCategoryCount,
    categorySaturation,
    nearbyMachineTypes: classified,
  };
}

/**
 * Generate a competition-aware score (0-100) that accounts for category overlap.
 *
 * This replaces the simple "more machines = worse score" logic with:
 *   - Underserved category = score boost (first-mover advantage)
 *   - Saturated same-category = score penalty
 *   - Different-category machines = minor/no penalty
 */
export function calculateCompetitionScore(competition: CategoryCompetition): number {
  if (competition.categorySaturation === 'underserved') {
    // No same-category competition = excellent
    if (competition.count === 0) return 95;
    return 85; // Other machines nearby, but different category
  }

  if (competition.categorySaturation === 'moderate') {
    // 1-2 same-category competitors
    return Math.max(40, 75 - competition.sameCategoryCount * 15);
  }

  // Saturated: 3+ same-category competitors
  return Math.max(20, 50 - competition.sameCategoryCount * 10);
}

/**
 * Generate competition insight text for the AI reasoning section.
 */
export function generateCompetitionInsight(competition: CategoryCompetition, category: Category): string {
  if (competition.categorySaturation === 'underserved') {
    if (competition.count === 0) {
      return 'No vending competition within range. First-mover advantage available.';
    }
    const otherTypes = competition.nearbyMachineTypes
      .filter(m => m.inferredCategory !== 'unknown')
      .map(m => m.brand || m.inferredCategory)
      .slice(0, 3);

    if (otherTypes.length > 0) {
      return `${competition.count} nearby machine(s) detected (${otherTypes.join(', ')}), but none compete directly with your ${category} placement. Whitespace opportunity.`;
    }
    return `${competition.count} nearby machine(s) detected, but none serve the same category. Low direct competition.`;
  }

  if (competition.categorySaturation === 'moderate') {
    return `${competition.sameCategoryCount} competing machine(s) in same category. Differentiation through product mix or positioning will be key.`;
  }

  return `${competition.sameCategoryCount} same-category competitors detected. Market is saturated. Consider alternative locations or unique product differentiation.`;
}
