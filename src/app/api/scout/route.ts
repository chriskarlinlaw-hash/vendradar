import { NextRequest, NextResponse } from 'next/server';
import { Category, LocationData } from '@/lib/types';
import { calculateLocationScore, generateAIReasoning, V2ScoringInput } from '@/lib/scoring';
import { buildFootTraffic } from '@/lib/foot-traffic-aggregator';
import {
  geocode,
  findNearbyPlaces,
  getPlaceDetails,
  getDemographicsForLocation,
  estimateCompetition,
} from '@/app/api/search/route';

const VALID_RADII = [5, 10, 25] as const;
type ScoutRadius = (typeof VALID_RADII)[number];

interface ScoutRequestBody {
  city: string;
  category: Category;
  radius?: ScoutRadius;
}

interface ScoutResponse {
  locations: LocationData[];
  city: string;
  category: Category;
  radius: ScoutRadius;
  generatedAt: string;
}

function isValidCategory(value: string): value is Category {
  return [
    'office',
    'gym',
    'hospital',
    'school',
    'manufacturing',
    'apartment',
    'hotel',
    'transit',
  ].includes(value);
}

function milesToMeters(miles: ScoutRadius): number {
  return Math.round(miles * 1609.34);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ScoutRequestBody;
    const city = body.city?.trim();
    const category = body.category;
    const requestedRadius = body.radius ?? 10;
    const radius: ScoutRadius = VALID_RADII.includes(requestedRadius as ScoutRadius)
      ? (requestedRadius as ScoutRadius)
      : 10;

    if (!city || !isValidCategory(category)) {
      return NextResponse.json({ error: 'Invalid city or category' }, { status: 400 });
    }

    const center = await geocode(city);
    if (!center) {
      return NextResponse.json({ error: 'Unable to geocode city' }, { status: 400 });
    }

    const places = await findNearbyPlaces(center.lat, center.lng, category, milesToMeters(radius));
    const placesToProcess = places.slice(0, 60);

    if (placesToProcess.length === 0) {
      const emptyResponse: ScoutResponse = {
        locations: [],
        city,
        category,
        radius,
        generatedAt: new Date().toISOString(),
      };
      return NextResponse.json(emptyResponse);
    }

    const detailPromises = placesToProcess.map((place) => getPlaceDetails(place.placeId));
    const allDetails = await Promise.all(detailPromises);

    const { demographics: areaDemographics, hasCensusData } = await getDemographicsForLocation(center.lat, center.lng);

    const scoredLocations: LocationData[] = [];

    for (let i = 0; i < placesToProcess.length; i++) {
      const place = placesToProcess[i];
      const details = allDetails[i];

      const placeTypes = details?.types || place.types || [];
      const userRatingsTotal = details?.userRatingsTotal ?? place.userRatingsTotal ?? 0;
      const businessStatus = details?.businessStatus || place.businessStatus;
      const hasOpeningHours = details?.hasOpeningHours ?? undefined;

      const footTraffic = await buildFootTraffic({
        category,
        placeName: place.name,
        lat: place.lat,
        lng: place.lng,
        googleRatingsTotal: userRatingsTotal,
        censusDensity: areaDemographics.populationDensity,
      });

      const competition = estimateCompetition(placesToProcess, i);

      const scoringInput: V2ScoringInput = {
        demographics: areaDemographics,
        competition,
        footTraffic,
        category,
        placeTypes,
        userRatingsTotal,
        businessStatus,
        hasOpeningHours,
        isAreaLevel: false,
        hasPlaceDetails: !!details,
        hasCensusData,
      };

      const score = calculateLocationScore(scoringInput);
      const reasoning = generateAIReasoning(score, category);

      scoredLocations.push({
        id: `scout-${Date.now()}-${category}-${i}`,
        address: `${place.name}, ${place.address}`,
        lat: place.lat,
        lng: place.lng,
        category,
        score,
        demographics: areaDemographics,
        competition,
        footTraffic: { ...footTraffic, score: score.footTraffic },
        aiReasoning: reasoning,
        placeTypes,
        businessStatus: businessStatus as LocationData['businessStatus'],
        userRatingsTotal,
      });
    }

    const response: ScoutResponse = {
      locations: scoredLocations.sort((a, b) => b.score.overall - a.score.overall).slice(0, 20),
      city,
      category,
      radius,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Scout API error:', error);
    return NextResponse.json({ error: 'Scout failed' }, { status: 500 });
  }
}
