import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Briefcase, DollarSign, ArrowRight, Zap, Target, Search, BarChart3, Settings } from "lucide-react";
import Link from "next/link";
import { getAccessibleProjects } from "@/lib/projects";
import { EditableBusinessPlanBlock } from "./editable-block";
import { BudgetTab } from "./budget-tab";

export default async function BusinessPlanPage({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const projects = await getAccessibleProjects(supabase, user.id, user.email);
  const project = projects.length > 0 ? projects[0] : null;

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0B0F19] text-center h-full">
        <div className="w-24 h-24 rounded-full bg-[#111626] border border-slate-800 flex items-center justify-center mb-6 shadow-2xl">
           <Briefcase className="w-10 h-10 text-slate-700" />
        </div>
        <h2 className="text-2xl font-bold text-slate-300 mb-3 tracking-widest uppercase">Ingen Forretningsplan</h2>
        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
          For at låse op for forretningsplan og budget, skal du definere en vision med Drogon.
          <br/><br/>
          <span className="bg-[#1A1525] text-amber-500 px-4 py-2 rounded-lg border border-amber-900/50 font-mono text-sm shadow-[0_0_15px_rgba(245,158,11,0.1)]">GEM [Projekt Navn]</span>
        </p>
        <Link href="/" className="flex items-center gap-2 px-6 py-3 bg-[#F59E0B] text-[#0A0F1E] font-bold rounded-full uppercase tracking-wider text-sm hover:bg-[#EAB308] transition-colors">
          Start Samtale <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const tab = searchParams.tab || 'plan';
  const businessPlan = project.business_plan || {};

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#050810] nice-scrollbar flex flex-col">
      {/* Header */}
      <header className="p-8 pb-0 border-b border-blue-900/30 bg-[#070B14]/80 sticky top-0 z-20 backdrop-blur-md flex-none">
        <div className="flex items-center gap-3 mb-2 opacity-80">
          <Briefcase className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">BUSINESS STRATEGY & FINANCIALS</span>
        </div>
        <div className="flex justify-between items-end mb-6">
          <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">{project.name}</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-800/50">
             <Zap className="w-3.5 h-3.5 text-emerald-400" />
             <span className="text-[9px] font-bold tracking-widest text-emerald-300 uppercase">AI Synced</span>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-8">
          <Link 
            href="?tab=plan" 
            className={`pb-4 text-sm font-bold tracking-wider uppercase border-b-2 transition-all ${tab === 'plan' ? 'border-emerald-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <div className="flex items-center gap-2"><Briefcase className="w-4 h-4"/> Forretningsplan</div>
          </Link>
          <Link 
            href="?tab=budget" 
            className={`pb-4 text-sm font-bold tracking-wider uppercase border-b-2 transition-all ${tab === 'budget' ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <div className="flex items-center gap-2"><DollarSign className="w-4 h-4"/> Budget & Finans</div>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6 lg:p-8 min-h-0">
        
        {tab === 'plan' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[600px] auto-rows-fr">
            <div className="col-span-1 md:col-span-2">
              <EditableBusinessPlanBlock 
                projectId={project.id}
                blockKey="executive_summary"
                title="Executive Summary"
                content={businessPlan.executive_summary || ''}
                icon={<Target className="w-5 h-5 text-emerald-400" />}
              />
            </div>
            
            <div className="col-span-1">
              <EditableBusinessPlanBlock 
                projectId={project.id}
                blockKey="market_analysis"
                title="Markedsanalyse & Konkurrenter"
                content={businessPlan.market_analysis || ''}
                icon={<Search className="w-5 h-5 text-blue-400" />}
              />
            </div>

            <div className="col-span-1">
              <EditableBusinessPlanBlock 
                projectId={project.id}
                blockKey="go_to_market"
                title="Go-To-Market Strategi"
                content={businessPlan.go_to_market || ''}
                icon={<BarChart3 className="w-5 h-5 text-orange-400" />}
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <EditableBusinessPlanBlock 
                projectId={project.id}
                blockKey="operations"
                title="Drift & Operations"
                content={businessPlan.operations || ''}
                icon={<Settings className="w-5 h-5 text-purple-400" />}
              />
            </div>
          </div>
        )}

        {tab === 'budget' && (
          <BudgetTab project={project} />
        )}

      </div>
    </div>
  );
}
