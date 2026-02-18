'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { LocationData, HeatMapDataPoint } from '@/lib/types';
import { getScoreColor } from '@/lib/scoring';

interface MapViewProps {
  locations: LocationData[];
  selectedLocation: LocationData | null;
  onSelectLocation: (location: LocationData) => void;
  center?: { lat: number; lng: number };
  showHeatMap?: boolean;
  heatMapData?: HeatMapDataPoint[];
}

const GOOGLE_MAPS_API_KEY = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  : '';

const hasGoogleMapsKey = GOOGLE_MAPS_API_KEY.length > 0 && GOOGLE_MAPS_API_KEY !== 'your_google_maps_api_key_here';

// ─── Google Maps Implementation ───────────────────────────────────────
function GoogleMapView({ locations, selectedLocation, onSelectLocation, center, showHeatMap, heatMapData }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const heatmapLayerRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Wait for Google Maps script (loaded globally via layout.tsx)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.google?.maps) {
        setMapLoaded(true);
        clearInterval(interval);
      } else if (attempts > 100) {
        setLoadError(true);
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || googleMapRef.current) return;

    const defaultCenter = center || (locations.length > 0
      ? { lat: locations[0].lat, lng: locations[0].lng }
      : { lat: 39.8283, lng: -98.5795 });

    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_LEFT,
      },
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.park', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    });

    infoWindowRef.current = new google.maps.InfoWindow();
  }, [mapLoaded, center, locations]);

  // Update markers when locations change
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    if (locations.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    locations.forEach((loc) => {
      const color = getScoreColor(loc.score.overall);
      const isSelected = selectedLocation?.id === loc.id;

      const marker = new google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map: googleMapRef.current!,
        title: `${loc.address} (Score: ${loc.score.overall})`,
        label: {
          text: String(loc.score.overall),
          color: '#ffffff',
          fontSize: isSelected ? '13px' : '11px',
          fontWeight: 'bold',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: isSelected ? '#1d4ed8' : '#ffffff',
          strokeWeight: isSelected ? 3 : 2,
          scale: isSelected ? 20 : 15,
        },
        zIndex: isSelected ? 1000 : 1,
        animation: isSelected ? google.maps.Animation.BOUNCE : undefined,
      });

      // Info window on hover
      marker.addListener('mouseover', () => {
        if (infoWindowRef.current) {
          const warnings = loc.score.negativeSignals?.length ?? 0;
          const warningHtml = warnings > 0
            ? `<div style="font-size: 11px; color: #b91c1c; margin-top: 4px;">⚠ ${warnings} warning${warnings > 1 ? 's' : ''}</div>`
            : '';
          infoWindowRef.current.setContent(`
            <div style="padding: 8px; max-width: 250px;">
              <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${loc.address}</div>
              <div style="color: ${color}; font-weight: bold; font-size: 18px;">Score: ${loc.score.overall}/100</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">
                Income: $${Math.round(loc.demographics.medianIncome).toLocaleString()} · Traffic: ${Math.round(loc.footTraffic.dailyEstimate).toLocaleString()}/day
              </div>
              ${warningHtml}
            </div>
          `);
          infoWindowRef.current.open(googleMapRef.current!, marker);
        }
      });

      marker.addListener('click', () => onSelectLocation(loc));
      markersRef.current.push(marker);
      bounds.extend({ lat: loc.lat, lng: loc.lng });
    });

    // Fit map to show all markers
    if (locations.length > 1) {
      googleMapRef.current.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    } else {
      googleMapRef.current.setCenter({ lat: locations[0].lat, lng: locations[0].lng });
      googleMapRef.current.setZoom(15);
    }
  }, [locations, selectedLocation, mapLoaded, onSelectLocation]);

  // Pan to selected location
  useEffect(() => {
    if (!googleMapRef.current || !selectedLocation) return;
    googleMapRef.current.panTo({ lat: selectedLocation.lat, lng: selectedLocation.lng });

    // Stop bouncing on previous markers
    markersRef.current.forEach((m, i) => {
      if (locations[i]?.id === selectedLocation.id) {
        m.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => m.setAnimation(null), 1500);
      } else {
        m.setAnimation(null);
      }
    });
  }, [selectedLocation, locations]);

  // Heat map layer
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    // Remove existing heat map layer
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.setMap(null);
      heatmapLayerRef.current = null;
    }

    if (!showHeatMap || !heatMapData || heatMapData.length === 0) return;

    // Check if visualization library is loaded
    if (!google.maps.visualization) return;

    const points = heatMapData.map(point => ({
      location: new google.maps.LatLng(point.lat, point.lng),
      weight: point.weight,
    }));

    heatmapLayerRef.current = new google.maps.visualization.HeatmapLayer({
      data: points,
      map: googleMapRef.current,
      radius: 40,
      opacity: 0.6,
      gradient: [
        'rgba(0, 0, 0, 0)',
        'rgba(239, 68, 68, 0.4)',   // Red (low)
        'rgba(249, 115, 22, 0.5)',  // Orange
        'rgba(245, 158, 11, 0.6)',  // Yellow
        'rgba(34, 197, 94, 0.7)',   // Green (high)
        'rgba(34, 197, 94, 0.9)',   // Green strong
      ],
    });
  }, [showHeatMap, heatMapData, mapLoaded]);

  if (loadError) {
    return <FallbackMapView locations={locations} selectedLocation={selectedLocation} onSelectLocation={onSelectLocation} center={center} />;
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading map...</p>
          </div>
        </div>
      )}
      {locations.length > 0 && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2">
          <span className="text-sm font-medium text-gray-700">{locations.length} locations found</span>
        </div>
      )}
    </div>
  );
}

