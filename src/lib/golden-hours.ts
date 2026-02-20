/**
 * Golden Hours / Time-of-Day Intelligence (Roadmap #3)
 *
 * Defines category-specific "golden hours" — the time windows when foot traffic
 * is most valuable for each vending machine type. Weights hourly busyness data
 * to produce a score that reflects WHEN traffic occurs, not just HOW MUCH.
 *
 * Data source: BestTime.app (when integrated) provides 24-hour busyness curves.
 * Until then, this module provides the weighting logic + mock hourly data for
 * testing and development.
 */

import { Category, GoldenHoursConfig, HourlyBusyness, TimeOfDayScore } from './types';

// ─── Golden Hours Configuration Per Category ────────────────────────────
// These define when foot traffic matters most for each vending category.
// Hours use 24h format (0 = midnight, 12 = noon, 17 = 5 PM).

export const GOLDEN_HOURS: Record<Category, GoldenHoursConfig> = {
  office: {
    primaryPeak: { start: 11, end: 13, label: '11 AM - 1 PM' },
    secondaryPeak: { start: 15, end: 16, label: '3 - 4 PM' },
    deadZones: [
      { start: 0, end: 7, label: 'Before 7 AM' },
      { start: 19, end: 24, label: 'After 7 PM' },
    ],
    weekendFactor: 0.1,
  },
  gym: {
    primaryPeak: { start: 6, end: 9, label: '6 - 9 AM' },
    secondaryPeak: { start: 16, end: 19, label: '4 - 7 PM' },
    deadZones: [
      { start: 10, end: 15, label: '10 AM - 3 PM' },
    ],
    weekendFactor: 0.8,
  },
  hospital: {
    primaryPeak: { start: 0, end: 24, label: 'All hours (24/7)' },
    secondaryPeak: { start: 7, end: 8, label: 'Shift change: 7 AM' },
    deadZones: [], // Hospitals are always active
    weekendFactor: 0.9,
  },
  school: {
    primaryPeak: { start: 11, end: 14, label: '11 AM - 2 PM' },
    secondaryPeak: { start: 15, end: 17, label: '3 - 5 PM' },
    deadZones: [
      { start: 0, end: 8, label: 'Before 8 AM' },
      { start: 21, end: 24, label: 'After 9 PM' },
    ],
    weekendFactor: 0.15,
  },
  manufacturing: {
    primaryPeak: { start: 6, end: 7, label: 'Shift start: 6 AM' },
    secondaryPeak: { start: 14, end: 15, label: 'Shift change: 2 PM' },
    deadZones: [
      { start: 9, end: 13, label: 'Between shifts' },
    ],
    weekendFactor: 0.3,
  },
  apartment: {
    primaryPeak: { start: 17, end: 21, label: '5 - 9 PM' },
    secondaryPeak: { start: 12, end: 15, label: 'Weekend afternoons' },
    deadZones: [
      { start: 7, end: 11, label: 'Weekday mornings' },
    ],
    weekendFactor: 1.3,
  },
  hotel: {
    primaryPeak: { start: 7, end: 10, label: '7 - 10 AM' },
    secondaryPeak: { start: 21, end: 24, label: '9 PM - 12 AM' },
    deadZones: [
      { start: 14, end: 17, label: '2 - 5 PM' },
    ],
    weekendFactor: 1.2,
  },
  transit: {
    primaryPeak: { start: 7, end: 9, label: '7 - 9 AM' },
    secondaryPeak: { start: 17, end: 19, label: '5 - 7 PM' },
    deadZones: [
      { start: 22, end: 5, label: '10 PM - 5 AM' },
    ],
    weekendFactor: 0.5,
  },
};

// ─── Hour Weighting ─────────────────────────────────────────────────────
// Generates a 24-element weight array for a category.
// Golden hours get higher weights, dead zones get lower weights.

function generateHourWeights(config: GoldenHoursConfig): number[] {
  const weights = new Array(24).fill(0.5); // baseline weight

  // Primary peak: weight = 1.5
  for (let h = config.primaryPeak.start; h < Math.min(config.primaryPeak.end, 24); h++) {
    weights[h] = 1.5;
  }

  // Secondary peak: weight = 1.2
  for (let h = config.secondaryPeak.start; h < Math.min(config.secondaryPeak.end, 24); h++) {
    // Don't overwrite primary peak
    if (weights[h] < 1.2) weights[h] = 1.2;
  }

  // Dead zones: weight = 0.15
  for (const dz of config.deadZones) {
    const start = dz.start;
    const end = dz.end;
    if (end > start) {
      for (let h = start; h < end; h++) {
        weights[h] = 0.15;
      }
    } else {
      // Wraps around midnight (e.g., 22-5)
      for (let h = start; h < 24; h++) weights[h] = 0.15;
      for (let h = 0; h < end; h++) weights[h] = 0.15;
    }
  }

  return weights;
}

