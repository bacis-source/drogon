import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Cpu, Server, Shield, Cloud, ArrowRight, LayoutTemplate } from "lucide-react";
import Link from "next/link";

export default async function ArchitecturePage() {
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
           <Cpu className="w-10 h-10 text-slate-700" />
        </div>
        <h2 className="text-2xl font-bold text-slate-300 mb-3 tracking-widest uppercase">Ingen Arkitektur Defineret</h2>
        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
          Gå tilbage til samtalen med Drogon. Når vi har fastlagt den tekniske retning, skal du skrive: 
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
          <Cpu className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">SYSTEM ARKITEKTUR</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase">{project.name}</h1>
      </header>

      {/* Content */}
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        
        {/* Top: Tech Spec */}
        <div className="bg-[#111626] border border-blue-900/40 rounded-2xl p-8 shadow-[0_0_30px_rgba(59,130,246,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
               <Cpu className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-200 uppercase tracking-widest">Teknisk Kravspecifikation</h2>
          </div>
          <p className="text-slate-300 leading-relaxed text-lg pl-1 whitespace-pre-wrap">
            {project.tech_spec === 'Ikke relevant for denne type samtale.' ? 
              <span className="italic opacity-50">Ingen teknisk specifikation er genereret endnu. Vend tilbage til Drogon for at uddybe stacken.</span> : 
              project.tech_spec}
          </p>
        </div>

        {/* Blueprint placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111626] border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-slate-700 transition-colors h-48 cursor-not-allowed">
             <Server className="w-8 h-8 text-slate-600 mb-3" />
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Infrastruktur</h3>
             <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Afventer Diagrammer</p>
          </div>
          <div className="bg-[#111626] border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-slate-700 transition-colors h-48 cursor-not-allowed">
             <Cloud className="w-8 h-8 text-slate-600 mb-3" />
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Cloud Deployment</h3>
             <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Afventer Miljø Opsætning</p>
          </div>
          <div className="bg-[#111626] border border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-slate-700 transition-colors h-48 cursor-not-allowed">
             <Shield className="w-8 h-8 text-slate-600 mb-3" />
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Sikkerheds-Protocol</h3>
             <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Afventer Audit</p>
          </div>
        </div>

      </div>
    </div>
  );
}
