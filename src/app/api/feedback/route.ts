/**
 * /api/feedback — Placement Outcome Feedback Loop (Roadmap #1)
 *
 * Collects real-world revenue data from operators who placed machines
 * at locations VendRadar scored. Over time this builds a ground-truth
 * dataset to calibrate scoring accuracy and revenue estimates.
 *
 * POST  — Submit a new placement outcome
 * GET   — Retrieve aggregate stats (public) or user's own submissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { PlacementOutcome, Category } from '@/lib/types';

// ─── In-Memory Store (replace with DB in production) ────────────────────
// In production this would be Supabase/Postgres. For now, persists for the
// lifetime of the serverless function (sufficient for MVP validation).
const feedbackStore: PlacementOutcome[] = [];

// ─── Validation ─────────────────────────────────────────────────────────

const VALID_CATEGORIES: Category[] = [
  'office', 'gym', 'hospital', 'school',
  'manufacturing', 'apartment', 'hotel', 'transit',
];

function validateOutcome(data: unknown): { valid: boolean; errors: string[]; outcome?: PlacementOutcome } {
  const errors: string[] = [];
  const d = data as Record<string, unknown>;

  // Required fields
  if (!d.lat || typeof d.lat !== 'number' || d.lat < -90 || d.lat > 90) {
    errors.push('lat must be a number between -90 and 90');
  }
  if (!d.lng || typeof d.lng !== 'number' || d.lng < -180 || d.lng > 180) {
    errors.push('lng must be a number between -180 and 180');
  }
  if (!d.address || typeof d.address !== 'string' || (d.address as string).trim().length === 0) {
    errors.push('address is required');
  }
  if (!d.category || !VALID_CATEGORIES.includes(d.category as Category)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  if (d.weeklyRevenue === undefined || typeof d.weeklyRevenue !== 'number' || d.weeklyRevenue < 0) {
    errors.push('weeklyRevenue must be a non-negative number');
  }
  if (!d.monthsInOperation || typeof d.monthsInOperation !== 'number' || d.monthsInOperation < 1) {
    errors.push('monthsInOperation must be at least 1');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Build validated outcome
  const outcome: PlacementOutcome = {
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    lat: d.lat as number,
    lng: d.lng as number,
    address: (d.address as string).trim(),
    category: d.category as Category,
    weeklyRevenue: d.weeklyRevenue as number,
    monthsInOperation: d.monthsInOperation as number,
    submittedAt: new Date().toISOString(),
  };

  // Optional fields
  if (d.machineCondition && ['new', 'good', 'fair', 'poor'].includes(d.machineCondition as string)) {
    outcome.machineCondition = d.machineCondition as PlacementOutcome['machineCondition'];
  }
  if (d.restockFrequency && ['daily', '2-3x_week', 'weekly', 'biweekly'].includes(d.restockFrequency as string)) {
    outcome.restockFrequency = d.restockFrequency as PlacementOutcome['restockFrequency'];
  }
  if (d.productType && typeof d.productType === 'string') {
    outcome.productType = d.productType;
  }
  if (d.vendradarScore && typeof d.vendradarScore === 'number') {
    outcome.vendradarScore = d.vendradarScore;
  }
  if (d.userId && typeof d.userId === 'string') {
    outcome.userId = d.userId;
  }

  return { valid: true, errors: [], outcome };
}

// ─── POST: Submit feedback ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { valid, errors, outcome } = validateOutcome(body);

    if (!valid || !outcome) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    feedbackStore.push(outcome);

    return NextResponse.json({
      success: true,
      id: outcome.id,
      message: 'Thank you! Your placement data helps improve estimates for everyone.',
      totalSubmissions: feedbackStore.length,
    });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}

// ─── GET: Retrieve aggregate stats ──────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get('category') as Category | null;

    let outcomes = [...feedbackStore];
    if (categoryFilter && VALID_CATEGORIES.includes(categoryFilter)) {
      outcomes = outcomes.filter(o => o.category === categoryFilter);
    }

    // Calculate aggregates
    const totalSubmissions = outcomes.length;
    if (totalSubmissions === 0) {
      return NextResponse.json({
        totalSubmissions: 0,
        message: 'No feedback data yet. Be the first to contribute!',
      });
    }

    const avgRevenue = Math.round(outcomes.reduce((sum, o) => sum + o.weeklyRevenue, 0) / totalSubmissions);
    const revenueRange = {
      min: Math.min(...outcomes.map(o => o.weeklyRevenue)),
      max: Math.max(...outcomes.map(o => o.weeklyRevenue)),
    };

    // Category breakdown
    const byCategory: Record<string, { count: number; avgRevenue: number }> = {};
    for (const o of outcomes) {
      if (!byCategory[o.category]) {
        byCategory[o.category] = { count: 0, avgRevenue: 0 };
      }
      byCategory[o.category].count++;
      byCategory[o.category].avgRevenue += o.weeklyRevenue;
    }
    for (const cat of Object.keys(byCategory)) {
      byCategory[cat].avgRevenue = Math.round(byCategory[cat].avgRevenue / byCategory[cat].count);
    }

    return NextResponse.json({
      totalSubmissions,
      avgWeeklyRevenue: avgRevenue,
      revenueRange,
      byCategory,
    });
  } catch (error) {
    console.error('Feedback GET error:', error);
    return NextResponse.json({ error: 'Failed to retrieve stats' }, { status: 500 });
  }
}
