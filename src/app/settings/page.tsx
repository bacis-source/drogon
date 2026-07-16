"use client"

import { useState } from 'react';
import { ShieldCheck, Key, Zap, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleActivate = async () => {
    if (!licenseKey) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Fejl ved aktivering');
      }

      setSuccess(`Fantastisk! Din Drogon ${data.tier} licens er nu aktiv.`);
      setLicenseKey('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8 flex flex-col items-center pt-24">
      <div className="max-w-xl w-full">
        
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-black mb-4 flex items-center justify-center gap-3">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
            Drogon Licens
          </h1>
          <p className="text-neutral-400">
            For at udnytte Drogon's fulde potentiale (GRIT Level 4 & 5), skal du have en aktiv licens fra Brainstore.dk.
          </p>
        </div>

        <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-8 shadow-2xl relative overflow-hidden">
          {/* Vibe Check: Subtle gradient background */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />
          
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Key className="w-5 h-5 text-neutral-400" />
            Aktiver din nøgle
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">Licensnøgle fra Brainstore</label>
              <input 
                type="text" 
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="f.eks. DROGON-ENT-8F92A"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono tracking-wider placeholder:text-neutral-600"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {success}
              </div>
            )}

            <button
              onClick={handleActivate}
              disabled={loading || !licenseKey}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-4"
            >
              {loading ? 'Validerer...' : 'Aktiver Licens'}
              <Zap className="w-4 h-4" />
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-neutral-700/50 text-center text-sm text-neutral-500">
            Har du ikke en nøgle? <a href="https://brainstore.dk" target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Køb adgang her</a>.
          </div>
        </div>

      </div>
    </div>
  );
}
