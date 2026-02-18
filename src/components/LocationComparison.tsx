'use client';

import { LocationData } from '@/lib/types';
import { CATEGORIES, getScoreColor, getScoreLabel } from '@/lib/scoring';
import { X, AlertTriangle, Trophy, TrendingUp, Users, Store, Building } from 'lucide-react';

interface LocationComparisonProps {
  locations: [LocationData, LocationData];
  onClose: () => void;
}

function ComparisonBar({
  label,
  icon,
  valueA,
  valueB,
  maxVal = 100,
}: {
  label: string;
  icon: React.ReactNode;
  valueA: number;
  valueB: number;
  maxVal?: number;
}) {
  const colorA = getScoreColor(valueA);
  const colorB = getScoreColor(valueB);
  const winner = valueA > valueB ? 'A' : valueB > valueA ? 'B' : 'tie';

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {icon}
          <span>{label}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Location A bar */}
        <div className="flex-1">
          <div className="flex items-center justify-end gap-2 mb-1">
            <span className={`text-sm font-bold ${winner === 'A' ? 'text-gray-900' : 'text-gray-500'}`}>
              {valueA}
            </span>
            {winner === 'A' && <Trophy size={12} className="text-yellow-500" />}
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex justify-end">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(valueA / maxVal) * 100}%`,
                backgroundColor: colorA,
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-300" />

        {/* Location B bar */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {winner === 'B' && <Trophy size={12} className="text-yellow-500" />}
            <span className={`text-sm font-bold ${winner === 'B' ? 'text-gray-900' : 'text-gray-500'}`}>
              {valueB}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(valueB / maxVal) * 100}%`,
                backgroundColor: colorB,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LocationComparison({ locations, onClose }: LocationComparisonProps) {
  const [locA, locB] = locations;
  const catA = CATEGORIES.find(c => c.id === locA.category);
  const catB = CATEGORIES.find(c => c.id === locB.category);

  const overallWinner = locA.score.overall > locB.score.overall ? 'A'
    : locB.score.overall > locA.score.overall ? 'B' : 'tie';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-gray-900">Location Comparison</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Location headers */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex gap-3">
            {/* Location A */}
            <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: getScoreColor(locA.score.overall) }}
                >
                  {locA.score.overall}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-500">{catA?.name}</span>
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{locA.address}</h3>
                </div>
              </div>
            </div>

            <div className="flex items-center text-gray-400 font-bold">VS</div>

            {/* Location B */}
            <div className="flex-1 bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: getScoreColor(locB.score.overall) }}
                >
                  {locB.score.overall}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-500">{catB?.name}</span>
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{locB.address}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Score comparisons */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Score Breakdown</h3>

          <ComparisonBar
            label="Overall Score"
            icon={<Trophy size={16} className="text-yellow-500" />}
            valueA={locA.score.overall}
            valueB={locB.score.overall}
          />
          <ComparisonBar
            label="Foot Traffic"
            icon={<TrendingUp size={16} className="text-blue-500" />}
            valueA={locA.score.footTraffic}
            valueB={locB.score.footTraffic}
          />
          <ComparisonBar
            label="Demographics"
            icon={<Users size={16} className="text-green-500" />}
            valueA={locA.score.demographics}
            valueB={locB.score.demographics}
          />
          <ComparisonBar
            label="Competition"
            icon={<Store size={16} className="text-purple-500" />}
            valueA={locA.score.competition}
            valueB={locB.score.competition}
          />
          <ComparisonBar
            label="Building Type"
            icon={<Building size={16} className="text-orange-500" />}
            valueA={locA.score.buildingType}
            valueB={locB.score.buildingType}
          />
        </div>

        {/* Key metrics comparison */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Key Metrics</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'Median Income',
                valA: `$${Math.round(locA.demographics.medianIncome).toLocaleString()}`,
                valB: `$${Math.round(locB.demographics.medianIncome).toLocaleString()}`,
              },
              {
                label: 'Daily Traffic Est.',
                valA: locA.footTraffic.dailyEstimate.toLocaleString(),
                valB: locB.footTraffic.dailyEstimate.toLocaleString(),
              },
              {
                label: 'Pop. Density',
                valA: `${(locA.demographics.populationDensity ?? 0).toLocaleString()}/sq mi`,
                valB: `${(locB.demographics.populationDensity ?? 0).toLocaleString()}/sq mi`,
              },
              {
                label: 'Competitors in Radius',
                valA: String(locA.competition.placeCountInRadius ?? locA.competition.count),
                valB: String(locB.competition.placeCountInRadius ?? locB.competition.count),
              },
            ].map((metric) => (
              <div key={metric.label} className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">{metric.label}</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">{metric.valA}</span>
                  <span className="text-xs text-gray-400">vs</span>
                  <span className="text-sm font-semibold text-gray-800">{metric.valB}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Warnings comparison */}
        {((locA.score.negativeSignals?.length ?? 0) > 0 || (locB.score.negativeSignals?.length ?? 0) > 0) && (
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Warnings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                {(locA.score.negativeSignals?.length ?? 0) > 0 ? (
                  <ul className="space-y-1">
                    {locA.score.negativeSignals!.map((s, i) => (
                      <li key={i} className="text-xs text-red-700 flex items-start gap-1">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-green-600">No warnings</p>
                )}
              </div>
              <div>
                {(locB.score.negativeSignals?.length ?? 0) > 0 ? (
                  <ul className="space-y-1">
                    {locB.score.negativeSignals!.map((s, i) => (
                      <li key={i} className="text-xs text-red-700 flex items-start gap-1">
                        <span className="text-red-400 mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-green-600">No warnings</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recommendation */}
        <div className="px-6 py-5">
          <div className={`rounded-lg p-4 ${
            overallWinner === 'A' ? 'bg-blue-50 border border-blue-200'
            : overallWinner === 'B' ? 'bg-blue-50 border border-blue-200'
            : 'bg-gray-50 border border-gray-200'
          }`}>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">
              {overallWinner === 'tie'
                ? 'Even Match'
                : `Recommendation: ${overallWinner === 'A' ? locA.address : locB.address}`
              }
            </h3>
            <p className="text-sm text-gray-600">
              {overallWinner === 'tie'
                ? 'Both locations scored equally. Review the individual metrics and warnings to make your decision.'
                : `${overallWinner === 'A' ? 'Location A' : 'Location B'} scores ${Math.abs(locA.score.overall - locB.score.overall)} points higher overall. ${
                    (overallWinner === 'A' ? locA : locB).score.negativeSignals?.length === 0
                      ? 'No warnings detected — stronger candidate.'
                      : 'Review warnings before committing.'
                  }`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
