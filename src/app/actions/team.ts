'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { getAccessibleProjects } from "@/lib/projects"

export async function inviteTeamMember(projectId: string, email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: "Ikke logget ind" }

  // Kun ejeren (eller en eksisterende admin) bør kunne invitere.
  // Her tjekker vi bare om brugeren er ejeren af projektet.
  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_id !== user.id) {
    return { error: "Kun projektets ejer kan invitere nye medlemmer." }
  }

  // Tilføj email til project_members
  const { error } = await supabase
    .from('project_members')
    .insert({
      project_id: projectId,
      user_email: email.toLowerCase(),
      role: 'editor'
    })

  if (error) {
    if (error.code === '23505') return { error: "Brugeren er allerede inviteret." }
    return { error: "Kunne ikke tilføje medlem: " + error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function getTeamMembers(projectId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('project_members')
    .select('user_email, role')
    .eq('project_id', projectId)
    
  if (error) return []
  return data
}
