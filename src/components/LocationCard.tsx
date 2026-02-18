'use client';

import { LocationData } from '@/lib/types';
import { CATEGORIES, getScoreColor, getScoreLabel } from '@/lib/scoring';
import { MapPin, Users, TrendingUp, Store, Clock, AlertTriangle, GitCompare } from 'lucide-react';

interface LocationCardProps {
  location: LocationData;
  isSelected?: boolean;
  isCompareSelected?: boolean;
  onClick?: () => void;
  onCompareToggle?: (location: LocationData) => void;
}

export default function LocationCard({ location, isSelected, isCompareSelected, onClick, onCompareToggle }: LocationCardProps) {
  const category = CATEGORIES.find(c => c.id === location.category);
  const scoreColor = getScoreColor(location.score.overall);
  const scoreLabel = getScoreLabel(location.score.overall);
  const hasWarnings = (location.score.negativeSignals?.length ?? 0) > 0;
  const dataQuality = location.score.dataQuality || 'medium';

  const qualityDotColor = {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-red-500',
  }[dataQuality];

  return (
    <div
      className={`
        bg-white rounded-lg border transition-all duration-200
        ${isCompareSelected
          ? 'border-purple-500 shadow-lg ring-2 ring-purple-100'
          : isSelected
            ? 'border-blue-500 shadow-lg ring-2 ring-blue-100'
            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
        }
      `}
    >
      {/* Header with score */}
      <div className="flex items-start gap-3 p-4 border-b border-gray-100 cursor-pointer" onClick={onClick}>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 score-pulse relative"
          style={{ backgroundColor: scoreColor }}
        >
          {location.score.overall}
          {/* Data quality dot */}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${qualityDotColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${scoreColor}20`, color: scoreColor }}
            >
              {scoreLabel}
            </span>
            <span className="text-xs text-gray-500">{category?.name}</span>
            {hasWarnings && (
              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
            )}
          </div>
          <h4 className="font-semibold text-gray-800 mt-1 line-clamp-2">{location.address}</h4>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 p-4 cursor-pointer" onClick={onClick}>
        <div className="flex items-center gap-2">
          <Users size={16} className="text-gray-400" />
          <div>
            <div className="text-xs text-gray-500">Income</div>
            <div className="text-sm font-medium">${(location.demographics.medianIncome / 1000).toFixed(0)}k</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-gray-400" />
          <div>
            <div className="text-xs text-gray-500">Daily Traffic</div>
            <div className="text-sm font-medium">{location.footTraffic.dailyEstimate.toLocaleString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Store size={16} className="text-gray-400" />
          <div>
            <div className="text-xs text-gray-500">Competition</div>
            <div className="text-sm font-medium">
              {location.competition.count === 0 ? 'None nearby' : `${location.competition.count} within radius`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-400" />
          <div>
            <div className="text-xs text-gray-500">Peak Hours</div>
            <div className="text-sm font-medium">{location.footTraffic.peakHours.slice(0, 2).join(', ')}</div>
          </div>
        </div>
      </div>

      {/* AI Reasoning + Compare button */}
      <div className="px-4 pb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs font-medium text-blue-700 mb-2">AI Analysis</div>
          <ul className="space-y-1">
            {location.aiReasoning.slice(0, 2).map((reason, idx) => (
              <li key={idx} className={`text-xs flex items-start gap-2 ${
                reason.startsWith('⚠') ? 'text-amber-700' : 'text-blue-600'
              }`}>
                <span className={`mt-0.5 ${reason.startsWith('⚠') ? 'text-amber-400' : 'text-blue-400'}`}>
                  {reason.startsWith('⚠') ? '' : '•'}
                </span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Compare toggle */}
        {onCompareToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompareToggle(location);
            }}
            className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-colors ${
              isCompareSelected
                ? 'bg-purple-100 text-purple-700 border border-purple-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            <GitCompare size={14} />
            {isCompareSelected ? 'Selected for comparison' : 'Compare'}
          </button>
        )}
      </div>
    </div>
  );
}
