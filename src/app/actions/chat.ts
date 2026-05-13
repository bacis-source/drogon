'use server'

import { createClient } from "@/lib/supabase/server"

import { getAccessibleProjects } from "@/lib/projects"

export async function getChatHistory(projectId?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  let query;

  if (projectId) {
    // Check access first
    const accessibleProjects = await getAccessibleProjects(supabase, user.id, user.email);
    const hasAccess = accessibleProjects.some(p => p.id === projectId);
    
    if (!hasAccess) return [];

    // Fetch all messages for this project, regardless of who wrote them
    query = supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
  } else {
    // Blank canvas, only fetch the user's own unassigned messages
    query = supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('user_id', user.id)
      .is('project_id', null)
      .order('created_at', { ascending: true })
  }

  const { data, error } = await query

  if (error || !data) {
    console.error("Error fetching chat history", error)
    return []
  }

  // Map to the format expected by useChat
  return data.map((msg) => ({
    id: msg.id,
    role: msg.role as 'system' | 'user' | 'assistant' | 'data',
    content: msg.content,
    createdAt: new Date(msg.created_at)
  }))
}
