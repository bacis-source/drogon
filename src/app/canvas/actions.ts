'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCanvasBlock(projectId: string, blockKey: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // First get the existing canvas
  const { data: project, error: fetchErr } = await supabase
    .from('projects')
    .select('lean_canvas')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (fetchErr) {
    return { error: fetchErr.message }
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
