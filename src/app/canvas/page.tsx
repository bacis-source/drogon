import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LayoutTemplate, Lightbulb, Rocket, ShieldAlert, Cpu, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function CanvasPage() {
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
        <div className="w-24 h-24 rounded-full bg-[#111626] border border-slate-800 flex items-center justify-center mb-6 shadow-2xl">
           <LayoutTemplate className="w-10 h-10 text-slate-700" />
        </div>
        <h2 className="text-2xl font-bold text-slate-300 mb-3 tracking-widest uppercase">Intet Aktivt Lærred</h2>
        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
          Gå tilbage til samtalen med Drogon og udform din idé. Når fundamentet er solidt, skal du skrive: 
          <br/><br/>
          <span className="bg-[#1A1525] text-amber-500 px-4 py-2 rounded-lg border border-amber-900/50 font-mono text-sm shadow-[0_0_15px_rgba(245,158,11,0.1)]">GEM [Projekt Navn]</span>
        </p>
        <Link href="/" className="flex items-center gap-2 px-6 py-3 bg-[#F59E0B] text-[#0A0F1E] font-bold rounded-full uppercase tracking-wider text-sm hover:bg-[#EAB308] transition-colors">
          Start Samtale <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0A0F1E] nice-scrollbar">
      {/* Header */}
      <header className="p-8 pb-4 border-b border-slate-800/60 bg-[#0B0F19]/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2 opacity-80">
          <LayoutTemplate className="w-4 h-4 text-[#F59E0B]" />
          <span className="text-[10px] font-bold tracking-widest text-[#F59E0B] uppercase">LEAN CANVAS OVERVIEW</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase">{project.name}</h1>
      </header>

      {/* Grid Content */}
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        
        {/* Top Full-width: Summary */}
        <div className="bg-[#111626] border border-[#F59E0B]/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(245,158,11,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#F59E0B]"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center">
               <Lightbulb className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <h2 className="text-lg font-bold text-slate-200 uppercase tracking-widest">Vision & Resume</h2>
          </div>
          <p className="text-slate-300 leading-relaxed text-lg pl-1">{project.summary}</p>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Business Model */}
          <div className="bg-[#111626] border border-slate-800/80 rounded-2xl p-6 hover:border-emerald-900/50 transition-colors flex flex-col">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-800/50 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                 <Rocket className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Forretningsmodel</h2>
            </div>
            <div className="flex-1 text-slate-400 text-sm leading-loose">
              {project.business_model === 'Ikke relevant for denne type samtale.' ? 
                <span className="italic opacity-50">Ingen model defineret.</span> : 
                project.business_model}
            </div>
          </div>

          {/* Tech Architecture */}
          <div className="bg-[#111626] border border-slate-800/80 rounded-2xl p-6 hover:border-blue-900/50 transition-colors flex flex-col">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-800/50 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                 <Cpu className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest">Teknisk Stack</h2>
            </div>
            <div className="flex-1 text-slate-400 text-sm leading-loose">
              {project.tech_spec === 'Ikke relevant for denne type samtale.' ? 
                <span className="italic opacity-50">Ingen arkitektur defineret.</span> : 
                project.tech_spec}
            </div>
          </div>

          {/* IP Strategy */}
          <div className="bg-[#111626] border border-slate-800/80 rounded-2xl p-6 hover:border-red-900/50 transition-colors flex flex-col">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-800/50 pb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                 <ShieldAlert className="w-5 h-5 text-red-500" />
              </div>
              <h2 className="text-sm font-bold text-red-500 uppercase tracking-widest">IP & Voldgrav</h2>
            </div>
            <div className="flex-1 text-slate-400 text-sm leading-loose">
              {project.ip_strategy === 'Ikke relevant for denne type samtale.' ? 
                <span className="italic opacity-50">Ingen IP-strategi fokuseret.</span> : 
                project.ip_strategy}
            </div>
          </div>

        </div>
        
        {/* Action Bar */}
        <div className="flex justify-end pt-4 opacity-70 hover:opacity-100 transition-opacity">
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/40 border border-slate-700/50">
             <Zap className="w-3.5 h-3.5 text-slate-400" />
             <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">Data Udtrukket vha. GPT-4o</span>
           </div>
        </div>

      </div>
    </div>
  );
}
