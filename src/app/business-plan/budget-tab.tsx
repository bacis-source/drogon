'use client';

import { useState } from 'react';
import { Plus, Trash2, DollarSign, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { updateBudget } from './actions';

type BudgetItem = { name: string; amount: number; id: string };

type BudgetData = {
  capex: BudgetItem[];
  opex: BudgetItem[];
  revenue: BudgetItem[];
};

export function BudgetTab({ project }: { project: any }) {
  const initialBudget = project.budget || {};
  
  const [budget, setBudget] = useState<BudgetData>({
    capex: Array.isArray(initialBudget.capex) ? initialBudget.capex : [],
    opex: Array.isArray(initialBudget.opex) ? initialBudget.opex : [],
    revenue: Array.isArray(initialBudget.revenue) ? initialBudget.revenue : []
  });

  const [isSaving, setIsSaving] = useState(false);

  const addItem = (category: keyof BudgetData) => {
    setBudget(prev => ({
      ...prev,
      [category]: [...prev[category], { id: crypto.randomUUID(), name: '', amount: 0 }]
    }));
  };

  const removeItem = (category: keyof BudgetData, id: string) => {
    setBudget(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== id)
    }));
  };

  const updateItem = (category: keyof BudgetData, id: string, field: 'name' | 'amount', value: string | number) => {
    setBudget(prev => ({
      ...prev,
      [category]: prev[category].map(item => 
        item.id === id ? { ...item, [field]: field === 'amount' ? Number(value) : value } : item
      )
    }));
  };

  const saveBudget = async () => {
    setIsSaving(true);
    try {
      await updateBudget(project.id, budget);
      // Optional: show a success toast
    } catch (e) {
      console.error(e);
      alert("Fejl ved gemning af budget");
    } finally {
      setIsSaving(false);
    }
  };

  const totalCapex = budget.capex.reduce((acc, curr) => acc + curr.amount, 0);
  const totalOpex = budget.opex.reduce((acc, curr) => acc + curr.amount, 0);
  const totalRevenue = budget.revenue.reduce((acc, curr) => acc + curr.amount, 0);
  
  const profitPerMonth = totalRevenue - totalOpex;
  const breakEvenMonths = profitPerMonth > 0 && totalCapex > 0 ? Math.ceil(totalCapex / profitPerMonth) : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Venstre kolonne: Indtastning */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* CAPEX */}
        <div className="bg-[#0B101D] border border-blue-900/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-blue-400" />
              CAPEX (Opstartsomkostninger)
            </h2>
            <button onClick={() => addItem('capex')} className="text-xs bg-blue-900/40 hover:bg-blue-800 text-blue-300 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors">
              <Plus className="w-3 h-3" /> Tilføj
            </button>
          </div>
          <p className="text-sm text-slate-400 mb-4">Engangsudgifter for at bygge MVP'en.</p>
          
          <div className="space-y-3">
            {budget.capex.map(item => (
              <div key={item.id} className="flex gap-3">
                <input 
                  type="text" 
                  value={item.name} 
                  onChange={(e) => updateItem('capex', item.id, 'name', e.target.value)}
                  placeholder="F.eks. Udvikling, Servere..."
                  className="flex-1 bg-[#111827] border border-blue-900/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <input 
                  type="number" 
                  value={item.amount || ''} 
                  onChange={(e) => updateItem('capex', item.id, 'amount', e.target.value)}
                  placeholder="0 DKK"
                  className="w-32 bg-[#111827] border border-blue-900/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <button onClick={() => removeItem('capex', item.id)} className="p-2 text-slate-500 hover:text-rose-400 bg-rose-500/0 hover:bg-rose-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {budget.capex.length === 0 && <div className="text-sm text-slate-500 italic">Ingen poster tilføjet.</div>}
          </div>
        </div>

        {/* OPEX */}
        <div className="bg-[#0B101D] border border-rose-900/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400" />
              OPEX (Faste månedlige udgifter)
            </h2>
            <button onClick={() => addItem('opex')} className="text-xs bg-rose-900/40 hover:bg-rose-800 text-rose-300 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors">
              <Plus className="w-3 h-3" /> Tilføj
            </button>
          </div>
          <p className="text-sm text-slate-400 mb-4">Driftsomkostninger, servere, markedsføring pr. måned.</p>
          
          <div className="space-y-3">
            {budget.opex.map(item => (
              <div key={item.id} className="flex gap-3">
                <input 
                  type="text" 
                  value={item.name} 
                  onChange={(e) => updateItem('opex', item.id, 'name', e.target.value)}
                  placeholder="F.eks. AWS, Marketing..."
                  className="flex-1 bg-[#111827] border border-rose-900/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
                <input 
                  type="number" 
                  value={item.amount || ''} 
                  onChange={(e) => updateItem('opex', item.id, 'amount', e.target.value)}
                  placeholder="0 DKK"
                  className="w-32 bg-[#111827] border border-rose-900/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                />
                <button onClick={() => removeItem('opex', item.id)} className="p-2 text-slate-500 hover:text-rose-400 bg-rose-500/0 hover:bg-rose-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {budget.opex.length === 0 && <div className="text-sm text-slate-500 italic">Ingen poster tilføjet.</div>}
          </div>
        </div>

        {/* REVENUE */}
        <div className="bg-[#0B101D] border border-emerald-900/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-emerald-400" />
              Indtjening (Estimeret MRR)
            </h2>
            <button onClick={() => addItem('revenue')} className="text-xs bg-emerald-900/40 hover:bg-emerald-800 text-emerald-300 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors">
              <Plus className="w-3 h-3" /> Tilføj
            </button>
          </div>
          <p className="text-sm text-slate-400 mb-4">Forventet månedlig indtjening (Monthly Recurring Revenue).</p>
          
          <div className="space-y-3">
            {budget.revenue.map(item => (
              <div key={item.id} className="flex gap-3">
                <input 
                  type="text" 
                  value={item.name} 
                  onChange={(e) => updateItem('revenue', item.id, 'name', e.target.value)}
                  placeholder="F.eks. Pro Subscriptions..."
                  className="flex-1 bg-[#111827] border border-emerald-900/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <input 
                  type="number" 
                  value={item.amount || ''} 
                  onChange={(e) => updateItem('revenue', item.id, 'amount', e.target.value)}
                  placeholder="0 DKK"
                  className="w-32 bg-[#111827] border border-emerald-900/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <button onClick={() => removeItem('revenue', item.id)} className="p-2 text-slate-500 hover:text-rose-400 bg-rose-500/0 hover:bg-rose-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {budget.revenue.length === 0 && <div className="text-sm text-slate-500 italic">Ingen poster tilføjet.</div>}
          </div>
        </div>

      </div>

      {/* Højre kolonne: Dashboards / Tal */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        
        <div className="bg-gradient-to-br from-[#0B101D] to-[#0A0E1A] border border-blue-900/40 rounded-2xl p-6 shadow-2xl sticky top-24">
          <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest flex items-center gap-2">
             <DollarSign className="w-5 h-5 text-blue-400" /> Totaler
          </h2>

          <div className="space-y-6">
            <div>
              <div className="text-sm text-slate-400 mb-1">Total CAPEX</div>
              <div className="text-2xl font-mono text-white">{totalCapex.toLocaleString('da-DK')} <span className="text-sm text-slate-500">DKK</span></div>
            </div>

            <div className="h-px w-full bg-blue-900/30"></div>

            <div>
              <div className="text-sm text-slate-400 mb-1">Månedlig Burn Rate (OPEX)</div>
              <div className="text-2xl font-mono text-rose-400">{totalOpex.toLocaleString('da-DK')} <span className="text-sm text-slate-500">DKK</span></div>
            </div>

            <div>
              <div className="text-sm text-slate-400 mb-1">Estimeret MRR</div>
              <div className="text-2xl font-mono text-emerald-400">{totalRevenue.toLocaleString('da-DK')} <span className="text-sm text-slate-500">DKK</span></div>
            </div>

            <div className="h-px w-full bg-blue-900/30"></div>

            <div className={`p-4 rounded-xl border ${profitPerMonth > 0 ? 'bg-emerald-950/30 border-emerald-900/50' : profitPerMonth < 0 ? 'bg-rose-950/30 border-rose-900/50' : 'bg-slate-900 border-slate-800'}`}>
              <div className="text-sm text-slate-400 mb-1">Månedligt Profit/Tab</div>
              <div className={`text-3xl font-mono font-bold ${profitPerMonth > 0 ? 'text-emerald-400' : profitPerMonth < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                {profitPerMonth > 0 ? '+' : ''}{profitPerMonth.toLocaleString('da-DK')} <span className="text-sm opacity-50">DKK</span>
              </div>
            </div>

            {totalCapex > 0 && profitPerMonth > 0 && (
              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/30">
                <div className="text-sm text-blue-300/70 mb-1">Break-even for CAPEX</div>
                <div className="text-xl font-bold text-blue-400">{breakEvenMonths} måneder</div>
              </div>
            )}
            
            {totalCapex > 0 && profitPerMonth <= 0 && (
               <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/30">
                 <div className="text-sm text-rose-300/70 mb-1">Break-even</div>
                 <div className="text-md font-bold text-rose-400">Ikke muligt før MRR overstiger OPEX.</div>
               </div>
            )}
          </div>

          <button 
            onClick={saveBudget}
            disabled={isSaving}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] flex justify-center items-center gap-2"
          >
            {isSaving ? (
              <span className="w-5 h-5 block animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              "Gem Budget"
            )}
          </button>

        </div>
      </div>
    </div>
  );
}
