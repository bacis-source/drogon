'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateTaskStatus(projectId: string, taskName: string, newStatus: 'BACKLOG' | 'IN_PROGRESS' | 'DONE') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  // Fetch current vector metadata
  const { data: vector, error: fetchError } = await supabase
    .from('project_vectors')
    .select('metadata')
    .eq('project_id', projectId)
    .single()

  if (fetchError || !vector) {
    throw new Error("Could not fetch project metadata")
  }

  // Type definitions
  interface ExecutionTask {
    task: string;
    status: 'BACKLOG' | 'IN_PROGRESS' | 'DONE';
    phase: string;
  }

  const executionPlan: ExecutionTask[] = vector.metadata?.execution_plan || []
  
  const updatedPlan = executionPlan.map(t => {
    if (t.task === taskName) {
      return { ...t, status: newStatus }
    }
    return t
  })

  const newMetadata = {
    ...vector.metadata,
    execution_plan: updatedPlan
  }

  const { error: updateError } = await supabase
    .from('project_vectors')
    .update({ metadata: newMetadata })
    .eq('project_id', projectId)

  if (updateError) {
    throw new Error("Could not update task status")
  }

  revalidatePath('/execution')
}
