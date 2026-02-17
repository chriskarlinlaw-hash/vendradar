'use client';

import { useState } from 'react';
import { LocationData } from '@/lib/types';
import { CATEGORIES, getScoreColor, getScoreLabel } from '@/lib/scoring';
import { generateLocationPDF } from '@/lib/pdf-export';
import {
  X,
  MapPin,
  Users,
  TrendingUp,
  Store,
  Clock,
  Building,
  Download,
  Share2,
  ChevronRight,
  Loader2
} from 'lucide-react';

interface LocationDetailProps {
  location: LocationData;
  onClose: () => void;
}

export default function LocationDetail({ location, onClose }: LocationDetailProps) {
  const category = CATEGORIES.find(c => c.id === location.category);
  const scoreColor = getScoreColor(location.score.overall);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generateLocationPDF(location, category || CATEGORIES[0]);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-start gap-4">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold"
            style={{ backgroundColor: scoreColor }}
          >
            {location.score.overall}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-white/70 uppercase tracking-wide">
                {category?.name}
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight">{location.address}</h2>
            <div className="flex items-center gap-4 mt-3">
              <span className="text-sm text-white/80">
                Lat: {location.lat.toFixed(4)}
              </span>
              <span className="text-sm text-white/80">
                Lng: {location.lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Score Breakdown</h3>
        <div className="space-y-3">
          {[
            { label: 'Foot Traffic', score: location.score.footTraffic, weight: category?.scoringWeights.footTraffic ?? 30 },
            { label: 'Demographics', score: location.score.demographics, weight: category?.scoringWeights.demographics ?? 25 },
            { label: 'Competition', score: location.score.competition, weight: category?.scoringWeights.competition ?? 25 },
            { label: 'Building Type', score: location.score.buildingType, weight: category?.scoringWeights.buildingType ?? 20 },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{item.label} <span className="text-gray-400 text-xs">({item.weight}% weight)</span></span>
                <span className="font-medium">{item.score}/100</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${item.score}%`,
                    backgroundColor: getScoreColor(item.score)
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key metrics grid */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Location Intelligence</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users size={16} />
              <span className="text-xs">Median Income</span>
            </div>
            <div className="text-xl font-bold text-gray-800">
              ${location.demographics.medianIncome.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <TrendingUp size={16} />
              <span className="text-xs">Daily Traffic</span>
            </div>
            <div className="text-xl font-bold text-gray-800">
              {location.footTraffic.dailyEstimate.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Store size={16} />
              <span className="text-xs">Competition</span>
            </div>
            <div className="text-xl font-bold text-gray-800">
              {location.competition.count === 0 ? 'None' : `${location.competition.count} nearby`}
            </div>
            {location.competition.nearestDistance > 0 && (
              <div className="text-xs text-gray-500">
                Nearest: {location.competition.nearestDistance.toFixed(1)} miles
              </div>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Clock size={16} />
              <span className="text-xs">Peak Hours</span>
            </div>
            <div className="text-sm font-bold text-gray-800">
              {location.footTraffic.peakHours.join(', ')}
            </div>
            {location.footTraffic.proximityToTransit && (
              <div className="text-xs text-green-600 mt-1">✓ Near transit</div>
            )}
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">AI Analysis</h3>
        <div className="bg-blue-50 rounded-lg p-4">
          <ul className="space-y-2">
            {location.aiReasoning.map((reason, idx) => (
              <li key={idx} className="text-sm text-blue-800 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Product recommendations */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Recommended Product Mix</h3>
        <div className="flex flex-wrap gap-2">
          {category?.productFit.map((product) => (
            <span 
              key={product}
              className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full"
            >
              {product}
            </span>
          ))}
        </div>
        <div className="mt-3 text-xs text-gray-500">
          Peak hours: <span className="font-medium">{category?.peakHours}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 bg-gray-50">
        <div className="flex gap-3">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download size={18} />
                Export PDF Report
              </>
            )}
          </button>
          <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
            <Share2 size={18} className="text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}