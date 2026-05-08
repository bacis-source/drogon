'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateArchitectureBlock(projectId: string, blockKey: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  // First get the existing architecture
  const { data: project, error: fetchErr } = await supabase
    .from('projects')
    .select('tech_architecture')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (fetchErr) {
    return { error: fetchErr.message }
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
