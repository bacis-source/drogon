'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAccessibleProjects } from '@/lib/projects'

export async function updateArchitectureBlock(projectId: string, blockKey: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Check access
  const accessibleProjects = await getAccessibleProjects(supabase, user.id, user.email)
  const project = accessibleProjects.find((p: any) => p.id === projectId)

  if (!project) {
    return { error: 'Unauthorized or project not found' }
  }

  const currentArch = project.tech_architecture || {}
  const newArch = { ...currentArch, [blockKey]: content }

  // Update the architecture
  const { error: updateErr } = await supabase
    .from('projects')
    .update({ tech_architecture: newArch })
    .eq('id', projectId)

  if (updateErr) {
    return { error: updateErr.message }
  }

  revalidatePath('/architecture')
  return { success: true }
}
