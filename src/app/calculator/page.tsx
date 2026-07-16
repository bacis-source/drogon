'use client';

import { useState } from 'react';
import { calculateWincoverRoi } from '@/app/actions/calculate';

export default function CalculatorEmbed() {
  const [totalWindows, setTotalWindows] = useState<number>(50);
  const [avgWindowSizeM2, setAvgWindowSizeM2] = useState<number>(2.5);
  const [email, setEmail] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await calculateWincoverRoi(
        {
          totalWindows,
          avgWindowSizeM2
        },
        email,
        company
      );

      if (res.success) {
        setResult(res);
      } else {
        setError(res.error || 'Der opstod en fejl under beregningen.');
      }
    } catch {
      setError('Netværksfejl. Prøv igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white border border-gray-100 shadow-sm rounded-xl font-sans">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Wincover Værdi-beregner</h2>
        <p className="text-sm text-gray-500">Beregn hvor meget CO2 og kapital dit byggeprojekt kan spare ved at beskytte vinduerne.</p>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Antal vinduer</label>
              <input
                type="number"
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={totalWindows}
                onChange={(e) => setTotalWindows(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gns. størrelse (m2)</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={avgWindowSizeM2}
                onChange={(e) => setAvgWindowSizeM2(Number(e.target.value))}
              />
            </div>
          </div>

          <hr className="my-4" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Din E-mail</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Firma (valgfrit)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition-colors disabled:bg-blue-300"
          >
            {loading ? 'Beregner værdi...' : 'Beregn dit tabte overskud'}
          </button>
        </form>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-2">Dit Resultat</h3>
            <p className="text-gray-800 italic leading-relaxed">
              "{result.salesText}"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-md border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Sparet CO2</p>
              <p className="text-3xl font-bold text-green-600">{result.results.co2.netSavingsKgCo2.toLocaleString()} <span className="text-sm font-normal text-gray-500">kg</span></p>
            </div>
            <div className="p-4 bg-gray-50 rounded-md border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Bundlinje Effekt</p>
              <p className="text-3xl font-bold text-blue-600">{result.results.financial.netSavingsDkk.toLocaleString()} <span className="text-sm font-normal text-gray-500">kr</span></p>
            </div>
          </div>

          <div className="p-4 bg-white border border-gray-200 rounded-md shadow-sm">
             <p className="text-sm text-gray-500">Forventede reddede vinduer: <span className="font-semibold text-gray-900">{result.results.metrics.windowsSavedFromDamage}</span></p>
             <p className="text-sm text-gray-500 mt-1">ROI på investering: <span className="font-semibold text-gray-900">{result.results.financial.roiPercentage}%</span></p>
          </div>

          <button
            onClick={() => setResult(null)}
            className="w-full border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
          >
            Lav ny beregning
          </button>
        </div>
      )}
    </div>
  );
}
