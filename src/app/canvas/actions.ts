'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAccessibleProjects } from '@/lib/projects'

export async function updateCanvasBlock(projectId: string, blockKey: string, content: string) {
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

  const currentCanvas = project.lean_canvas || {}
  const newCanvas = { ...currentCanvas, [blockKey]: content }

  // Update the canvas
  const { error: updateErr } = await supabase
    .from('projects')
    .update({ lean_canvas: newCanvas })
    .eq('id', projectId)

  if (updateErr) {
    return { error: updateErr.message }
  }

  revalidatePath('/canvas')
  return { success: true }
}
