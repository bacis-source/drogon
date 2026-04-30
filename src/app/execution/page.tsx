import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CheckSquare, ListTodo, CircleDashed, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ExecutionTask {
  task: string;
  status: 'BACKLOG' | 'IN_PROGRESS' | 'DONE';
  phase: string;
}

export default async function ExecutionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0B0F19] text-center h-full">
        <div className="w-24 h-24 rounded-full bg-[#111626] border border-slate-800 flex items-center justify-center mb-6 shadow-2xl">
           <ListTodo className="w-10 h-10 text-slate-700" />
        </div>
        <h2 className="text-2xl font-bold text-slate-300 mb-3 tracking-widest uppercase">Intet Projekt Startet</h2>
        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
          Gå tilbage til samtalen med Drogon for at oprette din første idé.
        </p>
        <Link href="/" className="flex items-center gap-2 px-6 py-3 bg-[#F59E0B] text-[#0A0F1E] font-bold rounded-full uppercase tracking-wider text-sm hover:bg-[#EAB308] transition-colors">
          Start Samtale <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const { data: vector } = await supabase
    .from('project_vectors')
    .select('metadata')
    .eq('project_id', project.id)
    .single();

  const executionPlan: ExecutionTask[] | undefined = vector?.metadata?.execution_plan;

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0A0F1E] nice-scrollbar">
      {/* Header */}
      <header className="p-8 pb-4 border-b border-slate-800/60 bg-[#0B0F19]/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2 opacity-80">
          <CheckSquare className="w-4 h-4 text-emerald-500" />
          <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">EXECUTION & ROADMAP</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase">{project.name}</h1>
      </header>

      {/* Content */}
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        
        {!executionPlan || executionPlan.length === 0 ? (
          <div className="bg-[#111626] border border-emerald-900/40 rounded-2xl p-8 shadow-[0_0_30px_rgba(16,185,129,0.05)] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <ListTodo className="w-12 h-12 text-emerald-500/50 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-200 uppercase tracking-widest mb-2">Ingen Plan Genereret Endnu</h2>
            <p className="text-slate-400 max-w-lg mx-auto mb-6">
              Dette projekt blev gemt før Roadmap-modulet blev aktiveret. Gå tilbage til chatten og bed Drogon om at gemme igen, så han kan bygge din AI-genererede eksekveringsplan.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-[#161C2C] border border-emerald-900/50 text-emerald-500 font-bold rounded-full uppercase tracking-wider text-sm hover:bg-[#1A2235] transition-colors">
              Opdater via GEM Kommando <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Backlog */}
            <div className="bg-[#0D121F] rounded-2xl p-4 border border-slate-800/80">
              <div className="flex items-center gap-2 mb-4 px-2">
                 <CircleDashed className="w-4 h-4 text-slate-500" />
                 <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">BACKLOG</span>
                 <span className="ml-auto text-xs font-bold text-slate-600">{executionPlan.filter(t => t.status === 'BACKLOG').length}</span>
              </div>
              <div className="space-y-3">
                {executionPlan.filter(t => t.status === 'BACKLOG').map((task, i) => (
                  <div key={i} className="bg-[#161C2C] p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer group">
                    <span className="text-[9px] font-bold tracking-widest text-emerald-500/70 uppercase mb-2 block">{task.phase}</span>
                    <h3 className="text-sm font-medium text-slate-300 leading-snug group-hover:text-white transition-colors">{task.task}</h3>
                  </div>
                ))}
              </div>
            </div>

            {/* In Progress */}
            <div className="bg-[#0D121F] rounded-2xl p-4 border border-emerald-900/30">
              <div className="flex items-center gap-2 mb-4 px-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-xs font-bold tracking-widest text-emerald-500 uppercase">IN PROGRESS</span>
                 <span className="ml-auto text-xs font-bold text-emerald-700">{executionPlan.filter(t => t.status === 'IN_PROGRESS').length}</span>
              </div>
              <div className="space-y-3">
                {executionPlan.filter(t => t.status === 'IN_PROGRESS').map((task, i) => (
                  <div key={i} className="bg-[#111A24] p-4 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)] cursor-pointer group hover:border-emerald-500/40 transition-colors">
                    <span className="text-[9px] font-bold tracking-widest text-emerald-400 uppercase mb-2 block">{task.phase}</span>
                    <h3 className="text-sm font-medium text-slate-200 leading-snug group-hover:text-white transition-colors">{task.task}</h3>
                  </div>
                ))}
              </div>
            </div>

            {/* Done */}
            <div className="bg-[#0D121F] rounded-2xl p-4 border border-slate-800/80">
              <div className="flex items-center gap-2 mb-4 px-2">
                 <CheckCircle2 className="w-4 h-4 text-slate-600" />
                 <span className="text-xs font-bold tracking-widest text-slate-600 uppercase">DONE</span>
                 <span className="ml-auto text-xs font-bold text-slate-700">{executionPlan.filter(t => t.status === 'DONE').length}</span>
              </div>
              <div className="space-y-3">
                {executionPlan.filter(t => t.status === 'DONE').map((task, i) => (
                  <div key={i} className="bg-[#161C2C] p-4 rounded-xl border border-slate-800 opacity-60 cursor-pointer hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase mb-2 block">{task.phase}</span>
                    <h3 className="text-sm font-medium text-slate-400 leading-snug line-through">{task.task}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
