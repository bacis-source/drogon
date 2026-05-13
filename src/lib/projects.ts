import { SupabaseClient } from "@supabase/supabase-js";

export async function getAccessibleProjects(supabase: SupabaseClient, userId: string, userEmail: string | undefined) {
  // 1. Hent projekter, hvor brugeren er ejer
  const { data: ownedProjects } = await supabase
    .from('projects')
    .select('id, name, created_at, summary, tech_spec, execution_plan, lean_canvas, tech_architecture, business_model, ip_strategy')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // 2. Hent projekter, hvor brugeren er inviteret gæst
  let memberProjectsData: any[] = [];
  if (userEmail) {
    const { data: memberRows } = await supabase
      .from('project_members')
      .select('project_id, projects!inner(id, name, created_at, summary, tech_spec, execution_plan, lean_canvas, tech_architecture, business_model, ip_strategy)')
      .eq('user_email', userEmail);
    
    if (memberRows) {
      // Flad strukturen ud
      memberProjectsData = memberRows.map((r: any) => r.projects);
    }
  }

  // 3. Flet listerne sammen og fjern dubletter (hvis man f.eks. uheldigvis både er ejer og gæst)
  const allProjectsMap = new Map();
  [...(ownedProjects || []), ...memberProjectsData].forEach((p: any) => {
    if (p) allProjectsMap.set(p.id, p);
  });

  // 4. Sortér efter oprettelsesdato nyeste først
  const sortedProjects = Array.from(allProjectsMap.values()).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return sortedProjects;
}
