"use client";

import { useState, useMemo } from "react";
import { generateFinancialModel, FinancialAssumptions } from "@/lib/financialEngine";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const DEFAULT_ASSUMPTIONS: FinancialAssumptions = {
  initialCapital: 150000,
  customersMonth1: 50,
  arpa: 499,
  monthlyGrowthRate: 0.15,
  monthlyChurnRate: 0.05,
  fixedCostsMonthly: 45000,
  variableCostPerCustomer: 50,
  cac: 1200
};

export default function ClientFinancials() {
  const [assumptions, setAssumptions] = useState<FinancialAssumptions>(DEFAULT_ASSUMPTIONS);

  // Generate model data whenever assumptions change
  const model = useMemo(() => generateFinancialModel(assumptions, 36), [assumptions]);

  const handleChange = (key: keyof FinancialAssumptions, value: number) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="flex-1 flex gap-6 overflow-hidden">
      
      {/* LEFT: Assumptions Panel */}
      <div className="w-80 flex-shrink-0 bg-[#0E1320] border border-slate-800/60 rounded-2xl p-5 overflow-y-auto">
        <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span>
          Assumptions
        </h2>

        <div className="space-y-6">
          <SliderInput 
            label="Startkapital" 
            value={assumptions.initialCapital} 
            min={0} max={2000000} step={10000} 
            onChange={(v) => handleChange("initialCapital", v)} 
            format={formatCurrency}
          />
          <SliderInput 
            label="Kunder (Måned 1)" 
            value={assumptions.customersMonth1} 
            min={1} max={1000} step={1} 
            onChange={(v) => handleChange("customersMonth1", v)} 
          />
          <SliderInput 
            label="ARPA (Mdl. Pris)" 
            value={assumptions.arpa} 
            min={10} max={10000} step={10} 
            onChange={(v) => handleChange("arpa", v)} 
            format={formatCurrency}
          />
          <SliderInput 
            label="Mdl. Vækstrate (%)" 
            value={assumptions.monthlyGrowthRate * 100} 
            min={0} max={100} step={1} 
            onChange={(v) => handleChange("monthlyGrowthRate", v / 100)} 
            format={(v) => `${v}%`}
          />
          <SliderInput 
            label="Mdl. Churn (%)" 
            value={assumptions.monthlyChurnRate * 100} 
            min={0} max={30} step={0.5} 
            onChange={(v) => handleChange("monthlyChurnRate", v / 100)} 
            format={(v) => `${v}%`}
          />
          <SliderInput 
            label="Faste Omk. pr. md." 
            value={assumptions.fixedCostsMonthly} 
            min={0} max={500000} step={5000} 
            onChange={(v) => handleChange("fixedCostsMonthly", v)} 
            format={formatCurrency}
          />
          <SliderInput 
            label="Var. Omk. pr. kunde" 
            value={assumptions.variableCostPerCustomer} 
            min={0} max={1000} step={5} 
            onChange={(v) => handleChange("variableCostPerCustomer", v)} 
            format={formatCurrency}
          />
          <SliderInput 
            label="CAC (Customer Acq. Cost)" 
            value={assumptions.cac} 
            min={0} max={10000} step={50} 
            onChange={(v) => handleChange("cac", v)} 
            format={formatCurrency}
          />
        </div>
      </div>

      {/* RIGHT: Output Panel */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
        
        {/* Top Metrics Row */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard title="LTV (Life Time Value)" value={formatCurrency(model.summary.ltv)} highlight />
          <MetricCard title="LTV : CAC Ratio" value={`${model.summary.ltvCacRatio}x`} />
          <MetricCard 
            title="Break-even Måned" 
            value={model.summary.breakEvenMonth ? `Måned ${model.summary.breakEvenMonth}` : "Aldrig"} 
            alert={!model.summary.breakEvenMonth}
          />
          <MetricCard 
            title="Runway" 
            value={model.summary.runwayMonths ? `${model.summary.runwayMonths} Mdr` : "> 36 Mdr"} 
            alert={model.summary.runwayMonths !== null}
          />
          <MetricCard title="Omsætning År 1" value={formatCurrency(model.summary.totalRevenueY1)} />
          <MetricCard title="Omsætning År 2" value={formatCurrency(model.summary.totalRevenueY2)} />
          <MetricCard title="Omsætning År 3" value={formatCurrency(model.summary.totalRevenueY3)} />
          <MetricCard title="Kunder Måned 36" value={model.months[35].totalCustomers.toString()} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6">
          
          {/* Cash Balance Chart */}
          <div className="bg-[#0E1320] border border-slate-800/60 rounded-2xl p-5 col-span-2 h-[300px]">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Cash Balance over 36 mdr</h3>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={model.months}>
                <defs>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" stroke="#475569" fontSize={12} tickLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px' }}
                  itemStyle={{ color: '#F8FAFC' }}
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Måned ${label}`}
                />
                <Area type="monotone" dataKey="cashBalance" stroke="#10B981" strokeWidth={3} fill="url(#colorCash)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue vs Costs */}
          <div className="bg-[#0E1320] border border-slate-800/60 rounded-2xl p-5 h-[300px]">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Omsætning vs Omkostninger</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={model.months}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" stroke="#475569" fontSize={12} tickLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                <Bar dataKey="revenue" name="Omsætning" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalCosts" name="Omkostninger" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Customer Growth */}
          <div className="bg-[#0E1320] border border-slate-800/60 rounded-2xl p-5 h-[300px]">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Kundevækst</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={model.months}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="month" stroke="#475569" fontSize={12} tickLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#1E293B', borderRadius: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                <Line type="monotone" dataKey="totalCustomers" name="Totale Kunder" stroke="#F59E0B" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="newCustomers" name="Nye Kunder" stroke="#3B82F6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
    </div>
  );
}

// Helper Components

function SliderInput({ label, value, min, max, step, onChange, format }: any) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-end">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
        <span className="text-sm font-bold text-white bg-slate-800/50 px-2 py-1 rounded-md">
          {format ? format(value) : value}
        </span>
      </div>
      <input 
        type="range" 
        min={min} max={max} step={step} 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#F59E0B] h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}

function MetricCard({ title, value, highlight = false, alert = false }: any) {
  return (
    <div className={`p-4 rounded-xl border ${alert ? 'bg-red-950/20 border-red-900/50' : highlight ? 'bg-[#F59E0B]/10 border-[#F59E0B]/30' : 'bg-[#0E1320] border-slate-800/60'}`}>
      <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${alert ? 'text-red-400' : highlight ? 'text-[#F59E0B]' : 'text-slate-400'}`}>
        {title}
      </h4>
      <p className={`text-xl font-black ${alert ? 'text-red-300' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
