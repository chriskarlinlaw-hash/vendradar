import { getCached, setCached } from '@/lib/simple-cache';

export interface OSMSignals {
  poiCount: number | null;
  transitDistanceMiles: number | null;
  buildingSqft: number | null;
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

function sqMetersToSqft(v: number): number {
  return v * 10.7639;
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function polygonAreaSqMeters(geometry: Array<{ lat: number; lon: number }>): number {
  if (geometry.length < 3) return 0;
  const lat0 = geometry[0].lat;
  const lon0 = geometry[0].lon;
  const points = geometry.map(p => ({
    x: (p.lon - lon0) * 111320 * Math.cos((lat0 * Math.PI) / 180),
    y: (p.lat - lat0) * 110540,
  }));

  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    sum += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(sum / 2);
}

async function runOverpass(query: string): Promise<Array<Record<string, unknown>>> {
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return [];
  const data = (await res.json()) as { elements?: Array<Record<string, unknown>> };
  return data.elements ?? [];
}

export async function getOSMSignals(lat: number, lng: number): Promise<OSMSignals> {
  const key = `osm:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = await getCached<OSMSignals>(key);
  if (cached) return cached;

  const poiQuery = `
[out:json][timeout:8];
(
  node(around:500,${lat},${lng})[amenity];
  node(around:500,${lat},${lng})[shop];
  node(around:500,${lat},${lng})[leisure];
  way(around:500,${lat},${lng})[amenity];
  way(around:500,${lat},${lng})[shop];
  way(around:500,${lat},${lng})[leisure];
  relation(around:500,${lat},${lng})[amenity];
  relation(around:500,${lat},${lng})[shop];
  relation(around:500,${lat},${lng})[leisure];
);
out ids;
`;

  const transitQuery = `
[out:json][timeout:8];
(
  node(around:1609,${lat},${lng})[highway=bus_stop];
  node(around:1609,${lat},${lng})[railway=tram_stop];
  node(around:1609,${lat},${lng})[railway=subway_entrance];
  node(around:1609,${lat},${lng})[railway=station];
  way(around:1609,${lat},${lng})[railway=station];
);
out center;
`;

  const buildingQuery = `
[out:json][timeout:8];
way(around:100,${lat},${lng})[building];
out geom 1;
`;

  try {
    const [poiElements, transitElements, buildingElements] = await Promise.all([
      runOverpass(poiQuery),
      runOverpass(transitQuery),
      runOverpass(buildingQuery),
    ]);

    const poiCount = poiElements.length;

    let transitDistanceMiles: number | null = null;
    for (const e of transitElements) {
      const eLat = typeof e.lat === 'number' ? e.lat : (e.center as { lat?: number } | undefined)?.lat;
      const eLng = typeof e.lon === 'number' ? e.lon : (e.center as { lon?: number } | undefined)?.lon;
      if (typeof eLat !== 'number' || typeof eLng !== 'number') continue;
      const miles = haversineMiles(lat, lng, eLat, eLng);
      if (transitDistanceMiles === null || miles < transitDistanceMiles) transitDistanceMiles = miles;
    }

    let buildingSqft: number | null = null;
    const way = buildingElements.find(e => Array.isArray(e.geometry));
    if (way?.geometry) {
      const area = polygonAreaSqMeters(way.geometry as Array<{ lat: number; lon: number }>);
      if (area > 0) buildingSqft = sqMetersToSqft(area);
    }

    const result: OSMSignals = {
      poiCount: Number.isFinite(poiCount) ? poiCount : null,
      transitDistanceMiles,
      buildingSqft,
    };

    await setCached(key, result, TTL_MS);
    return result;
  } catch {
    return { poiCount: null, transitDistanceMiles: null, buildingSqft: null };
  }
}
