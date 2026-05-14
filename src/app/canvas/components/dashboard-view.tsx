"use client";

import React, { useState, useEffect } from 'react';
import { DashboardData, FinancialData } from '@/types/legacy';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, Activity, DollarSign, RefreshCw, ShieldCheck, Zap, Lock, Info, SlidersHorizontal } from 'lucide-react';

interface DashboardViewProps {
  data: DashboardData | null;
}

export function DashboardView({ data }: DashboardViewProps) {
  const [cacMultiplier, setCacMultiplier] = useState(1);
  const [revenueMultiplier, setRevenueMultiplier] = useState(1);
  const [simulatedFinancials, setSimulatedFinancials] = useState<FinancialData[]>([]);

  useEffect(() => {
    if (data?.financials) {
      const simulated = data.financials.map((item) => {
        const simulatedRevenue = item.revenue * revenueMultiplier;
        const simulatedExpenses = item.expenses * cacMultiplier;
        const simulatedCashflow = simulatedRevenue - simulatedExpenses;
        
        return {
          ...item,
          revenue: simulatedRevenue,
          expenses: simulatedExpenses,
          cashflow: simulatedCashflow,
        };
      });

      let currentCash = simulated[0].cumulativeCash;
      const finalSimulated = simulated.map((item, idx) => {
        if (idx === 0) return item;
        currentCash += item.cashflow;
        return { ...item, cumulativeCash: currentCash };
      });

      setSimulatedFinancials(finalSimulated);
    }
  }, [data, cacMultiplier, revenueMultiplier]);

  if (!data) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-[#0A0F1E] flex-1">
        <div className="w-20 h-20 bg-slate-900 rounded-[32px] flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
          <Activity className="w-10 h-10 text-amber-500 opacity-20" />
        </div>
        <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Master Arkitektur</h3>
        <p className="mb-10 max-w-md text-slate-400 leading-relaxed">
          Når vi har talt om din vision og du har bedt Drogon om at GEMME projektet, vil jeg beregne dine KPI'er, vurdere dit IP-potentiale og visualisere din vækstrejse her.
        </p>
      </div>
    );
  }

  const gritLevels = [
    { name: 'Vision', desc: 'Idé & Fundament' },
    { name: 'Marked', desc: 'Validering' },
    { name: 'Produkt', desc: 'Burden of Proof' },
    { name: 'Model', desc: 'Investor-træning' },
    { name: 'Ready', desc: 'Launch Ready' }
  ];

  return (
    <div className="h-full overflow-y-auto p-10 bg-[#0A0F1E] text-slate-200">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">Strategisk Arkitektur</h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold mt-2">Realtids-analyse med "What-if" simulering</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
        {/* Grit Progress */}
        <div className="lg:col-span-3 bg-slate-900/40 p-10 rounded-[40px] border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.02]"><Activity size={120} /></div>
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div className="flex items-center gap-5">
               <div className="p-4 rounded-[22px] bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"><Zap size={24} /></div>
               <div>
                 <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">The Progress Loop</h3>
                 <p className="text-[10px] text-amber-500 uppercase font-black tracking-widest mt-1">Status: {gritLevels[data.gritLevel - 1]?.name}</p>
               </div>
            </div>
            <div className="px-5 py-2 bg-white/5 rounded-full border border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stage {data.gritLevel} / 5</div>
          </div>
          
          <div className="relative flex justify-between items-start gap-4 h-2.5 bg-slate-800/40 rounded-full mb-12">
             <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000 bg-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.5)]" style={{ width: `${(data.gritLevel / 5) * 100}%` }} />
             {gritLevels.map((lvl, i) => {
               const active = i + 1 <= data.gritLevel;
               return (
                 <div key={i} className="relative flex flex-col items-center flex-1 -mt-4">
                   <div className={`w-10 h-10 rounded-2xl border-[4px] transition-all duration-700 flex items-center justify-center text-[11px] font-black z-10 ${active ? 'bg-amber-500 border-[#0a0f1a] text-slate-950 shadow-xl' : 'bg-slate-900 border-[#0a0f1a] text-slate-600'}`}>
                     {i + 1}
                   </div>
                   <div className="mt-5 text-center px-1">
                     <p className={`text-[10px] font-black uppercase tracking-tighter mb-1 ${active ? 'text-white' : 'text-slate-600'}`}>{lvl.name}</p>
                   </div>
                 </div>
               );
             })}
          </div>
        </div>

        {/* Protection Score */}
        <div className="bg-gradient-to-br from-amber-500/20 to-slate-900/40 p-10 rounded-[40px] border border-amber-500/20 flex flex-col justify-between shadow-2xl group">
           <div>
             <div className="flex justify-between items-start mb-6">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500">Protection Score</span>
                <Lock size={20} className="text-amber-500 group-hover:scale-110 transition-transform" />
             </div>
             <div className="text-5xl font-black text-white tracking-tighter mb-3">{data.kpi.protectionScore || 0}%</div>
             <div className="h-2 bg-slate-800/50 rounded-full overflow-hidden mb-6">
                <div className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]" style={{ width: `${data.kpi.protectionScore || 0}%` }} />
             </div>
           </div>
           <div>
             <p className="text-[10px] text-slate-300 leading-relaxed font-bold uppercase tracking-tight mb-3 flex items-center gap-2"><Info size={12} className="text-amber-500" /> IP Vurdering (PVS)</p>
             <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">{(data.kpi.protectionScore || 0) > 70 ? 'Stærkt fundament for patentering.' : 'Fokusér på Brand og First Mover advantage.'}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-slate-900/40 p-10 rounded-[40px] border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black flex items-center gap-3 text-white uppercase tracking-[0.2em]">
              <DollarSign size={20} className="text-amber-500" /> Finansiel Vækstkurve (Simuleret)
            </h3>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">12 Måneders Forecast</div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={simulatedFinancials.length > 0 ? simulatedFinancials : data.financials}>
                <defs>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#1e293b" vertical={false} opacity={0.2} />
                <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} dy={15} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}
                  itemStyle={{ fontSize: '11px', fontWeight: '900', color: '#f59e0b' }}
                />
                <Area type="monotone" dataKey="cumulativeCash" stroke="#f59e0b" strokeWidth={5} fillOpacity={1} fill="url(#colorCash)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sandbox Sliders */}
        <div className="bg-slate-900/40 p-10 rounded-[40px] border border-amber-500/20 shadow-2xl space-y-8">
           <div className="flex items-center gap-3 mb-4">
             <SlidersHorizontal size={20} className="text-amber-500" />
             <h3 className="text-sm font-black text-white uppercase tracking-widest">The Sandbox</h3>
           </div>
           
           <div className="space-y-6">
             <div className="space-y-3">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                 <span className="text-slate-400">Revenue Vækst</span>
                 <span className="text-amber-500">{(revenueMultiplier * 100 - 100).toFixed(0)}%</span>
               </div>
               <input 
                 type="range" min="0.5" max="3" step="0.1" value={revenueMultiplier} 
                 onChange={(e) => setRevenueMultiplier(parseFloat(e.target.value))}
                 className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-amber-500"
               />
             </div>

             <div className="space-y-3">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                 <span className="text-slate-400">Udgifter / CAC</span>
                 <span className="text-red-500">{(cacMultiplier * 100 - 100).toFixed(0)}%</span>
               </div>
               <input 
                 type="range" min="0.5" max="3" step="0.1" value={cacMultiplier} 
                 onChange={(e) => setCacMultiplier(parseFloat(e.target.value))}
                 className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-red-500"
               />
             </div>

             <div className="pt-6 border-t border-white/5">
                <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 block">Ny Estimeret Runway</span>
                  <span className="text-2xl font-black text-white">
                    {Math.max(1, Math.round(data.kpi.runway * (1 / (cacMultiplier / revenueMultiplier))) )} mdr
                  </span>
                </div>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Markedsrisiko" value={`${data.kpi.riskScore || 0}%`} icon={<ShieldCheck className="text-amber-500" />} sub="Sandsynlighed for modstand" />
        <KpiCard title="Kundeanskaffelse" value={`$${Math.round(data.kpi.cac * cacMultiplier).toLocaleString()}`} icon={<Users className="text-amber-500" />} sub="Simuleret CAC" />
        <KpiCard title="Livstidsværdi" value={`$${Math.round(data.kpi.ltv * revenueMultiplier).toLocaleString()}`} icon={<TrendingUp className="text-amber-500" />} sub="Simuleret LTV" />
        <KpiCard title="Cash Burn" value={`$${Math.round(data.kpi.burnRate * cacMultiplier).toLocaleString()}`} icon={<Activity className="text-amber-500" />} sub="Simuleret Burn Rate" />
      </div>
    </div>
  );
}

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; sub: string }> = ({
  title,
  value,
  icon,
  sub,
}) => (
  <div className="bg-slate-900/40 p-8 rounded-[40px] border border-white/5 hover:border-amber-500/30 transition-all group shadow-xl">
    <div className="flex justify-between items-start mb-6">
      <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{title}</span>
      <div className="p-3 bg-slate-950 rounded-2xl border border-white/5 group-hover:scale-110 group-hover:text-amber-500 transition-all">{icon}</div>
    </div>
    <div>
      <div className="text-3xl font-black text-white tabular-nums tracking-tighter mb-2">{value}</div>
      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none">{sub}</div>
    </div>
  </div>
);
