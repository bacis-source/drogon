import { CheckSquare, ListTodo, CircleDashed, CheckCircle2 } from "lucide-react";

export default async function ExecutionPage() {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0A0F1E] nice-scrollbar">
      {/* Header */}
      <header className="p-8 pb-4 border-b border-slate-800/60 bg-[#0B0F19]/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2 opacity-80">
          <CheckSquare className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">EXECUTION & ROADMAP</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase">EKSEKVERINGSPLAN</h1>
      </header>

      {/* Content */}
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        
        <div className="bg-[#111626] border border-emerald-900/40 rounded-2xl p-8 shadow-[0_0_30px_rgba(16,185,129,0.05)] text-center">
          <ListTodo className="w-12 h-12 text-emerald-500/50 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-200 uppercase tracking-widest mb-2">Roadmap Modulet er under konstruktion</h2>
          <p className="text-slate-400 max-w-lg mx-auto">
            Denne sektion vil snart integrere direkte med Drogon's 'Memory Cortex' for at generere et automatisk, trinvist Kanban-board baseret på dit projekts arkitektur og forretningsmodel.
          </p>
        </div>

        {/* Kanban Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60 pointer-events-none">
          {/* Backlog */}
          <div className="bg-[#161C2C] rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-4 px-2">
               <CircleDashed className="w-4 h-4 text-slate-500" />
               <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">BACKLOG</span>
            </div>
            <div className="space-y-3">
              <div className="bg-[#111626] p-4 rounded-xl border border-slate-800">
                <div className="w-3/4 h-3 bg-slate-800 rounded-full mb-2"></div>
                <div className="w-1/2 h-2 bg-slate-800/50 rounded-full"></div>
              </div>
              <div className="bg-[#111626] p-4 rounded-xl border border-slate-800">
                <div className="w-full h-3 bg-slate-800 rounded-full mb-2"></div>
                <div className="w-2/3 h-2 bg-slate-800/50 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-[#161C2C] rounded-2xl p-4 border border-emerald-900/30">
            <div className="flex items-center gap-2 mb-4 px-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-xs font-bold tracking-widest text-emerald-500 uppercase">IN PROGRESS</span>
            </div>
            <div className="space-y-3">
              <div className="bg-[#111626] p-4 rounded-xl border border-emerald-900/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                <div className="w-4/5 h-3 bg-slate-700 rounded-full mb-2"></div>
                <div className="w-1/3 h-2 bg-emerald-900/80 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Done */}
          <div className="bg-[#161C2C] rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-4 px-2">
               <CheckCircle2 className="w-4 h-4 text-slate-600" />
               <span className="text-xs font-bold tracking-widest text-slate-600 uppercase">DONE</span>
            </div>
            <div className="space-y-3">
              <div className="bg-[#111626] p-4 rounded-xl border border-slate-800 opacity-50">
                <div className="w-full h-3 bg-slate-800 rounded-full mb-2 line-through"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
