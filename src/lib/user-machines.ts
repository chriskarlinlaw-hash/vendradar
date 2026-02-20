/**
 * User Machines / Fleet Management (Roadmap #7)
 *
 * Client-side store for tracking an operator's placed machines.
 * Persists to localStorage so operators can see their fleet on return visits.
 *
 * This is the foundation for:
 *   - "My Machines" map overlay showing existing placements
 *   - Route optimization (minimize drive time between machines)
 *   - Cannibalization warnings (don't place two machines too close)
 *   - Portfolio analytics (revenue by category, best/worst performers)
 */

import { UserMachine, FleetSummary, Category } from './types';

const STORAGE_KEY = 'vendradar_user_machines';

// ─── CRUD Operations ────────────────────────────────────────────────────

/**
 * Get all user machines from localStorage.
 */
export function getUserMachines(): UserMachine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Add a new machine to the user's fleet.
 */
export function addUserMachine(machine: Omit<UserMachine, 'id' | 'userId'>): UserMachine {
  const machines = getUserMachines();
  const newMachine: UserMachine = {
    ...machine,
    id: `um-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId: getOrCreateUserId(),
  };
  machines.push(newMachine);
  saveMachines(machines);
  return newMachine;
}

/**
 * Update an existing machine's properties.
 */
export function updateUserMachine(id: string, updates: Partial<UserMachine>): UserMachine | null {
  const machines = getUserMachines();
  const idx = machines.findIndex(m => m.id === id);
  if (idx === -1) return null;

  machines[idx] = { ...machines[idx], ...updates, id: machines[idx].id };
  saveMachines(machines);
  return machines[idx];
}

/**
 * Remove a machine (soft delete — sets status to 'removed').
 */
export function removeUserMachine(id: string): boolean {
  const machines = getUserMachines();
  const idx = machines.findIndex(m => m.id === id);
  if (idx === -1) return false;

  machines[idx].status = 'removed';
  saveMachines(machines);
  return true;
}

// ─── Fleet Analytics ────────────────────────────────────────────────────

/**
 * Get a summary of the user's fleet for dashboard display.
 */
export function getFleetSummary(): FleetSummary {
  const machines = getUserMachines();
  const active = machines.filter(m => m.status === 'active');

  const categories = {} as Record<Category, number>;
  for (const m of active) {
    categories[m.category] = (categories[m.category] || 0) + 1;
  }

  let bounds: FleetSummary['bounds'];
  if (active.length > 0) {
    bounds = {
      north: Math.max(...active.map(m => m.lat)),
      south: Math.min(...active.map(m => m.lat)),
      east: Math.max(...active.map(m => m.lng)),
      west: Math.min(...active.map(m => m.lng)),
    };
  }

  return {
    totalMachines: machines.length,
    activeMachines: active.length,
    categories,
    bounds,
  };
}

/**
 * Check if a new placement would cannibalize an existing machine.
 * Returns the nearby machine if one is within the threshold distance.
 *
 * @param lat - Proposed location latitude
 * @param lng - Proposed location longitude
 * @param category - Proposed machine category
 * @param thresholdMiles - Minimum distance between same-category machines (default: 0.5)
 */
export function checkCannibalization(
  lat: number,
  lng: number,
  category: Category,
  thresholdMiles = 0.5
): UserMachine | null {
  const machines = getUserMachines().filter(m => m.status === 'active' && m.category === category);

  for (const m of machines) {
    const dlat = (m.lat - lat) * 69; // rough miles per degree latitude
    const dlng = (m.lng - lng) * 54.6; // rough miles per degree longitude (mid-US)
    const distance = Math.sqrt(dlat * dlat + dlng * dlng);

    if (distance < thresholdMiles) {
      return m;
    }
  }

  return null;
}

// ─── Helpers ────────────────────────────────────────────────────────────

function saveMachines(machines: UserMachine[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(machines));
  } catch {
    console.warn('Failed to save machines to localStorage');
  }
}

function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'anon';
  const key = 'vendradar_user_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(key, id);
  }
  return id;
}