// ─── SVG Fallback (no API key) ────────────────────────────────────────
function FallbackMapView({ locations, selectedLocation, onSelectLocation }: MapViewProps) {
  const getBounds = useCallback(() => {
    if (locations.length === 0) return { minLat: 39, maxLat: 40, minLng: -99, maxLng: -98 };
    const lats = locations.map(l => l.lat);
    const lngs = locations.map(l => l.lng);
    const padding = 0.005;
    return {
      minLat: Math.min(...lats) - padding,
      maxLat: Math.max(...lats) + padding,
      minLng: Math.min(...lngs) - padding,
      maxLng: Math.max(...lngs) + padding,
    };
  }, [locations]);

  const bounds = getBounds();
  const latRange = bounds.maxLat - bounds.minLat || 0.01;
  const lngRange = bounds.maxLng - bounds.minLng || 0.01;

  const project = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / lngRange) * 720 + 40;
    const y = ((bounds.maxLat - lat) / latRange) * 520 + 40;
    return { x, y };
  };

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
        <svg className="w-full h-full opacity-20">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="absolute top-4 left-4 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 z-10">
        <span className="text-xs text-yellow-700">Preview mode — add Google Maps API key for full map</span>
      </div>

      <svg className="absolute inset-0 w-full h-full">
        {locations.map((location) => {
          const coords = project(location.lat, location.lng);
          const isSelected = selectedLocation?.id === location.id;
          const color = getScoreColor(location.score.overall);

          return (
            <g
              key={location.id}
              onClick={() => onSelectLocation(location)}
              className="cursor-pointer"
              style={{ transform: `translate(${coords.x}px, ${coords.y}px)` }}
            >
              {isSelected && (
                <circle r="20" fill={color} opacity="0.3">
                  <animate attributeName="r" from="15" to="25" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                r={isSelected ? 14 : 10}
                fill={color}
                stroke="white"
                strokeWidth={isSelected ? 3 : 2}
                className="transition-all duration-200"
              />
              <text
                y="4"
                textAnchor="middle"
                fill="white"
                fontSize={isSelected ? '10' : '8'}
                fontWeight="bold"
                className="pointer-events-none"
              >
                {location.score.overall}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3">
        <div className="text-xs font-medium text-gray-600 mb-2">Location Score</div>
        <div className="space-y-1">
          {[
            { color: 'bg-green-500', label: '75-100 (Excellent)' },
            { color: 'bg-yellow-500', label: '55-74 (Good)' },
            { color: 'bg-orange-500', label: '35-54 (Fair)' },
            { color: 'bg-red-500', label: '0-34 (Poor)' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {locations.length > 0 && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2">
          <span className="text-sm font-medium text-gray-700">{locations.length} locations found</span>
        </div>
      )}
    </div>
  );
}

// ─── Exported Component ─────────────────────────────────────────
export default function MapView(props: MapViewProps) {
  if (hasGoogleMapsKey) {
    return <GoogleMapView {...props} />;
  }
  return <FallbackMapView {...props} />;
}
