'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getAccessibleProjects } from "@/lib/projects"

export interface ExecutionTask {
  task: string;
  status: 'BACKLOG' | 'IN_PROGRESS' | 'DONE';
  phase: string;
}

export async function updateTaskStatus(projectId: string, taskName: string, newStatus: 'BACKLOG' | 'IN_PROGRESS' | 'DONE') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const accessibleProjects = await getAccessibleProjects(supabase, user.id, user.email)
  const project = accessibleProjects.find((p: any) => p.id === projectId)
  if (!project) throw new Error("Could not fetch project or unauthorized")

  const executionPlan: ExecutionTask[] = project.execution_plan || []
  
  const updatedPlan = executionPlan.map(t => {
    if (t.task === taskName) {
      return { ...t, status: newStatus }
    }
    return t
  })

  const { error: updateError } = await supabase
    .from('projects')
    .update({ execution_plan: updatedPlan })
    .eq('id', projectId)

  if (updateError) throw new Error("Could not update task status")

  revalidatePath('/execution')
}

export async function addTask(projectId: string, taskName: string, phase: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const accessibleProjects = await getAccessibleProjects(supabase, user.id, user.email)
  const project = accessibleProjects.find((p: any) => p.id === projectId)
  if (!project) throw new Error("Could not fetch project or unauthorized")

  const executionPlan: ExecutionTask[] = project.execution_plan || []
  
  // Create new task and prepend it to the backlog
  const newTask: ExecutionTask = { task: taskName, phase, status: 'BACKLOG' }
  const updatedPlan = [newTask, ...executionPlan]

  await supabase
    .from('projects')
    .update({ execution_plan: updatedPlan })
    .eq('id', projectId)

  revalidatePath('/execution')
}

export async function deleteTask(projectId: string, taskName: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const accessibleProjects = await getAccessibleProjects(supabase, user.id, user.email)
  const project = accessibleProjects.find((p: any) => p.id === projectId)
  if (!project) throw new Error("Could not fetch project or unauthorized")

  const executionPlan: ExecutionTask[] = project.execution_plan || []
  const updatedPlan = executionPlan.filter(t => t.task !== taskName)

  await supabase
    .from('projects')
    .update({ execution_plan: updatedPlan })
    .eq('id', projectId)

  revalidatePath('/execution')
}
