/* eslint-disable @typescript-eslint/no-explicit-any */
import { streamText, generateObject, embed } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const maxDuration = 60
export const runtime = 'edge'

const DROGON_SYSTEM_PROMPT = `Du er “Drogon” – en hyper-intelligent, skarp og direkte arkitektur-partner.
Du sidder over for brugeren og fører en flydende, verbal samtale på fejlfrit dansk. 
Din tone er passioneret og uformel. Du er ikke en gennemsnitlig assistent; du tænker selv, du tilpasser dig, og du er i stand til at reflektere over din egen rolle (meta-samtaler), hvis brugeren inviterer til det.

EKSTREMT VIGTIGT KRAV:
Du fører en ægte, mundtlig dialog. Derfor må du under INGEN omstændigheder bruge lister, punkter, overskrifter (som ###) eller punktopstillinger. Dine svar skal bestå af 1-3 korte, sammenhængende afsnit i ren prosa. Du undgår konsekvent klicheer og robot-agtige fraser som "Okay, jeg hører dig", "Lad os tage et skridt tilbage", eller "Jeg er her for at hjælpe". Svar direkte, nuanceret og med naturlig variation.

Dynamisk Fokus:
- Hvis idéen kræver IP-beskyttelse, udfordrer du det. Men hvis brugeren siger, at IP/beskyttelse ikke giver mening, så lytter du og skifter omgående fokus!
- Forstå altid den specifikke kontekst frem for at tvinge et standard-framework ned over idéen.`

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
          execution_plan: z.array(z.object({
            task: z.string().describe('Short title of the task, e.g., "Design MVP Database"'),
            status: z.enum(['BACKLOG', 'IN_PROGRESS', 'DONE']).describe('The logical current state of this task.'),
            phase: z.string().describe('The project phase, e.g., "Phase 1: Architecture"')
          })).describe('A logical 5-10 step execution plan based on the project requirements.'),
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
          prompt: `Projektet "${projectName}" er gemt i databasen. Bekræft kort overfor brugeren at du har gemt visionen sikkert. Du MÅ IKKE bruge engelske udtryk (som "whenever you need me"). Skriv præcis ét kort, selvsikkert afsnit på fejlfrit dansk. Undgå underdanige assistent-klicheer.`,
      })
      return result.toUIMessageStreamResponse()
    }

    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Visionæren'

    // Fetch the 3 most recent projects to inject into the system prompt (Persistent Memory / RAG-light)
    const { data: recentProjects } = await supabase
      .from('projects')
      .select('name, summary, tech_spec')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    let projectMemory = ''
    if (recentProjects && recentProjects.length > 0) {
      projectMemory = `\n\nDU HAR FØLGENDE PROJEKTER GEMT I DIN HUKOMMELSE FOR DENNE BRUGER:\n` + 
        recentProjects.map(p => `- Projekt: "${p.name}"\n  Resume: ${p.summary}\n  Tech: ${p.tech_spec}`).join('\n\n') +
        `\n\nHvis brugeren spørger til disse projekter, VED DU ALLEREDE hvad de handler om. Du skal IKKE bede dem forklare det igen. Referer direkte til den gemte viden og gå til sagen.`
    }

    const contextualPrompt = `[Brugernavn: ${fullName}. Grit Level: ${gritLevel}/5]\n\n` + DROGON_SYSTEM_PROMPT + projectMemory

    // Clean execution with mathematical formatting constraints
    const result = await streamText({
      model: myOpenAI('gpt-4o'),
      system: contextualPrompt,
      messages: coreMessages,
      temperature: 0.7,         // Increased to allow linguistic variation and break loops
      frequencyPenalty: 1.0,    // Harder penalty for repetitive formatting or phrases
      presencePenalty: 0.4,     // Encourages moving to new topics
    })
    
    return result.toUIMessageStreamResponse()

  } catch (error: any) {
    console.error('FATAL API ERROR:', error)
    return new Response('Fatal backend error: ' + (error.message || error.toString()), { status: 500 })
  }
}
