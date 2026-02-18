'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string, lat?: number, lng?: number) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export default function SearchBar({ onSearch, isLoading, placeholder = 'Enter city or address...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const selectedPlaceRef = useRef<{ address: string; lat: number; lng: number } | null>(null);

  // Wait for Google Maps API to be available (loaded by MapView or layout)
  useEffect(() => {
    const checkGoogle = () => {
      if (typeof google !== 'undefined' && google.maps?.places) {
        setApiReady(true);
        return true;
      }
      return false;
    };

    if (checkGoogle()) return;

    // Poll for API availability (it loads async)
    const interval = setInterval(() => {
      if (checkGoogle()) clearInterval(interval);
    }, 300);

    return () => clearInterval(interval);
  }, []);

  // Initialize autocomplete once API is ready
  useEffect(() => {
    if (!apiReady || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode'],
      fields: ['formatted_address', 'name', 'geometry'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      if (place) {
        const address = place.formatted_address || place.name || '';
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();
        setQuery(address);
        if (lat && lng) {
          selectedPlaceRef.current = { address, lat, lng };
          // Auto-search when a place is selected from dropdown
          onSearch(address, lat, lng);
        }
      }
    });
  }, [apiReady, onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      const place = selectedPlaceRef.current;
      if (place && place.address === query.trim()) {
        onSearch(query.trim(), place.lat, place.lng);
      } else {
        onSearch(query.trim());
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            selectedPlaceRef.current = null;
          }}
          placeholder={placeholder}
          className="w-full pl-12 pr-28 py-4 bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-base"
          disabled={isLoading}
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading || !query.trim()}
        className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Analyzing...' : 'Search'}
      </button>
    </form>
  );
}
