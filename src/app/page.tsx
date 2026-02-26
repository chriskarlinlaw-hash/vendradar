'use client';

import { useState, useCallback } from 'react';
import { Category, LocationData, HeatMapDataPoint } from '@/lib/types';
import { dataProvider } from '@/lib/data-provider';
import CategorySelector from '@/components/CategorySelector';
import SearchBar from '@/components/SearchBar';
import MapView from '@/components/MapView';
import LocationCard from '@/components/LocationCard';
import LocationDetail from '@/components/LocationDetail';
import LocationComparison from '@/components/LocationComparison';
import { MapPin, Sparkles, TrendingUp, Shield, Layers, GitCompare } from 'lucide-react';
import ScoutMode from '@/components/ScoutMode';

export default function Home() {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(['office']);
  const [activeMode, setActiveMode] = useState<'address' | 'scout'>('address');
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Heat map state
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [heatMapData, setHeatMapData] = useState<HeatMapDataPoint[]>([]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>();

  // Comparison state
  const [compareSelection, setCompareSelection] = useState<LocationData[]>([]);
  const [comparisonPair, setComparisonPair] = useState<[LocationData, LocationData] | null>(null);

  const handleCompareToggle = useCallback((location: LocationData) => {
    setCompareSelection(prev => {
      const isAlreadySelected = prev.some(l => l.id === location.id);
      if (isAlreadySelected) {
        return prev.filter(l => l.id !== location.id);
      }
      const next = [...prev, location];
      if (next.length === 2) {
        setComparisonPair([next[0], next[1]]);
        return [];
      }
      return next;
    });
  }, []);

  const handleSearch = async (query: string, lat?: number, lng?: number) => {
    setIsLoading(true);
    setHasSearched(true);
    setSelectedLocation(null);
    setCompareSelection([]);
    setComparisonPair(null);

    try {
      const result = await dataProvider.searchLocations(query, selectedCategories, lat, lng);
      setLocations(result.locations);
      if (result.center) setMapCenter(result.center);
      if (result.heatMapPoints) setHeatMapData(result.heatMapPoints);
      if (result.locations.length > 0) {
        setSelectedLocation(result.locations[0]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">VendRadar</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">MVP</span>
            </div>
            <nav className="flex items-center gap-6">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
              <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full font-medium">
                Beta • Free Access
              </span>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {!hasSearched && (
        <section className="bg-gradient-to-b from-blue-50 to-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Find Your Next <span className="text-blue-600">Profitable</span> Vending Location
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              AI-powered location intelligence for vending operators. Analyze foot traffic, demographics, and competition—instantly.
            </p>
            
            {/* Quick stats */}
            <div className="flex justify-center gap-8 mb-8">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-600">AI-Powered Scoring</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-600">Real-Time Data</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600">Census Demographics</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main App Interface */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto mb-6 bg-white rounded-xl border border-gray-200 p-1.5 flex gap-1">
            <button
              onClick={() => setActiveMode('address')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeMode === 'address' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Address Search
            </button>
            <button
              onClick={() => setActiveMode('scout')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                activeMode === 'scout' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Scout Mode
            </button>
          </div>

          {activeMode === 'scout' ? (
            <ScoutMode />
          ) : (
            <>
              {/* Search Section */}
              <div className="max-w-2xl mx-auto mb-8">
                <SearchBar
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  placeholder="Search for a city (e.g., 'San Diego', 'Austin', 'Denver')..."
                />
              </div>

              {/* Category Selector */}
              <div className="max-w-2xl mx-auto mb-8">
                <CategorySelector
                  selected={selectedCategories}
                  onSelect={setSelectedCategories}
                />
              </div>

              {/* Results Section */}
              {hasSearched && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Map */}
                  <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative" style={{ height: '600px' }}>
                      <MapView
                        locations={locations}
                        selectedLocation={selectedLocation}
                        onSelectLocation={setSelectedLocation}
                        center={mapCenter}
                        showHeatMap={showHeatMap}
                        heatMapData={heatMapData}
                      />
                      {/* Map controls overlay */}
                      <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                        {heatMapData.length > 0 && (
                          <button
                            onClick={() => setShowHeatMap(!showHeatMap)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium shadow-md transition-colors ${
                              showHeatMap
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <Layers size={14} />
                            Heat Map
                          </button>
                        )}
                        {compareSelection.length === 1 && (
                          <div className="bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-md flex items-center gap-1.5">
                            <GitCompare size={14} />
                            Select 2nd location to compare
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Location List / Detail */}
                  <div className="space-y-4">
                    {selectedLocation ? (
                      <LocationDetail
                        location={selectedLocation}
                        onClose={() => setSelectedLocation(null)}
                      />
                    ) : (
                      <div className="space-y-4">
                        {locations.map((location: LocationData) => (
                          <LocationCard
                            key={location.id}
                            location={location}
                            isSelected={false}
                            isCompareSelected={compareSelection.some(l => l.id === location.id)}
                            onClick={() => setSelectedLocation(location)}
                            onCompareToggle={handleCompareToggle}
                          />
                        ))}
                        {locations.length === 0 && !isLoading && (
                          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No locations found. Try a different search.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comparison Modal */}
              {comparisonPair && (
                <LocationComparison
                  locations={comparisonPair}
                  onClose={() => setComparisonPair(null)}
                />
              )}

              {/* Empty State */}
              {!hasSearched && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MapPin className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to scout locations?</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Enter a city above, select your vending category, and discover high-potential locations with AI-powered analysis.
                  </p>

                  {/* Demo suggestions */}
                  <div className="mt-8 flex flex-wrap justify-center gap-2">
                    <span className="text-sm text-gray-500 mr-2">Try:</span>
                    {['San Diego', 'Austin', 'Denver', 'Phoenix', 'Nashville', 'Chicago', 'Miami'].map((city) => (
                      <button
                        key={city}
                        onClick={() => handleSearch(city)}
                        className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why VendRadar?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Stop driving around hoping to find good locations. Use data to make informed decisions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Foot Traffic Analysis</h3>
              <p className="text-gray-600 text-sm">
                Real-time estimates of daily visitors based on nearby businesses, transit access, and area density.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Demographics Data</h3>
              <p className="text-gray-600 text-sm">
                US Census Bureau data on income, age, employment, and population density for every location.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Recommendations</h3>
              <p className="text-gray-600 text-sm">
                Get personalized recommendations and reasoning for why each location fits your vending category.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              100% self-serve. Start free, upgrade when you&apos;re ready.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Free</div>
              <div className="mb-5">
                <span className="text-4xl font-bold text-gray-900">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Prove the value before you pay</p>
              <ul className="space-y-2.5 mb-6">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>5 location lookups per month</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Basic demographics</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Location score</span>
                </li>
              </ul>
              <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="block w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center cursor-pointer text-sm">
                Start Searching
              </a>
            </div>

            {/* Basic Tier */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Basic</div>
              <div className="mb-5">
                <span className="text-4xl font-bold text-gray-900">$29</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Scout Mode — active location scouting</p>
              <ul className="space-y-2.5 mb-6">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span><strong>Unlimited</strong> lookups</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>All 8 category filters</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Full data overlays</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>PDF export</span>
                </li>
              </ul>
              <a href="/beta" className="block w-full bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors text-center text-sm">
                Get Started
              </a>
            </div>

            {/* Pro Tier */}
            <div className="bg-white rounded-xl border-2 border-blue-500 p-6 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-2">Pro</div>
              <div className="mb-5">
                <span className="text-4xl font-bold text-gray-900">$79</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">AI Prospector — let AI find locations for you</p>
              <ul className="space-y-2.5 mb-6">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Everything in Basic</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>AI recommendations</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Batch analysis (50 addresses)</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Competition alerts</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
              <a href="/beta" className="block w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center text-sm">
                Start Free Trial
              </a>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Enterprise</div>
              <div className="mb-5">
                <span className="text-4xl font-bold text-gray-900">$299</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">For teams and large operators (500+ machines)</p>
              <ul className="space-y-2.5 mb-6">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Everything in Pro</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Multi-user accounts</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>API access</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>White-label reports</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Custom scoring algorithms</span>
                </li>
              </ul>
              <a href="/beta" className="block w-full bg-gray-900 text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors text-center text-sm">
                Get Started
              </a>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            All plans are self-serve. No contracts, cancel anytime.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to find your next profitable location?
          </h2>
          <p className="text-gray-400 mb-8">
            Be among the first vending operators to use data — not guesses — to grow their business.
          </p>
          <a href="/beta" className="inline-block bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors">
            Start Free Trial
          </a>
          <p className="text-gray-500 text-sm mt-4">No credit card required. 14-day free trial.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">VendRadar</span>
            </div>
            <p className="text-sm text-gray-500">
              © 2026 VendRadar. Built for vending operators.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}