// ─── Score Calculation ──────────────────────────────────────────────────

/**
 * Calculate a golden-hours-weighted foot traffic score.
 *
 * Takes raw hourly busyness data and applies category-specific time weighting.
 * A gym with traffic at 6 AM scores higher than a gym with traffic at 2 PM,
 * even if the raw busyness values are identical.
 *
 * @param hourlyData - 24-hour busyness data for weekday and weekend
 * @param category - The vending category to weight for
 * @returns TimeOfDayScore with weighted score, raw average, and metadata
 */
export function calculateTimeOfDayScore(
  hourlyData: HourlyBusyness,
  category: Category
): TimeOfDayScore {
  const config = GOLDEN_HOURS[category];
  const weights = generateHourWeights(config);

  // Weighted weekday score
  let weekdayWeightedSum = 0;
  let weekdayWeightSum = 0;
  for (let h = 0; h < 24; h++) {
    weekdayWeightedSum += hourlyData.weekday[h] * weights[h];
    weekdayWeightSum += weights[h];
  }
  const weekdayScore = weekdayWeightSum > 0 ? weekdayWeightedSum / weekdayWeightSum : 0;

  // Raw weekend average
  const weekendAvg = hourlyData.weekend.reduce((a, b) => a + b, 0) / 24;
  const weekdayRawAvg = hourlyData.weekday.reduce((a, b) => a + b, 0) / 24;

  // Blend weekday and weekend based on category weekend factor
  // 5 weekdays + 2 weekend days = 7 days
  // But weekend factor adjusts the weekend contribution
  const weekdayContribution = weekdayScore * 5;
  const weekendContribution = weekendAvg * config.weekendFactor * 2;
  const blendedScore = (weekdayContribution + weekendContribution) / (5 + 2 * config.weekendFactor);

  // Normalize to 0-100
  const goldenHoursScore = Math.round(Math.min(100, Math.max(0, blendedScore)));
  const rawAverage = Math.round((weekdayRawAvg * 5 + weekendAvg * 2) / 7);

  // Detect seasonal risk
  let seasonalWarning: string | undefined;
  if (category === 'school') {
    seasonalWarning = 'Revenue may drop 40-60% during summer break and holidays';
  } else if (category === 'hotel' && config.weekendFactor > 1.0) {
    seasonalWarning = 'Revenue varies by tourism season. Check local event calendars.';
  }

  return {
    goldenHoursScore,
    rawAverage,
    weekendFactor: config.weekendFactor,
    seasonalWarning,
    hourlyData,
  };
}

// ─── Mock Hourly Data Generator ─────────────────────────────────────────
// Generates realistic hourly busyness patterns for testing.
// Uses category-appropriate curves until BestTime.app is integrated.

export function generateMockHourlyData(category: Category, seed: number = 42): HourlyBusyness {
  const config = GOLDEN_HOURS[category];

  // Simple seeded random
  const rand = (i: number) => {
    const x = Math.sin(seed + i * 127.1) * 43758.5453;
    return (x - Math.floor(x));
  };

  const weekday: number[] = [];
  const weekend: number[] = [];

  for (let h = 0; h < 24; h++) {
    let baseWeekday = 20; // Low baseline
    let baseWeekend = 15;

    // Primary peak
    if (h >= config.primaryPeak.start && h < config.primaryPeak.end) {
      baseWeekday = 70 + Math.round(rand(h) * 25);
    }
    // Secondary peak
    else if (h >= config.secondaryPeak.start && h < config.secondaryPeak.end) {
      baseWeekday = 55 + Math.round(rand(h + 100) * 20);
    }
    // Dead zones
    else {
      const inDeadZone = config.deadZones.some(dz => {
        if (dz.end > dz.start) return h >= dz.start && h < dz.end;
        return h >= dz.start || h < dz.end;
      });
      if (inDeadZone) {
        baseWeekday = 5 + Math.round(rand(h + 200) * 10);
      } else {
        baseWeekday = 25 + Math.round(rand(h + 300) * 20);
      }
    }

    // Weekend is weekday * weekendFactor with some noise
    baseWeekend = Math.round(baseWeekday * config.weekendFactor + (rand(h + 400) - 0.5) * 10);

    weekday.push(Math.max(0, Math.min(100, baseWeekday)));
    weekend.push(Math.max(0, Math.min(100, baseWeekend)));
  }

  return { weekday, weekend };
}

/**
 * Get human-readable golden hours description for a category.
 */
export function getGoldenHoursDescription(category: Category): string {
  const config = GOLDEN_HOURS[category];
  return `Peak: ${config.primaryPeak.label}. Secondary: ${config.secondaryPeak.label}. Weekend: ${Math.round(config.weekendFactor * 100)}% of weekday.`;
}
