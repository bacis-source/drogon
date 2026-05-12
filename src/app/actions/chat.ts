'use server'

import { createClient } from "@/lib/supabase/server"

export async function getChatHistory(projectId?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  let query = supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (projectId) {
    query = query.eq('project_id', projectId)
  } else {
    query = query.is('project_id', null)
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
