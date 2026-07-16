'use server'

import { createClient } from "@/lib/supabase/server"

import { getAccessibleProjects } from "@/lib/projects"
import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

export async function clearUnassignedChat() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'User not authenticated' }

  const { error } = await supabase
    .from('messages')
    .update({ is_archived: true })
    .eq('user_id', user.id)
    .is('project_id', null)
    .eq('is_archived', false)

  if (error) {
    console.error("Error clearing chat", error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

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
      .eq('is_archived', false)
      .order('created_at', { ascending: true })
  } else {
    // Blank canvas, only fetch the user's own unassigned messages
    query = supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('user_id', user.id)
      .is('project_id', null)
      .eq('is_archived', false)
      .order('created_at', { ascending: true })
  }

  const { data, error } = await query

  if (error || !data) {
    console.error("Error fetching chat history", error)
    throw new Error('Kunne ikke hente historik fra databasen.');
  }

  // Map to the format expected by useChat
  return data.map((msg) => ({
    id: msg.id,
    role: msg.role as 'system' | 'user' | 'assistant' | 'data',
    content: msg.content,
    createdAt: new Date(msg.created_at)
  }))
}

export async function handoffChat(projectId?: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get current active messages
    let query = supabase
      .from('messages')
      .select('role, content')
      .eq('is_archived', false)
      .order('created_at', { ascending: true })

    if (projectId) {
      query = query.eq('project_id', projectId)
    } else {
      query = query.eq('user_id', user.id).is('project_id', null)
    }

    const { data: messages, error: fetchErr } = await query;
    if (fetchErr) throw new Error(`Fetch error: ${fetchErr.message}`);

    if (!messages || messages.length === 0) return { success: true }
    
    const conversation = messages.map(m => `${m.role}: ${m.content}`).join('\n')

    const myGoogle = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })

    // Generate Handoff Summary
    let summary = '';
    try {
      const { text } = await generateText({
        model: myGoogle('gemini-2.5-flash'),
        prompt: `Gennemlæs følgende samtale og træk den absolutte essens ud (konklusioner, valgt teknologi, strategiske beslutninger og kontekst). Ignorer smalltalk og meta-diskussion. Skriv en meget tæt og professionel opsummering:\n\n${conversation}`,
      });
      summary = text;
    } catch (err) {
      console.warn("Handoff Summarization failed. Forcing archive.", err);
      summary = "Systemet blev tvunget til at nød-arkivere den forrige tråd. Konteksten er nulstillet, og chatten er nu renset for fejl.";
    }

    // Archive old messages
    let archiveQuery = supabase
      .from('messages')
      .update({ is_archived: true })
      .eq('is_archived', false)

    if (projectId) {
      archiveQuery = archiveQuery.eq('project_id', projectId)
    } else {
      archiveQuery = archiveQuery.eq('user_id', user.id).is('project_id', null)
    }
    const { error: archiveErr } = await archiveQuery;
    if (archiveErr) throw new Error(`Archive error: ${archiveErr.message}`);

    // Insert the summary as a system message (will be loaded as context but hidden from UI if UI filters out 'system')
    const { error: ins1Err } = await supabase.from('messages').insert({
      user_id: user.id,
      project_id: projectId || null,
      role: 'system',
      content: `[HANDOFF SUMMARY FRA TIDLIGERE SPOR]:\n${summary}`
    })
    if (ins1Err) throw new Error(`Insert summary error: ${ins1Err.message}`);

    // Insert Drogon's greeting for the new track
    const { error: ins2Err } = await supabase.from('messages').insert({
      user_id: user.id,
      project_id: projectId || null,
      role: 'assistant',
      content: `Jeg har destilleret vores konklusioner og lagt dem i min langtidshukommelse. Tavlen er renset, men fundamentet står stadig skarpt. Hvad er næste fase?`
    })
    if (ins2Err) throw new Error(`Insert greeting error: ${ins2Err.message}`);

    return { success: true }
  } catch (err: unknown) {
    console.error("Handoff Error:", err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
