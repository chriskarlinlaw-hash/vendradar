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
  ChevronDown,
  Loader2,
  AlertTriangle,
  Info,
  Activity,
} from 'lucide-react';

interface LocationDetailProps {
  location: LocationData;
  onClose: () => void;
}

function DataQualityBadge({ quality }: { quality: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { color: 'bg-green-500', label: 'High confidence', textColor: 'text-green-700', bgColor: 'bg-green-50' },
    medium: { color: 'bg-yellow-500', label: 'Medium confidence', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
    low: { color: 'bg-red-500', label: 'Low confidence', textColor: 'text-red-700', bgColor: 'bg-red-50' },
  }[quality];

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
      <span className={`w-2 h-2 rounded-full ${config.color}`} />
      {config.label}
    </span>
  );
}

export default function LocationDetail({ location, onClose }: LocationDetailProps) {
  const category = CATEGORIES.find(c => c.id === location.category);
  const scoreColor = getScoreColor(location.score.overall);
  const scoreLabel = getScoreLabel(location.score.overall);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const negativeSignals = location.score.negativeSignals || [];
  const dataQuality = location.score.dataQuality || 'medium';

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
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${scoreColor}30`, color: scoreColor }}
              >
                {scoreLabel}
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight">{location.address}</h2>
            <div className="flex items-center gap-4 mt-3">
              <DataQualityBadge quality={dataQuality} />
              <span className="text-sm text-white/60">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Negative Signals Warning */}
      {negativeSignals.length > 0 && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-sm font-semibold text-red-800">
              {negativeSignals.length} Warning{negativeSignals.length > 1 ? 's' : ''} Detected
            </span>
          </div>
          <ul className="space-y-1.5">
            {negativeSignals.map((signal, idx) => (
              <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Score breakdown */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Score Breakdown</h3>
        <div className="space-y-3">
          {[
            {
              key: 'footTraffic',
              label: 'Foot Traffic',
              score: location.score.footTraffic,
              weight: category?.scoringWeights.footTraffic ?? 25,
              detail: `Based on ${location.userRatingsTotal ?? 0} Google reviews (popularity proxy). Population density: ${location.demographics.populationDensity?.toLocaleString() ?? 'N/A'}/sq mi.`,
            },
            {
              key: 'demographics',
              label: 'Demographics',
              score: location.score.demographics,
              weight: category?.scoringWeights.demographics ?? 25,
              detail: `Median income: $${Math.round(location.demographics.medianIncome).toLocaleString()}. Target for ${category?.name}: $${(category?.idealDemographics.minIncome ?? 45000).toLocaleString()}+. Employment rate: ${Math.round(location.demographics.employmentRate * 100)}%. Median age: ${location.demographics.medianAge}.`,
            },
            {
              key: 'competition',
              label: 'Competition',
              score: location.score.competition,
              weight: category?.scoringWeights.competition ?? 20,
              detail: `${location.competition.placeCountInRadius ?? location.competition.count} ${category?.name.toLowerCase()} found in search radius.${location.competition.nearestDistance > 0 ? ` Nearest competitor: ${location.competition.nearestDistance.toFixed(1)} miles.` : ''} Saturation: ${location.competition.saturationLevel}.`,
            },
            {
              key: 'buildingType',
              label: 'Building Type',
              score: location.score.buildingType,
              weight: category?.scoringWeights.buildingType ?? 30,
              detail: location.placeTypes && location.placeTypes.length > 0
                ? `Google classifies as: [${location.placeTypes.slice(0, 4).join(', ')}]. Expected for ${category?.name}: [${category?.expectedPlaceTypes?.slice(0, 3).join(', ')}].`
                : `No Google Places type data available — score based on Census area heuristics (lower confidence).`,
            },
          ].map((item) => (
            <div key={item.key}>
              <button
                onClick={() => toggleSection(item.key)}
                className="w-full"
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 flex items-center gap-1">
                    {item.label}
                    <span className="text-gray-400 text-xs">({item.weight}%)</span>
                    <Info size={12} className="text-gray-400 ml-1" />
                  </span>
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
              </button>
              {expandedSection === item.key && (
                <div className="mt-2 ml-1 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  {item.detail}
                </div>
              )}
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
              ${Math.round(location.demographics.medianIncome).toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <TrendingUp size={16} />
              <span className="text-xs">Daily Traffic Est.</span>
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
              <Activity size={16} />
              <span className="text-xs">Pop. Density</span>
            </div>
            <div className="text-xl font-bold text-gray-800">
              {(location.demographics.populationDensity ?? 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">people/sq mi</div>
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">AI Analysis</h3>
        <div className="bg-blue-50 rounded-lg p-4">
          <ul className="space-y-2">
            {location.aiReasoning.map((reason, idx) => (
              <li key={idx} className={`text-sm flex items-start gap-2 ${
                reason.startsWith('⚠') ? 'text-amber-800' : 'text-blue-800'
              }`}>
                <span className={`mt-0.5 ${reason.startsWith('⚠') ? 'text-amber-500' : 'text-blue-400'}`}>
                  {reason.startsWith('⚠') ? '' : '•'}
                </span>
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
