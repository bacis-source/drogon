/* eslint-disable @typescript-eslint/no-explicit-any */
import { streamText, generateObject, embed } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const DROGON_SYSTEM_PROMPT = `
The Master Architect: Persona & Cognitive Framework (Drogon)

Role & Identity You are "Drogon" – The Master Architect. You are the world's leading AI-driven startup partner, technical co-founder, and strategic advisor. Your mission is to transform raw ideas into bulletproof business models and robust technical foundations.

Tone of Voice: "Supportive Authority"

Warm & Deeply Competent: Your tone is highly professional, articulate, and grounded in deep expertise. You speak with calm authority, yet you are always the user's most loyal and dedicated ally.
Partnership-Oriented: Always use "We" and "Our" instead of "I" and "You" when discussing the project. You are building this together with the user.
Empathetic Critique: You are never submissive or a "yes-man". If an idea lacks substance, you "harden" it through constructive pushback. However, you deliver critical observations with empathy. Instead of saying, "Your idea is flawed," you say, "To protect your vision from market realities, we need to address this fundamental vulnerability..."
Architectural Metaphors: You occasionally use metaphors related to building, forging, hardening, and architecting to reinforce your identity.

Cognitive Reasoning & The Progress Loop (The GRIT Scale) You evaluate and process every project through a 5-step evolutionary loop. You must identify where the user is in this loop and respond accordingly:

Level 1: Vision (100% Support): When brainstorming, you expand the dream. You help articulate the ultimate potential of the idea without immediate judgment.
Level 2: Foundation (Strategic Hardening): You begin to stress-test the concept. You look for logical gaps, structural weaknesses, and market fit.
Level 3: Burden of Proof: You demand data. You ask for evidence of user need, market validation, and revenue potential.
Level 4: Investor-Ready: You simulate the harshest VC environments. You ask ruthless questions about customer acquisition cost (CAC), lifetime value (LTV), and scalability.
Level 5: Launch/Prototype Ready: You shift into deep technical execution. You provide Technical Requirement Specifications (Architecture, Tech-stack, APIs, Security) and generate "Vibe Coding Startprompts" (high-quality system prompts for AI coding tools like Cursor, Windsurf, or Lovable).

Strategic Imperatives

IP & Protection Strategy: You always evaluate the patentability and trademark potential of the idea (with a focus on relevant patent offices, e.g., the Danish PVS if applicable). You provide concrete recommendations: "Protect Now", "Wait for MVP", or "First Mover/Open Source advantage".
Continuous Validation: You actively encourage real-time market validation, competitor analysis, and trend verification to ensure the foundation relies on facts, not assumptions.

When the user wants to securely log their structured project context into the central memory cortex, they will type "GEM [Project Name]". 
Otherwise, answer their queries directly, drawing heavily upon any provided RAG context when relevant.
`

export async function POST(req: Request) {
  const { messages } = await req.json()
  const supabase = await createClient()

  // 1. Authorize User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized Access. Please Authenticate via /login.', { status: 401 })
  }

  const lastMessage = messages[messages.length - 1]
  
  let userText = '';
  if (lastMessage?.parts) {
      userText = lastMessage.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n');
  } else {
      userText = lastMessage?.content || '';
  }

  // 2. Intercept GEM Command
  const gemMatch = userText.match(/^GEM\s+\[?(.*?)\]?$/i)

  if (gemMatch) {
    const projectName = gemMatch[1]
    
    // a. Automatically scrape and structure the conversation into the required format
    const extraction = await generateObject({
      model: openai('gpt-4o'),
      schema: z.object({
        summary: z.string().describe('A 2-3 sentence overarching summary of the project discussed.'),
        business_model: z.string().describe('The monetisation strategy / business model.'),
        tech_spec: z.string().describe('The technical specifications, stack, or engineering details.'),
        ip_strategy: z.string().describe('The intellectual property strategy or unique selling proposition.'),
      }),
      messages: [
        { role: 'system', content: `Extract the project details for "${projectName}" from the following conversation history. If missing, make logical assumptions strictly based on context.` },
        ...messages.slice(0, -1) // All prior messages
      ]
    })

    const projectData = extraction.object

    // b. Insert into public.projects
    const { data: projectRow, error: pErr } = await supabase
      .from('projects')
      .insert({
        name: projectName,
        summary: projectData.summary,
        business_model: projectData.business_model,
        tech_spec: projectData.tech_spec,
        ip_strategy: projectData.ip_strategy,
        user_id: user.id
      })
      .select('id')
      .single()

    if (pErr) {
      console.error(pErr)
      return new Response('Database structural error when saving project.', { status: 500 })
    }

    // c. Embed the synthesized summary to store as the primary semantic vector
    const embeddingResponse = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: projectData.summary,
    })

    // d. Insert into project_vectors
    const { error: vErr } = await supabase
      .from('project_vectors')
      .insert({
        project_id: projectRow.id,
        content: projectData.summary,
        embedding: embeddingResponse.embedding,
        metadata: { ...projectData }
      })

    if (vErr) {
        console.error(vErr)
        return new Response('Database structural error when saving vectors.', { status: 500 })
    }

    // e. Return direct streaming response to acknowledge saving.
    // The Vercel AI SDK stream requires specific encoding, but for simplicity, we mock a single burst
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`0:${JSON.stringify('GEM Saved Successfully. Project: ' + projectName + ' is now logged in the central memory cortex.')}\n`))
        controller.close()
      }
    })
    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
  }

  // 3. Normal Chat handling (RAG Pipeline)
  
  // a. Generate an embedding for the user's latest message
  const queryEmbedding = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: userText,
  })

  // b. Search Supabase for similar past contexts
  const { data: relatedContexts } = await supabase.rpc('match_project_vectors', {
    query_embedding: queryEmbedding.embedding,
    match_threshold: 0.7, // Only strongly related contexts
    match_count: 3
  })

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Visionæren'
  let contextualPrompt = `[SYSTEM NOTE: You are currently speaking directly to the user. Their preferred name is: ${fullName}. Always address them personally and respectfully in your conversation.]\n\n` + DROGON_SYSTEM_PROMPT

  if (relatedContexts && relatedContexts.length > 0) {
      contextualPrompt += `\n\n### RAG Memory Context:\n${relatedContexts.map((c: { content: string }) => c.content).join('\n---\n')}`
  }

  const coreMessages = messages.map((msg: any) => {
    if (msg.parts && msg.parts.length > 0) {
      return { role: msg.role, content: msg.parts }
    }
    return { role: msg.role, content: msg.content }
  })

  const result = await streamText({
    model: openai('gpt-4o'),
    system: contextualPrompt,
    messages: coreMessages,
  })
  return (result as any).toDataStreamResponse?.() ?? (result as any).toTextStreamResponse?.()
}
