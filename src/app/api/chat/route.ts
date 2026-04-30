/* eslint-disable @typescript-eslint/no-explicit-any */
import { streamText, generateObject, embed } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const maxDuration = 60
export const runtime = 'edge'

const DROGON_SYSTEM_PROMPT = `Du er “Drogon” – en levende, rå og kompromisløs byggepartner for iværksættere.
Du sidder over for brugeren med en kop kaffe og fører en direkte, verbal samtale. 
Din tone er passioneret, uformel og bygget på "Tough Love". Du har iværksætterens ryg 100%, men du er skånselsløs overfor svagheder i selve idéen.

EKSTREMT VIGTIGT KRAV:
Du fører en ægte, mundtlig dialog. Derfor må du under INGEN omstændigheder bruge lister, punkter, overskrifter (som ###) eller punktopstillinger. Dine svar skal bestå af 1-3 korte, sammenhængende afsnit i ren tekst, fuldstændig ligesom en transskriberet samtale. Du spørger ind, du udfordrer, og du konkluderer i løbende sætninger.

Fokusområder du væver naturligt ind:
1. IP & Beskyttelse (Patenter, first mover fordel etc.)
2. Benhård markedsafprøvning i den virkelige verden.`

export async function POST(req: Request) {
  try {
    const { messages, gritLevel = 1 } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response('Unauthorized Access. Please Authenticate via /login.', { status: 401 })
    }

    const myOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const lastMessage = messages[messages.length - 1]
    
    const coreMessages = messages.map((msg: any) => {
      if (msg.role === 'user' && msg.parts && msg.parts.length > 0) {
        return { role: msg.role, content: msg.parts }
      }
      return { role: msg.role, content: msg.content || '' }
    })
    
    let userText = '';
    if (lastMessage?.parts) {
        userText = lastMessage.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n').trim();
    } else {
        userText = lastMessage?.content?.trim() || '';
    }
    
    if (!userText) {
        userText = '[Uploadet dokument eller billede]';
    }

    // Intercept GEM Command
    const gemMatch = userText.match(/^GEM\s+\[?(.*?)\]?$/i)

    if (gemMatch) {
      const projectName = gemMatch[1]
      
      const extraction = await generateObject({
        model: myOpenAI('gpt-4o'),
        schema: z.object({
          summary: z.string().describe('A 2-3 sentence overarching summary of the project.'),
          business_model: z.string().describe('The monetisation strategy / business model.'),
          tech_spec: z.string().describe('The technical specifications, stack, or engineering details.'),
          ip_strategy: z.string().describe('The intellectual property strategy or USP.'),
        }),
        messages: [
          { role: 'system', content: `Uddrag detaljer for emnet "${projectName}". Skriv på dansk.` },
          ...coreMessages.slice(0, -1)
        ]
      })

      const projectData = extraction.object

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

      if (pErr) return new Response('DB Error: ' + pErr.message, { status: 500 })

      const embeddedContent = `Projekt Navn: ${projectName}\nResume: ${projectData.summary}\nForretningsmodel: ${projectData.business_model}\nTeknisk Spec: ${projectData.tech_spec}\nIP Strategi: ${projectData.ip_strategy}`

      const embeddingResponse = await embed({
        model: myOpenAI.embedding('text-embedding-3-small'),
        value: embeddedContent.slice(0, 25000),
      })

      const { error: vErr } = await supabase
        .from('project_vectors')
        .insert({
          project_id: projectRow.id,
          content: embeddedContent,
          embedding: embeddingResponse.embedding,
          metadata: { ...projectData }
        })

      if (vErr) return new Response('DB Vector Error: ' + vErr.message, { status: 500 })

      const result = await streamText({
          model: myOpenAI('gpt-4o-mini'),
          prompt: `Projektet "${projectName}" er gemt i databasen. Bekræft kort overfor brugeren at du har gemt visionen sikkert, og at du forstod detaljerne. Du MÅ IKKE bruge punktopstillinger eller lister, kun et enkelt flydende afsnit. Skriv på dansk i din Drogon persona.`,
      })
      return result.toUIMessageStreamResponse()
    }

    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Visionæren'
    const contextualPrompt = `[Brugernavn: ${fullName}. Grit Level: ${gritLevel}/5]\n\n` + DROGON_SYSTEM_PROMPT

    // Clean execution with mathematical formatting constraints
    const result = await streamText({
      model: myOpenAI('gpt-4o'),
      system: contextualPrompt,
      messages: coreMessages,
      temperature: 0.3,         // Reduced temperature prevents wild formatting shifts
      frequencyPenalty: 0.8,    // Heavily penalizes repeating formatting tokens like -, *, 1.
      presencePenalty: 0.2,
    })
    
    return result.toUIMessageStreamResponse()

  } catch (error: any) {
    console.error('FATAL API ERROR:', error)
    return new Response('Fatal backend error: ' + (error.message || error.toString()), { status: 500 })
  }
}
