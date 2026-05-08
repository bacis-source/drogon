import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LayoutTemplate, Lightbulb, Zap, ArrowRight, Target, Activity, ShieldAlert, Users, Coins, TrendingDown, Rocket, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { EditableBlock } from "./editable-block";

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

  const leanCanvas = project.lean_canvas || {};

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0A0F1E] nice-scrollbar flex flex-col">
      {/* Header */}
      <header className="p-8 pb-4 border-b border-slate-800/60 bg-[#0B0F19]/50 sticky top-0 z-20 backdrop-blur-md flex-none">
        <div className="flex items-center gap-3 mb-2 opacity-80">
          <LayoutTemplate className="w-4 h-4 text-[#F59E0B]" />
          <span className="text-[10px] font-bold tracking-widest text-[#F59E0B] uppercase">INTERACTIVE LEAN CANVAS</span>
        </div>
        <div className="flex justify-between items-end">
          <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase">{project.name}</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/40 border border-slate-700/50">
             <Zap className="w-3.5 h-3.5 text-amber-500" />
             <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">AI Synced</span>
          </div>
        </div>
      </header>

      {/* Canvas Grid Container */}
      <div className="flex-1 p-6 lg:p-8 min-h-0">
        <div className="h-full min-h-[800px] grid grid-cols-10 grid-rows-3 gap-4">
          
          {/* Top Row: 5 main columns */}
          
          {/* Problem (Col 1-2, Span 2 Rows) */}
          <div className="col-span-10 lg:col-span-2 row-span-1 lg:row-span-2">
            <EditableBlock 
              projectId={project.id}
              blockKey="problem"
              title="Problem"
              content={leanCanvas.problem || ''}
              icon={<Target className="w-4 h-4 text-red-400" />}
            />
          </div>

          {/* Solution & Key Metrics (Col 3-4, 1 Row each) */}
          <div className="col-span-10 lg:col-span-2 lg:row-span-1">
            <EditableBlock 
              projectId={project.id}
              blockKey="solution"
              title="Løsning"
              content={leanCanvas.solution || ''}
              icon={<Lightbulb className="w-4 h-4 text-emerald-400" />}
            />
          </div>
          <div className="col-span-10 lg:col-span-2 lg:col-start-3 lg:row-start-2 lg:row-span-1">
            <EditableBlock 
              projectId={project.id}
              blockKey="key_metrics"
              title="Nøgletal (Metrics)"
              content={leanCanvas.key_metrics || ''}
              icon={<Activity className="w-4 h-4 text-blue-400" />}
            />
          </div>

          {/* UVP (Col 5-6, Span 2 Rows) */}
          <div className="col-span-10 lg:col-span-2 lg:col-start-5 lg:row-start-1 lg:row-span-2">
            <EditableBlock 
              projectId={project.id}
              blockKey="uvp"
              title="Unik Værditilbud"
              content={leanCanvas.uvp || ''}
              icon={<Zap className="w-4 h-4 text-[#F59E0B]" />}
              className="border-[#F59E0B]/30 shadow-[0_0_30px_rgba(245,158,11,0.05)]"
            />
          </div>

          {/* Unfair Advantage & Channels (Col 7-8, 1 Row each) */}
          <div className="col-span-10 lg:col-span-2 lg:col-start-7 lg:row-start-1 lg:row-span-1">
            <EditableBlock 
              projectId={project.id}
              blockKey="unfair_advantage"
              title="Urimelig Fordel (IP)"
              content={leanCanvas.unfair_advantage || project.ip_strategy || ''}
              icon={<ShieldAlert className="w-4 h-4 text-purple-400" />}
            />
          </div>
          <div className="col-span-10 lg:col-span-2 lg:col-start-7 lg:row-start-2 lg:row-span-1">
            <EditableBlock 
              projectId={project.id}
              blockKey="channels"
              title="Kanaler"
              content={leanCanvas.channels || ''}
              icon={<MessagesSquare className="w-4 h-4 text-pink-400" />}
            />
          </div>

          {/* Customer Segments (Col 9-10, Span 2 Rows) */}
          <div className="col-span-10 lg:col-span-2 lg:col-start-9 lg:row-start-1 lg:row-span-2">
            <EditableBlock 
              projectId={project.id}
              blockKey="customer_segments"
              title="Målgruppe"
              content={leanCanvas.customer_segments || ''}
              icon={<Users className="w-4 h-4 text-cyan-400" />}
            />
          </div>

          {/* Bottom Row: Cost & Revenue (Col 1-5 and 6-10) */}
          <div className="col-span-10 lg:col-span-5 lg:row-start-3">
            <EditableBlock 
              projectId={project.id}
              blockKey="cost_structure"
              title="Omkostninger"
              content={leanCanvas.cost_structure || ''}
              icon={<TrendingDown className="w-4 h-4 text-rose-400" />}
            />
          </div>
          <div className="col-span-10 lg:col-span-5 lg:col-start-6 lg:row-start-3">
            <EditableBlock 
              projectId={project.id}
              blockKey="revenue_streams"
              title="Indtægtskilder"
              content={leanCanvas.revenue_streams || project.business_model || ''}
              icon={<Coins className="w-4 h-4 text-emerald-500" />}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
