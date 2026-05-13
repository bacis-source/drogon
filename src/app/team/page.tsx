import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, ShieldAlert, ArrowRight, UserPlus, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { getAccessibleProjects } from "@/lib/projects";
import { InviteForm } from "./invite-form";
import { getTeamMembers } from "../actions/team";

export default async function TeamPage() {
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
           <Users className="w-10 h-10 text-slate-700" />
        </div>
        <h2 className="text-2xl font-bold text-slate-300 mb-3 tracking-widest uppercase">Intet Projekt Startet</h2>
        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
          Gå tilbage til samtalen med Drogon for at oprette din første idé før du kan invitere dit team.
        </p>
        <Link href="/" className="flex items-center gap-2 px-6 py-3 bg-[#F59E0B] text-[#0A0F1E] font-bold rounded-full uppercase tracking-wider text-sm hover:bg-[#EAB308] transition-colors">
          Start Samtale <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const isOwner = project.user_id === user.id;
  const teamMembers = await getTeamMembers(project.id);

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0A0F1E] nice-scrollbar">
      {/* Header */}
      <header className="p-8 pb-4 border-b border-slate-800/60 bg-[#0B0F19]/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2 opacity-80">
          <Users className="w-4 h-4 text-cyan-500" />
          <span className="text-[10px] font-bold tracking-widest text-cyan-500 uppercase">TEAM & SAMARBEJDE</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase">{project.name}</h1>
      </header>

      {/* Content */}
      <div className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Venstre: Formular */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#111626] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-cyan-900/20 flex items-center justify-center border border-cyan-500/20">
                <UserPlus className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Inviter Medlem</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Giv adgang til projektet</p>
              </div>
            </div>

            {isOwner ? (
               <InviteForm projectId={project.id} />
            ) : (
              <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  Du er gæst på dette projekt. Kun ejeren (som oprettede projektet) kan invitere nye medlemmer til at deltage.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Højre: Medlemsliste */}
        <div className="lg:col-span-2 space-y-4">
           <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Aktive Medlemmer</h3>
           
           {/* Ejer */}
           <div className="bg-[#111626] border border-slate-800 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-900/20 border border-amber-500/30 flex items-center justify-center">
                 <ShieldCheck className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                 <p className="text-sm font-bold text-white">Projekt Ejer</p>
                 <p className="text-xs text-slate-500">{isOwner ? user.email : "Ekstern Ejer"}</p>
              </div>
              <div className="ml-auto px-3 py-1 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-500/20">
                 Owner
              </div>
           </div>

           {/* Gæster */}
           {teamMembers && teamMembers.length > 0 ? (
             teamMembers.map((member: any, i: number) => (
               <div key={i} className="bg-[#111626] border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-900/20 border border-cyan-500/30 flex items-center justify-center">
                     <Mail className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                     <p className="text-sm font-bold text-white">{member.user_email}</p>
                     <p className="text-[10px] text-slate-500 uppercase tracking-wider">Deltager</p>
                  </div>
                  <div className="ml-auto px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-slate-700">
                     {member.role}
                  </div>
               </div>
             ))
           ) : (
             <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl">
               <p className="text-sm text-slate-500">Ingen inviterede medlemmer endnu.</p>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
