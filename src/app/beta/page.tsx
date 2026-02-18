'use client';

import { useState } from 'react';
import { MapPin, ArrowRight, CheckCircle, Sparkles, TrendingUp, Shield } from 'lucide-react';
import Link from 'next/link';

export default function BetaPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);

    try {
      // Formspree free tier — 50 submissions/month, no backend required.
      // Create your form at https://formspree.io and replace the ID below.
      const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID || 'xwpkvvqn';
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim(), _subject: 'VendRadar Beta Signup' }),
      });

      if (!res.ok) throw new Error('Formspree error');
      setSubmitted(true);
    } catch {
      // Fallback: store locally so we don't lose the lead
      try {
        const existing = JSON.parse(localStorage.getItem('vendradar_beta_signups') || '[]');
        existing.push({ email: email.trim(), timestamp: new Date().toISOString() });
        localStorage.setItem('vendradar_beta_signups', JSON.stringify(existing));
      } catch { /* noop */ }
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">VendRadar</span>
            </Link>
            <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full font-medium">
              Beta • Free Access
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Free Beta — No Credit Card Required
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Stop Guessing Where to Place<br />
            <span className="text-blue-600">Vending Machines</span>
          </h1>

          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            VendRadar uses real US Census Bureau data to score locations across 8 vending categories.
            Get demographics, maps, and exportable PDF reports — instantly, for any US city.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700">
              <Shield className="w-4 h-4 text-green-500" />
              Real Census Data
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              8 Vending Categories
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-purple-500" />
              Google Maps Integration
            </div>
          </div>

          {/* CTA Section */}
          {!submitted ? (
            <div className="max-w-lg mx-auto">
              {/* Primary: Go try it now */}
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors mb-6 w-full justify-center"
              >
                Try VendRadar Free
                <ArrowRight className="w-5 h-5" />
              </Link>

              <p className="text-gray-500 text-sm mb-8">No signup required — search any US city right now.</p>

              {/* Secondary: Email for updates */}
              <div className="border-t border-gray-200 pt-8">
                <p className="text-sm text-gray-600 mb-4">
                  Want updates when we add foot traffic data + saved locations?
                </p>
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {isSubmitting ? 'Sending...' : 'Notify Me'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="max-w-lg mx-auto bg-white border border-green-200 rounded-xl p-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">You&apos;re on the list!</h3>
              <p className="text-gray-600 mb-6">
                We&apos;ll email you when we launch foot traffic data, saved locations, and more.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Try VendRadar Now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* What's in the beta */}
      <section className="py-16 px-4 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">What&apos;s in the Beta</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider text-green-600">Available Now</h3>
              {[
                'Real Census Bureau demographics (income, age, population, employment)',
                '8 vending categories with custom scoring weights',
                'Google Maps with precise geocoding',
                'Multi-category search — compare all categories at once',
                'PDF export for pitching property managers',
                'Google Places autocomplete search',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-green-500 mt-0.5 font-bold">✓</span>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider text-blue-600">Coming Soon</h3>
              {[
                'Real foot traffic data (SafeGraph / Placer.ai integration)',
                'Competition radius mapping',
                'Save favorite locations',
                'Route optimization for service runs',
                'CSV export + email reports',
                'ROI projections per location',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-blue-400 mt-0.5 font-bold">→</span>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">VendRadar</span>
          </div>
          <p className="text-sm text-gray-500">© 2026 VendRadar. Built for vending operators.</p>
        </div>
      </footer>
    </main>
  );
}
