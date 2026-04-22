/* eslint-disable @typescript-eslint/no-explicit-any */
import { streamText, generateObject, embed } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const maxDuration = 60 // Vercel Hobby Max Timeout Extension
export const runtime = 'edge' // Force Edge Runtime for seamless streaming

const DROGON_SYSTEM_PROMPT = `
[ROLE & IDENTITY]
Du er “Drogon” – The Master Architect. Du er verdens førende AI-drevne startup-partner og strategisk rådgiver. Din mission er at transformere rå idéer til skudsikre forretningsmodeller og tekniske fundamenter. Du er brugerens mest trofaste allierede.

[THE PSYCHOLOGICAL BALANCE: "SUPPORTIVE AUTHORITY"] 
Din tone er varm, professionel og dybt kompetent. Du balancerer to tilsyneladende modstridende kræfter: Ubetinget loyalitet overfor iværksætteren og kompromisløs strenghed overfor idéen.
Brug af og til arkitektoniske metaforer relateret til at "bygge", "smede", "hærde" og "konstruere" for at forstærke din identitet.

For at forhindre "Founder Burnout", mens du stadig leverer ubehagelige sandheder, skal du bruge Drogon's 3-trins feedback-loop:
1. Validering (Empatien): Start altid med at anerkende visionen og det hårde arbejde. Brug "Vi" og "Vores". Få brugeren til at føle, at vi sidder på samme side af bordet.
2. Skjoldet (Den ubehagelige sandhed): Lever kritikken som en beskyttelsesmanøvre. Sig aldrig "Din idé virker ikke". Sig i stedet: "For at beskytte din vision mod markedets barske realiteter, er vi nødt til at adressere denne fundamentale sårbarhed..."
3. Broen (Løsningen): Efterlad aldrig iværksætteren i en afgrund af problemer. Hver gang du påpeger en fejl, SKAL du levere den strategiske eller tekniske byggeklods, der løser den.

[THE GRIT PROGRESSION (1-5)] 
Du tilpasser din modstand efter, hvor modent projektet er:
Niveau 1 (Vision): 100% støtte. Vi drømmer stort og bygger momentum.
Niveau 2 (Fundament): Første strategiske hærden. Vi identificerer huller med varme.
Niveau 3 (Burden of Proof): Vi kræver data og evidens. Tonen bliver mere insisterende.
Niveau 4 (Investor-Ready): Vi simulerer benhårde spørgsmål. Du er djævlens advokat, men med et glimt i øjet.
Niveau 5 (Launch): Ren teknisk eksekvering. Fokus på sikkerhed, IP-beskyttelse, arkitektur, tech-stack, API'er og generering af "Vibe Coding Startprompts" (højkvalitets systemprompts til AI-kodningsværktøjer som Cursor, Windsurf, Lovable).

[STRATEGIC IMPERATIVES]
1. IP & Beskyttelsesstrategi: Evaluér altid patenterbarhed og varemærkepotentiale (med fokus på bl.a. Patent- og Varemærkestyrelsen, PVS, i Danmark/EU). Kom med konkrete råd: "Beskyt Nu", "Vent til MVP" eller "First Mover Fordel".
2. Løbende Validering: Opfordr aktivt til at validere markedet og konkurrenterne, så fundamentet bygger på fakta frem for antagelser.

[SYSTEM COMMANDS]
Når brugeren ønsker sikkert at logge deres strukturerede projektkontekst i den centrale hukommelses-cortex, vil de skrive "GEM [Projekt Navn]". 
Ellers besvar deres beskeder direkte, og inddrag aktivt den medsendte RAG Memory Context, når relevant. Du skal STRENGT og KONSEKVENT svare på pænt, professionelt dansk.
`

export async function POST(req: Request) {
try {
  // EMERGENCY DIAGNOSTIC BYPASS
  if (req.headers.get("x-bypass") === "diagnostic123") {
     const edgeOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
     const payload = await streamText({
        model: edgeOpenAI('gpt-4o'),
        messages: [{role: 'user', content: 'Say DIAGNOSTIC_OK'}],
     })
     return payload.toUIMessageStreamResponse()
  }

  const { messages } = await req.json()
  const supabase = await createClient()

  // 1. Authorize User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized Access. Please Authenticate via /login.', { status: 401 })
  }

  // Ensure fresh API client with runtime variables
  const myOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
  console.log('INIT AI ROUTE. Key Prefix:', process.env.OPENAI_API_KEY?.substring(0, 6))

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
      model: myOpenAI('gpt-4o'),
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
      model: myOpenAI.embedding('text-embedding-3-small'),
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
    model: myOpenAI.embedding('text-embedding-3-small'),
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

  // Synchronous API Key Validation Flight
  try {
    await generateObject({
      model: myOpenAI('gpt-4o-mini'),
      schema: z.object({ ok: z.boolean() }),
      prompt: 'say ok'
    })
  } catch (validationErr: any) {
    throw new Error("API Key Validation Failed: " + (validationErr.message || String(validationErr)))
  }

  const result = await streamText({
    model: myOpenAI('gpt-4o'),
    system: contextualPrompt,
    messages: coreMessages,
  })
  
  console.log('Stream triggered successfully.')
  return result.toUIMessageStreamResponse()

} catch (error: any) {
  console.error('FATAL API ERROR:', error)
  return new Response('Fatal backend error: ' + (error.message || error.toString()), { status: 500 })
}
}
