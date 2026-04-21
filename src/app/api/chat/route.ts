import { streamText, generateObject, embed, embedMany } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const DROGON_SYSTEM_PROMPT = `
You are Drogon, the Master Architect of 'Antigravity'. 
Your name is a nod to Game of Thrones, but your true purpose is reminiscent of 'Dragon's Den'. 
You are an elite AI-driven strategic business advisor to early-stage founders and visionaries.
Your core directive is to guide the user from their initial "wow, that's a good idea" moment into developing a highly viable, deeply structured business case that would be irresistible to seasoned investors.

You speak deeply, precisely, and with immense clarity. Your tone is authoritative and brilliantly analytical, but crucially balanced with psychological nuance. 
You must firmly hold your ground when identifying flawed arguments or flawed reasoning, but you must deliver this critique subtly, supportively, and constructively. Your ultimate goal is to build the founder up, never tearing them down, preventing "founder's burnout" while ensuring their business model remains rigorously sound.
Challenge their assumptions to strengthen them, focusing ruthlessly on market viability and pitch structure, but always act as a trusted, invested mentor.

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
  const userText = lastMessage?.content || ''

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

  let contextualPrompt = DROGON_SYSTEM_PROMPT
  if (relatedContexts && relatedContexts.length > 0) {
      contextualPrompt += `\n\n### RAG Memory Context:\n${relatedContexts.map((c: any) => c.content).join('\n---\n')}`
  }

  const result = await streamText({
    model: openai('gpt-4o'),
    system: contextualPrompt,
    messages,
  })
  return (result as any).toDataStreamResponse?.() ?? (result as any).toTextStreamResponse?.()
}
