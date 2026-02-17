'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { LocationData } from '@/lib/types';
import { getScoreColor } from '@/lib/scoring';

interface MapViewProps {
  locations: LocationData[];
  selectedLocation: LocationData | null;
  onSelectLocation: (location: LocationData) => void;
  center?: { lat: number; lng: number };
}

// Check if Google Maps API key is configured
const GOOGLE_MAPS_API_KEY = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  : '';

const hasGoogleMapsKey = GOOGLE_MAPS_API_KEY.length > 0 && GOOGLE_MAPS_API_KEY !== 'your_google_maps_api_key_here';

// ─── Google Maps Implementation ───────────────────────────────────────
function GoogleMapView({ locations, selectedLocation, onSelectLocation, center }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setLoadError(true);
    document.head.appendChild(script);

    return () => {
      // Don't remove script on cleanup — Google Maps doesn't support re-init
    };
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
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
      ],
    });
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
          strokeColor: '#ffffff',
          strokeWeight: isSelected ? 3 : 2,
          scale: isSelected ? 18 : 14,
        },
        zIndex: isSelected ? 1000 : 1,
      });

      marker.addListener('click', () => onSelectLocation(loc));
      markersRef.current.push(marker);
      bounds.extend({ lat: loc.lat, lng: loc.lng });
    });

    // Fit map to show all markers with padding
    if (locations.length > 1) {
      googleMapRef.current.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    } else {
      googleMapRef.current.setCenter({ lat: locations[0].lat, lng: locations[0].lng });
      googleMapRef.current.setZoom(15);
    }
  }, [locations, selectedLocation, mapLoaded, onSelectLocation]);

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
      {/* Location count */}
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
  // Calculate bounds from locations to properly center the SVG view
  const getBounds = useCallback(() => {
    if (locations.length === 0) return { minLat: 39, maxLat: 40, minLng: -99, maxLng: -98 };
    const lats = locations.map(l => l.lat);
    const lngs = locations.map(l => l.lng);
    const padding = 0.005; // Small padding around markers
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

  // Project lat/lng into SVG space (0-800 x 0-600)
  const project = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / lngRange) * 720 + 40;
    const y = ((bounds.maxLat - lat) / latRange) * 520 + 40;
    return { x, y };
  };

  return (
    <div className="relative w-full h-full bg-gray-100 rounded-lg overflow-hidden">
      {/* Background */}
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

      {/* No API key notice */}
      <div className="absolute top-4 left-4 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 z-10">
        <span className="text-xs text-yellow-700">Preview mode — add Google Maps API key for full map</span>
      </div>

      {/* Location markers */}
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

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-3">
        <div className="text-xs font-medium text-gray-600 mb-2">Location Score</div>
        <div className="space-y-1">
          {[
            { color: 'bg-green-500', label: '80-100 (Excellent)' },
            { color: 'bg-yellow-500', label: '60-79 (Good)' },
            { color: 'bg-orange-500', label: '40-59 (Fair)' },
            { color: 'bg-red-500', label: '0-39 (Poor)' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
              <span className="text-xs text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Location count */}
      {locations.length > 0 && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-md px-3 py-2">
          <span className="text-sm font-medium text-gray-700">{locations.length} locations found</span>
        </div>
      )}
    </div>
  );
}

// ─── Exported Component (auto-selects implementation) ─────────────────
export default function MapView(props: MapViewProps) {
  if (hasGoogleMapsKey) {
    return <GoogleMapView {...props} />;
  }
  return <FallbackMapView {...props} />;
}
