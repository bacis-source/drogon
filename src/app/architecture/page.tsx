import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Cpu, Server, Shield, Cloud, ArrowRight, Database, MonitorSmartphone, GitBranch, Zap, Layers } from "lucide-react";
import Link from "next/link";
import { getAccessibleProjects } from "@/lib/projects";
import { EditableArchitectureBlock } from "./editable-block";
import { ProjectSelector } from "@/components/project-selector";

export default async function ArchitecturePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const projects = await getAccessibleProjects(supabase, user.id, user.email);
  
  const projectIdParam = searchParams.project as string | undefined;
  let project = projects.length > 0 ? projects[0] : null;
  
  if (projectIdParam) {
    const selected = projects.find(p => p.id === projectIdParam);
    if (selected) project = selected;
  }

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

  const techArch = project.tech_architecture || {};

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#050810] nice-scrollbar flex flex-col">
      {/* Header */}
      <header className="p-8 pb-4 border-b border-blue-900/30 bg-[#070B14]/80 sticky top-0 z-20 backdrop-blur-md flex-none">
        <div className="flex items-center gap-3 mb-2 opacity-80">
          <Cpu className="w-4 h-4 text-blue-500" />
          <span className="text-[10px] font-bold tracking-widest text-blue-500 uppercase">THE TECHNICAL BLUEPRINT</span>
        </div>
        <div className="flex justify-between items-end">
          <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase drop-shadow-[0_0_15px_rgba(59,130,246,0.2)] max-w-2xl truncate">{project.name}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/40 border border-blue-800/50">
               <Zap className="w-3.5 h-3.5 text-blue-400" />
               <span className="text-[9px] font-bold tracking-widest text-blue-300 uppercase">AI Synced</span>
            </div>
            <ProjectSelector projects={projects} activeProjectId={project.id} />
          </div>
        </div>
      </header>

      {/* Grid Content */}
      <div className="flex-1 p-6 lg:p-8 min-h-0">
        
        {/* Overall Tech Spec Summary (Legacy support but still useful) */}
        <div className="bg-[#0B101D] border border-blue-900/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(59,130,246,0.03)] relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
               <Layers className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest">System Overview</h2>
          </div>
          <p className="text-slate-400 leading-relaxed text-sm pl-1 whitespace-pre-wrap font-mono">
            {project.tech_spec === 'Ikke relevant for denne type samtale.' ? 
              <span className="italic opacity-50">Ingen overordnet specifikation er genereret.</span> : 
              project.tech_spec}
          </p>
        </div>

        {/* The Technical Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-full min-h-[600px] auto-rows-fr">
          
          {/* Frontend */}
          <div className="col-span-1">
            <EditableArchitectureBlock 
              projectId={project.id}
              blockKey="frontend"
              title="Frontend Stack"
              content={techArch.frontend || ''}
              icon={<MonitorSmartphone className="w-4 h-4 text-cyan-400" />}
            />
          </div>

          {/* Backend */}
          <div className="col-span-1">
            <EditableArchitectureBlock 
              projectId={project.id}
              blockKey="backend"
              title="Backend & API"
              content={techArch.backend || ''}
              icon={<Server className="w-4 h-4 text-emerald-400" />}
            />
          </div>

          {/* Database */}
          <div className="col-span-1">
            <EditableArchitectureBlock 
              projectId={project.id}
              blockKey="database"
              title="Database & Storage"
              content={techArch.database || ''}
              icon={<Database className="w-4 h-4 text-orange-400" />}
            />
          </div>

          {/* Infrastructure */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <EditableArchitectureBlock 
              projectId={project.id}
              blockKey="infrastructure"
              title="Cloud & DevOps"
              content={techArch.infrastructure || ''}
              icon={<Cloud className="w-4 h-4 text-blue-400" />}
            />
          </div>

          {/* Security */}
          <div className="col-span-1">
            <EditableArchitectureBlock 
              projectId={project.id}
              blockKey="security"
              title="Sikkerhed & Auth"
              content={techArch.security || ''}
              icon={<Shield className="w-4 h-4 text-rose-400" />}
            />
          </div>

          {/* System Flow */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <EditableArchitectureBlock 
              projectId={project.id}
              blockKey="system_flow"
              title="Data Flow & Integrationer"
              content={techArch.system_flow || ''}
              icon={<GitBranch className="w-4 h-4 text-purple-400" />}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
