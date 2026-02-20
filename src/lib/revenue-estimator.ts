/**
 * Revenue Estimation Engine (Roadmap #2)
 *
 * Translates VendRadar composite scores into estimated weekly revenue ranges
 * using NAMA (National Automatic Merchandising Association) industry benchmarks
 * and score-percentile mapping.
 *
 * Three-layer approach:
 *   1. NAMA benchmark ranges per category (industry averages by location type)
 *   2. Score-to-percentile mapping (higher score = upper end of range)
 *   3. Future: feedback loop calibration from real operator outcomes
 */

import { Category, LocationScore, RevenueEstimate } from './types';

// ─── NAMA Industry Benchmarks ───────────────────────────────────────────
// Source: NAMA State of the Industry reports + industry surveys
// Values represent weekly gross revenue ranges in USD for a single machine
// at a typical location of each type.

interface BenchmarkRange {
  /** Revenue at 25th percentile location */
  p25: number;
  /** Revenue at 50th percentile (median) location */
  p50: number;
  /** Revenue at 75th percentile location */
  p75: number;
  /** Revenue at 90th percentile (exceptional) location */
  p90: number;
  /** Description used in the "basis" field */
  basisLabel: string;
}

const NAMA_BENCHMARKS: Record<Category, BenchmarkRange> = {
  office: {
    p25: 125,
    p50: 250,
    p75: 400,
    p90: 550,
    basisLabel: 'Industry benchmarks for office building placements',
  },
  gym: {
    p25: 100,
    p50: 200,
    p75: 350,
    p90: 500,
    basisLabel: 'Industry benchmarks for gym/fitness center placements',
  },
  hospital: {
    p25: 200,
    p50: 375,
    p75: 550,
    p90: 750,
    basisLabel: 'Industry benchmarks for hospital/medical facility placements',
  },
  school: {
    p25: 100,
    p50: 200,
    p75: 325,
    p90: 450,
    basisLabel: 'Industry benchmarks for school/university placements',
  },
  manufacturing: {
    p25: 150,
    p50: 275,
    p75: 425,
    p90: 575,
    basisLabel: 'Industry benchmarks for manufacturing/warehouse placements',
  },
  apartment: {
    p25: 75,
    p50: 175,
    p75: 300,
    p90: 425,
    basisLabel: 'Industry benchmarks for apartment complex placements',
  },
  hotel: {
    p25: 150,
    p50: 300,
    p75: 475,
    p90: 650,
    basisLabel: 'Industry benchmarks for hotel/lodging placements',
  },
  transit: {
    p25: 175,
    p50: 325,
    p75: 500,
    p90: 700,
    basisLabel: 'Industry benchmarks for transit hub placements',
  },
};

// ─── Score to Percentile Mapping ────────────────────────────────────────
// Maps a VendRadar composite score (0-100) to an approximate percentile
// position within the NAMA benchmark range.
//
// The mapping is non-linear: scores below 40 map to bottom quartile,
// scores 60-80 map to the 50th-75th range, and scores 80+ start
// reaching into the top decile.

function scoreToPercentile(score: number): number {
  if (score >= 90) return 0.92;
  if (score >= 85) return 0.85;
  if (score >= 80) return 0.78;
  if (score >= 75) return 0.70;
  if (score >= 70) return 0.62;
  if (score >= 65) return 0.55;
  if (score >= 60) return 0.48;
  if (score >= 55) return 0.40;
  if (score >= 50) return 0.32;
  if (score >= 45) return 0.25;
  if (score >= 40) return 0.20;
  return 0.15;
}

// ─── Revenue Interpolation ──────────────────────────────────────────────
// Given a percentile position, interpolate within the NAMA benchmark
// breakpoints to get a point estimate, then produce a range around it.

function interpolateRevenue(benchmark: BenchmarkRange, percentile: number): { low: number; high: number; mid: number } {
  // Define the breakpoints as [percentile, revenue] pairs
  const breakpoints: [number, number][] = [
    [0.0, benchmark.p25 * 0.6],  // Below 25th percentile
    [0.25, benchmark.p25],
    [0.50, benchmark.p50],
    [0.75, benchmark.p75],
    [0.90, benchmark.p90],
    [1.0, benchmark.p90 * 1.15], // Above 90th percentile
  ];

  // Find the two surrounding breakpoints
  let lower = breakpoints[0];
  let upper = breakpoints[breakpoints.length - 1];

  for (let i = 0; i < breakpoints.length - 1; i++) {
    if (percentile >= breakpoints[i][0] && percentile <= breakpoints[i + 1][0]) {
      lower = breakpoints[i];
      upper = breakpoints[i + 1];
      break;
    }
  }

  // Linear interpolation between breakpoints
  const range = upper[0] - lower[0];
  const t = range > 0 ? (percentile - lower[0]) / range : 0.5;
  const mid = Math.round(lower[1] + t * (upper[1] - lower[1]));

  // Revenue range: +/- 20% from midpoint (reflects real-world variance)
  const spread = 0.20;
  const low = Math.round(mid * (1 - spread));
  const high = Math.round(mid * (1 + spread));

  return { low, high, mid };
}

// ─── Confidence Assessment ──────────────────────────────────────────────

function assessConfidence(score: number): { level: 'low' | 'moderate' | 'high'; note: string } {
  // In V1, confidence is always low-moderate because we have no feedback data.
  // As feedback loop populates, this function will factor in local data density.
  if (score >= 75) {
    return {
      level: 'moderate',
      note: 'Based on industry benchmarks. Report your results to improve local estimates.',
    };
  }
  if (score >= 50) {
    return {
      level: 'low',
      note: 'Limited data for this score range. Actual results may vary significantly. Report your results to help calibrate.',
    };
  }
  return {
    level: 'low',
    note: 'Low-scoring locations have high revenue variance. Consider alternatives or report your results if you proceed.',
  };
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Estimate weekly revenue range for a scored location.
 *
 * @param score - The LocationScore from calculateLocationScore()
 * @param category - The vending category being evaluated
 * @returns RevenueEstimate with weekly range, monthly/annual projections, confidence
 */
export function estimateRevenue(score: LocationScore, category: Category): RevenueEstimate {
  const benchmark = NAMA_BENCHMARKS[category];
  const percentile = scoreToPercentile(score.overall);
  const revenue = interpolateRevenue(benchmark, percentile);
  const confidence = assessConfidence(score.overall);

  // Round to nearest $5 for cleaner display
  const weeklyLow = Math.round(revenue.low / 5) * 5;
  const weeklyHigh = Math.round(revenue.high / 5) * 5;
  const weeklyMid = Math.round(revenue.mid / 5) * 5;

  return {
    weeklyLow,
    weeklyHigh,
    monthlyMid: Math.round(weeklyMid * 4.33),
    annualMid: Math.round(weeklyMid * 52),
    basis: benchmark.basisLabel,
    confidence: confidence.level,
    confidenceNote: confidence.note,
  };
}

/**
 * Format revenue estimate for display.
 * Returns a string like "$200 - $350/week"
 */
export function formatRevenueRange(estimate: RevenueEstimate): string {
  return `$${estimate.weeklyLow.toLocaleString()} - $${estimate.weeklyHigh.toLocaleString()}/week`;
}

/**
 * Get the NAMA benchmark range for a category (for reference/display).
 */
export function getCategoryBenchmark(category: Category): BenchmarkRange {
  return NAMA_BENCHMARKS[category];
}
