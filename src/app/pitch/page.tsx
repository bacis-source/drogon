import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Trophy, Target, ShieldAlert, Zap, TrendingUp, Flame, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function PitchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0B0F19] text-center h-full">
        <div className="w-24 h-24 rounded-full bg-red-900/10 border border-red-900/30 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden">
           <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
           <Trophy className="w-10 h-10 text-red-500 z-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-300 mb-3 tracking-widest uppercase">Intet Projekt Klar til Pitch</h2>
        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
          Dragons Den kræver benhårde data. Få pudset din forretningsmodel og IP strategi af med Drogon, og skriv derefter:
          <br/><br/>
          <span className="bg-[#1A1525] text-red-500 px-4 py-2 rounded-lg border border-red-900/50 font-mono text-sm shadow-[0_0_15px_rgba(239,68,68,0.1)]">GEM [Projekt Navn]</span>
        </p>
        <Link href="/" className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-bold rounded-full uppercase tracking-wider text-sm hover:bg-red-700 transition-colors">
          Gør Mig Klar <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#060913] nice-scrollbar">
      {/* High Stakes Header */}
      <header className="p-10 pb-6 border-b border-red-900/30 bg-[#0A0710]/80 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-2 opacity-90">
              <Trophy className="w-5 h-5 text-red-500" />
              <span className="text-xs font-bold tracking-widest text-red-500 uppercase">INVESTOR DECK / DRAGONS DEN</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">{project.name}</h1>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-red-900/50 bg-red-950/30">
             <Flame className="w-4 h-4 text-red-500" />
             <span className="text-[10px] font-bold tracking-widest text-red-500 uppercase">PITCH READY</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-10 max-w-6xl mx-auto space-y-8">
        
        {/* The Hook (Summary) */}
        <div className="bg-[#0D0914] border-l-4 border-l-red-600 border-y border-r border-y-slate-800/80 border-r-slate-800/80 rounded-r-2xl p-8 relative group">
          <div className="flex items-center gap-3 mb-4 opacity-70">
             <Target className="w-5 h-5 text-slate-400" />
             <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Elevator Pitchen (The Hook)</h2>
          </div>
          <p className="text-white font-medium leading-relaxed text-2xl tracking-wide">"{project.summary}"</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Monetization / Business Model */}
          <div className="bg-gradient-to-br from-[#120B1A] to-[#0A0710] border border-red-900/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/5 rounded-full blur-[40px] pointer-events-none"></div>
            <div className="flex items-center gap-4 mb-6 border-b border-red-900/20 pb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                 <TrendingUp className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-widest">Business Model</h2>
                <span className="text-[10px] font-bold text-red-500 tracking-widest uppercase">Hvordan Tjener Vi Penge?</span>
              </div>
            </div>
            <div className="text-slate-300 text-base leading-loose whitespace-pre-wrap">
              {project.business_model === 'Ikke relevant for denne type samtale.' ? 
                <span className="italic opacity-50 text-slate-500">Du har endnu ikke defineret en skarp forretningsmodel overfor Drogon.</span> : 
                project.business_model}
            </div>
          </div>

          {/* The Moat (IP Strategy) */}
          <div className="bg-gradient-to-br from-[#0F121C] to-[#0A0C14] border border-amber-900/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none"></div>
            <div className="flex items-center gap-4 mb-6 border-b border-amber-900/20 pb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                 <ShieldAlert className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-widest">Unfair Advantage</h2>
                <span className="text-[10px] font-bold text-amber-500 tracking-widest uppercase">The Moat / IP Strategi</span>
              </div>
            </div>
            <div className="text-slate-300 text-base leading-loose whitespace-pre-wrap">
              {project.ip_strategy === 'Ikke relevant for denne type samtale.' ? 
                <span className="italic opacity-50 text-slate-500">Ingen forsvarsstrategi opbygget. Investorer vil rive idéen fra hinanden.</span> : 
                project.ip_strategy}
            </div>
          </div>

        </div>

        {/* Call to action */}
        <div className="flex justify-center pt-8">
           <button className="bg-red-600 hover:bg-red-700 text-white font-black text-lg uppercase tracking-widest py-5 px-12 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] transition-all flex items-center gap-3 transform hover:scale-105">
             <Zap className="w-6 h-6" />
             Eksportér Til PDF
           </button>
        </div>

      </div>
    </div>
  );
}
