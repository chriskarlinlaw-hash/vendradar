'use client';

import { LocationData } from '@/lib/types';
import { CATEGORIES, getScoreColor, getScoreLabel } from '@/lib/scoring';
import { MapPin, Users, TrendingUp, Store, Clock, Download } from 'lucide-react';

interface LocationCardProps {
  location: LocationData;
  isSelected?: boolean;
  onClick?: () => void;
}

export default function LocationCard({ location, isSelected, onClick }: LocationCardProps) {
  const category = CATEGORIES.find(c => c.id === location.category);
  const scoreColor = getScoreColor(location.score.overall);
  const scoreLabel = getScoreLabel(location.score.overall);

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border transition-all duration-200 cursor-pointer
        ${isSelected 
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-100' 
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
        }
      `}
    >
      {/* Header with score */}
      <div className="flex items-start gap-3 p-4 border-b border-gray-100">
        <div 
          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 score-pulse"
          style={{ backgroundColor: scoreColor }}
        >
          {location.score.overall}
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
          </div>
          <h4 className="font-semibold text-gray-800 mt-1 line-clamp-2">{location.address}</h4>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3 p-4">
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
              {location.competition.count === 0 ? 'None nearby' : `${location.competition.count} within 0.5mi`}
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

      {/* AI Reasoning */}
      <div className="px-4 pb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs font-medium text-blue-700 mb-2">AI Analysis</div>
          <ul className="space-y-1">
            {location.aiReasoning.slice(0, 2).map((reason, idx) => (
              <li key={idx} className="text-xs text-blue-600 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}