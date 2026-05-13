'use server';

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getAccessibleProjects } from "@/lib/projects";

export async function updateBusinessPlanBlock(projectId: string, blockKey: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const accessibleProjects = await getAccessibleProjects(supabase, user.id, user.email);
  const hasAccess = accessibleProjects.some(p => p.id === projectId);
  if (!hasAccess) throw new Error("Unauthorized");

  const project = accessibleProjects.find(p => p.id === projectId);
  const businessPlan = project?.business_plan || {};

  businessPlan[blockKey] = content;

  const { error } = await supabase
    .from('projects')
    .update({ business_plan: businessPlan })
    .eq('id', projectId);

  if (error) throw new Error(error.message);

  revalidatePath('/business-plan');
}

export async function updateBudget(projectId: string, budgetData: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const accessibleProjects = await getAccessibleProjects(supabase, user.id, user.email);
  const hasAccess = accessibleProjects.some(p => p.id === projectId);
  if (!hasAccess) throw new Error("Unauthorized");

  const { error } = await supabase
    .from('projects')
    .update({ budget: budgetData })
    .eq('id', projectId);

  if (error) throw new Error(error.message);

  revalidatePath('/business-plan');
}
