'use client';

import { useState } from 'react';
import { Category, LocationData } from '@/lib/types';
import { MessageSquare, DollarSign, Calendar, Package, Wrench, RefreshCw, Send, CheckCircle, X } from 'lucide-react';

interface FeedbackFormProps {
  /** Pre-fill from a scored location (optional) */
  location?: LocationData;
  onClose?: () => void;
  onSubmitted?: () => void;
}

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'office', label: 'Office Building' },
  { id: 'gym', label: 'Gym / Fitness' },
  { id: 'hospital', label: 'Hospital / Medical' },
  { id: 'school', label: 'School / University' },
  { id: 'manufacturing', label: 'Manufacturing / Warehouse' },
  { id: 'apartment', label: 'Apartment Complex' },
  { id: 'hotel', label: 'Hotel / Lodging' },
  { id: 'transit', label: 'Transit Hub' },
];

export default function FeedbackForm({ location, onClose, onSubmitted }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state — pre-fill from location if available
  const [address, setAddress] = useState(location?.address || '');
  const [category, setCategory] = useState<Category>(location?.category || 'office');
  const [weeklyRevenue, setWeeklyRevenue] = useState('');
  const [monthsInOperation, setMonthsInOperation] = useState('');
  const [machineCondition, setMachineCondition] = useState<string>('');
  const [restockFrequency, setRestockFrequency] = useState<string>('');
  const [productType, setProductType] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        lat: location?.lat || 0,
        lng: location?.lng || 0,
        address,
        category,
        weeklyRevenue: parseFloat(weeklyRevenue),
        monthsInOperation: parseInt(monthsInOperation),
        vendradarScore: location?.score.overall,
        ...(machineCondition && { machineCondition }),
        ...(restockFrequency && { restockFrequency }),
        ...(productType && { productType }),
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details?.join(', ') || 'Submission failed');
      }

      setIsSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Success state ──────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-800 mb-2">Thank You!</h3>
        <p className="text-sm text-gray-600 mb-4">
          Your real-world data helps improve revenue estimates for all operators.
          The more data we collect, the more accurate VendRadar becomes.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  // ─── Form ───────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} />
          <div>
            <h3 className="font-bold">Share Your Results</h3>
            <p className="text-xs text-white/80">Help calibrate revenue estimates</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Location */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Location Address</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            required
            placeholder="123 Main St, City, State"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Location Type</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as Category)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Revenue + Months — side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              <DollarSign size={12} className="inline" /> Weekly Revenue
            </label>
            <input
              type="number"
              value={weeklyRevenue}
              onChange={e => setWeeklyRevenue(e.target.value)}
              required
              min="0"
              step="5"
              placeholder="$250"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              <Calendar size={12} className="inline" /> Months Active
            </label>
            <input
              type="number"
              value={monthsInOperation}
              onChange={e => setMonthsInOperation(e.target.value)}
              required
              min="1"
              placeholder="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Optional fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              <Wrench size={12} className="inline" /> Machine Condition
            </label>
            <select
              value={machineCondition}
              onChange={e => setMachineCondition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">— Optional —</option>
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              <RefreshCw size={12} className="inline" /> Restock Frequency
            </label>
            <select
              value={restockFrequency}
              onChange={e => setRestockFrequency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">— Optional —</option>
              <option value="daily">Daily</option>
              <option value="2-3x_week">2-3x/week</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            <Package size={12} className="inline" /> Product Type (Optional)
          </label>
          <input
            type="text"
            value={productType}
            onChange={e => setProductType(e.target.value)}
            placeholder="e.g., Snacks & drinks combo"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            'Submitting...'
          ) : (
            <>
              <Send size={16} />
              Submit My Results
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center">
          All data is anonymous and used to improve estimates.
        </p>
      </form>
    </div>
  );
}
