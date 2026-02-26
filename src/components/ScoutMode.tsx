'use client';

import { useMemo, useState } from 'react';
import { Category, LocationData } from '@/lib/types';
import { CATEGORIES } from '@/lib/scoring';
import CategorySelector from '@/components/CategorySelector';
import LocationCard from '@/components/LocationCard';
import { Loader2, Search, Lock } from 'lucide-react';

type ScoutRadius = 5 | 10 | 25;

interface ScoutResponse {
  locations: LocationData[];
  city: string;
  category: Category;
  radius: ScoutRadius;
  generatedAt: string;
}

const RADII: ScoutRadius[] = [5, 10, 25];

export default function ScoutMode() {
  const [city, setCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('gym');
  const [radius, setRadius] = useState<ScoutRadius>(10);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScoutResponse | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  const selectedCategoryName = useMemo(() => {
    return CATEGORIES.find((c) => c.id === selectedCategory)?.name || selectedCategory;
  }, [selectedCategory]);

  const displayedLocations = useMemo(() => {
    if (!results) return [];
    return isPaid ? results.locations : results.locations.slice(0, 5);
  }, [results, isPaid]);

  const handleScout = async () => {
    if (!city.trim()) {
      setError('Please enter a city or ZIP code.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setProgress(10);
    setResults(null);

    const timer = window.setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + 10));
    }, 450);

    try {
      const res = await fetch('/api/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: city.trim(), category: selectedCategory, radius }),
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || 'Scout request failed');
      }

      const payload = (await res.json()) as ScoutResponse;
      setResults(payload);
      setIsPaid(false);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to run scout right now.');
    } finally {
      window.clearInterval(timer);
      setTimeout(() => setIsLoading(false), 150);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Scout a City</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City or ZIP code</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="San Diego, CA"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Venue category</label>
          <CategorySelector
            selected={[selectedCategory]}
            onSelect={(categories) => {
              if (categories.length > 0) setSelectedCategory(categories[categories.length - 1]);
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search radius</label>
          <div className="flex gap-2">
            {RADII.map((mileRadius) => (
              <button
                key={mileRadius}
                type="button"
                onClick={() => setRadius(mileRadius)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  radius === mileRadius
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                }`}
              >
                {mileRadius} miles
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleScout}
          disabled={isLoading}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Scout Now →
        </button>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
          <p className="text-sm text-gray-700 mb-3">
            Scanning <strong>{city || 'your city'}</strong> for <strong>{selectedCategoryName}</strong> locations...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-2 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {results && !isLoading && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Scout Report: {results.city} — {selectedCategoryName}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Generated {new Date(results.generatedAt).toLocaleString()} · {results.locations.length} locations ranked
            </p>
          </div>

          <div className="space-y-3">
            {displayedLocations.map((location, index) => (
              <div key={location.id} className="relative">
                <div className="absolute -left-2 -top-2 z-10 bg-gray-900 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow">
                  #{index + 1}
                </div>
                <LocationCard location={location} />
              </div>
            ))}
          </div>

          {!isPaid && results.locations.length > 5 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
              <div className="inline-flex items-center gap-2 text-blue-700 font-semibold mb-2">
                <Lock className="w-4 h-4" />
                Unlock remaining {results.locations.length - 5} results
              </div>
              <p className="text-sm text-blue-700 mb-4">Free tier shows top 5 only. Unlock full ranked report and contact insights.</p>
              <button
                onClick={() => setIsPaid(true)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700"
              >
                Unlock Full Report — $19
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
