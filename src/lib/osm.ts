import { getCached, setCached } from '@/lib/simple-cache';

export interface OSMSignals {
  poiCount: number | null;
  nearestTransitDistanceMiles: number | null;
  buildingSqft: number | null;
}

const OSM_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
let nextOverpassRequestAt = 0;

function metersToMiles(meters: number): number {
  return meters / 1609.34;
}

function squareMetersToSqft(m2: number): number {
  return m2 * 10.7639;
}

async function respectOverpassRateLimit(): Promise<void> {
  const now = Date.now();
  const waitMs = nextOverpassRequestAt - now;
  if (waitMs > 0) {
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }
  nextOverpassRequestAt = Date.now() + 1000;
}

function parseFirstAreaM2(geometry: Array<{ lat: number; lon: number }>): number {
  if (geometry.length < 3) return 0;
  // Shoelace approximation in local meters.
  const lat0 = geometry[0].lat;
  const lon0 = geometry[0].lon;
  const points = geometry.map(p => {
    const x = (p.lon - lon0) * 111320 * Math.cos((lat0 * Math.PI) / 180);
    const y = (p.lat - lat0) * 110540;
    return { x, y };
  });

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
}

export async function getOSMSignals(lat: number, lng: number): Promise<OSMSignals | null> {
  const cacheKey = `osm:${lat.toFixed(4)}:${lng.toFixed(4)}`;
  const cached = await getCached<OSMSignals>(cacheKey);
  if (cached) return cached;

  const query = `
[out:json][timeout:8];
(
  node(around:800,${lat},${lng})[amenity];
  way(around:800,${lat},${lng})[amenity];
  relation(around:800,${lat},${lng})[amenity];
);
out center;
(
  node(around:2000,${lat},${lng})[public_transport];
  node(around:2000,${lat},${lng})[highway=bus_stop];
  node(around:2000,${lat},${lng})[railway=station];
);
out center;
way(around:100,${lat},${lng})[building];
out geom 1;
`;

  try {
    await respectOverpassRateLimit();

    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'VendRadar/1.0',
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      elements?: Array<{
        type: string;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
        geometry?: Array<{ lat: number; lon: number }>;
      }>;
    };

    const elements = data.elements ?? [];

    const poiElements = elements.filter(e => e.tags?.amenity);
    const transitElements = elements.filter(
      e => e.tags?.public_transport || e.tags?.highway === 'bus_stop' || e.tags?.railway === 'station'
    );
    const building = elements.find(e => e.tags?.building && Array.isArray(e.geometry));

    let nearestTransitDistanceMiles: number | null = null;
    for (const t of transitElements) {
      const tLat = t.lat ?? t.center?.lat;
      const tLng = t.lon ?? t.center?.lon;
      if (typeof tLat !== 'number' || typeof tLng !== 'number') continue;
      const dLat = (tLat - lat) * 69;
      const dLng = (tLng - lng) * 54.6;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (nearestTransitDistanceMiles === null || dist < nearestTransitDistanceMiles) {
        nearestTransitDistanceMiles = dist;
      }
    }

    let buildingSqft: number | null = null;
    if (building?.geometry && building.geometry.length >= 3) {
      const areaM2 = parseFirstAreaM2(building.geometry);
      if (areaM2 > 0) {
        buildingSqft = squareMetersToSqft(areaM2);
      }
    }

    const result: OSMSignals = {
      poiCount: poiElements.length,
      nearestTransitDistanceMiles,
      buildingSqft,
    };

    await setCached(cacheKey, result, OSM_TTL_MS);
    return result;
  } catch {
    return null;
  }
}
