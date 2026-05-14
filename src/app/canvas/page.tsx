import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LayoutTemplate, Lightbulb, Zap, ArrowRight, Target, Activity, ShieldAlert, Users, Coins, TrendingDown, Rocket, MessagesSquare } from "lucide-react";
import Link from "next/link";
import { EditableBlock } from "./editable-block";
import { getAccessibleProjects } from "@/lib/projects";
import { CanvasClientView } from "./components/canvas-client-view";
import { DashboardView } from "./components/dashboard-view";
import { ExecutionBoardView } from "./components/execution-board-view";

export default async function CanvasPage() {
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

  // Transform Supabase project budget & execution plan into Legacy DashboardData format
  let dashboardData: any = null;
  if (project.budget || project.execution_plan) {
    const budget = project.budget || { capex: [], opex: [], revenue: [] };
    const capexTotal = (budget.capex || []).reduce((acc: number, item: any) => acc + item.amount, 0);
    const opexTotal = (budget.opex || []).reduce((acc: number, item: any) => acc + item.amount, 0);
    const revTotal = (budget.revenue || []).reduce((acc: number, item: any) => acc + item.amount, 0);
    
    // Simulate 12 months
    const financials = [];
    let cumulative = 500000; // Mock initial investment
    for (let i = 1; i <= 12; i++) {
        const rev = revTotal * (1 + (i * 0.1)); // 10% growth per month mock
        const exp = i === 1 ? opexTotal + capexTotal : opexTotal;
        const cashflow = rev - exp;
        cumulative += cashflow;
        financials.push({
            month: `Måned ${i}`,
            revenue: Math.round(rev),
            expenses: Math.round(exp),
            cashflow: Math.round(cashflow),
            cumulativeCash: Math.round(cumulative)
        });
    }

    const tasks = (project.execution_plan || []).map((t: any, i: number) => ({
        id: `task-${i}`,
        title: t.task || t.title || 'Opgave',
        status: (t.status === 'DONE' || t.status === 'done') ? 'done' : 
                (t.status === 'IN_PROGRESS' || t.status === 'doing') ? 'doing' : 'todo',
        priority: 'medium',
        category: t.phase || 'Generel'
    }));

    dashboardData = {
        financials,
        kpi: {
            cac: 500,
            ltv: 2500,
            burnRate: opexTotal,
            runway: Math.round(cumulative / Math.max(1, (opexTotal - revTotal))),
            riskScore: 35,
            protectionScore: 80
        },
        segments: [],
        competitors: [],
        gritLevel: 3,
        tasks
    };
  }

  const leanCanvasGrid = (
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
          icon={<Zap className="w-4 h-4 text-amber-400" />}
          isHighlight
        />
      </div>

      {/* Unfair Advantage & Channels (Col 7-8, 1 Row each) */}
      <div className="col-span-10 lg:col-span-2 lg:col-start-7 lg:row-start-1 lg:row-span-1">
        <EditableBlock 
          projectId={project.id}
          blockKey="unfair_advantage"
          title="Unfair Fordel"
          content={leanCanvas.unfair_advantage || ''}
          icon={<ShieldAlert className="w-4 h-4 text-purple-400" />}
        />
      </div>
      <div className="col-span-10 lg:col-span-2 lg:col-start-7 lg:row-start-2 lg:row-span-1">
        <EditableBlock 
          projectId={project.id}
          blockKey="channels"
          title="Kanaler"
          content={leanCanvas.channels || ''}
          icon={<Rocket className="w-4 h-4 text-pink-400" />}
        />
      </div>

      {/* Customer Segments (Col 9-10, Span 2 Rows) */}
      <div className="col-span-10 lg:col-span-2 lg:col-start-9 lg:row-start-1 lg:row-span-2">
        <EditableBlock 
          projectId={project.id}
          blockKey="customer_segments"
          title="Kundesegmenter"
          content={leanCanvas.customer_segments || ''}
          icon={<Users className="w-4 h-4 text-indigo-400" />}
        />
      </div>

      {/* Bottom Row: 2 halves */}
      {/* Cost Structure (Col 1-5, Row 3) */}
      <div className="col-span-10 lg:col-span-5 lg:col-start-1 lg:row-start-3">
        <EditableBlock 
          projectId={project.id}
          blockKey="cost_structure"
          title="Omkostningsstruktur"
          content={leanCanvas.cost_structure || ''}
          icon={<TrendingDown className="w-4 h-4 text-orange-400" />}
        />
      </div>

      {/* Revenue Streams (Col 6-10, Row 3) */}
      <div className="col-span-10 lg:col-span-5 lg:col-start-6 lg:row-start-3">
        <EditableBlock 
          projectId={project.id}
          blockKey="revenue_streams"
          title="Indtægtsstrømme"
          content={leanCanvas.revenue_streams || ''}
          icon={<Coins className="w-4 h-4 text-green-400" />}
        />
      </div>
    </div>
  );

  return (
    <CanvasClientView 
      project={project}
      leanCanvasGrid={leanCanvasGrid}
      dashboardView={<DashboardView data={dashboardData} />}
      executionView={<ExecutionBoardView data={dashboardData} />}
    />
  );
}
