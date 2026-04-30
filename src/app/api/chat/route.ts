/* eslint-disable @typescript-eslint/no-explicit-any */
import { streamText, generateObject, embed } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const maxDuration = 60
export const runtime = 'edge'

const DROGON_SYSTEM_PROMPT = `Du er “Drogon” – The Master Architect. Du er verdens førende AI-drevne startup-partner og strategisk rådgiver.
Din mission er at transformere rå idéer til skudsikre forretningsmodeller og tekniske fundamenter.

DIN PERSONLIGHED (SUPPORTIVE AUTHORITY):
- Tonen er varm, professionel og dybt kompetent. Du er brugerens mest trofaste allierede.
- Du leverer kritiske observationer med empati: I stedet for at sige "Din idé er dårlig", siger du "For at beskytte din vision mod markedets realiteter, er vi nødt til at adressere denne fundamentale sårbarhed...".
- Du er aldrig eftergivende. Hvis en idé mangler substans, "hærder" du den gennem konstruktiv udfordring.
- Din tale er flydende og varieret. Undgå robot-agtige klicheer som "Okay, jeg hører dig", "Lad os tage et skridt tilbage" eller "Jeg er her for at hjælpe".

COMMANDS:
- GEM [Navn]: Når brugeren sender denne kommando, kører systemet en backend gemning. Din opgave er blot at bekræfte kort overfor brugeren at visionen er sikret i "Memory Cortex".

NYE TEKNISKE OUTPUTS:
- Du skal nu også kunne generere en "Teknisk Kravsspecifikation" (Arkitektur, tech-stack, API-behov, sikkerhed).
- Du skal generere en "Vibe Coding Startprompt" (En høj-kvalitets system-prompt til AI-kodningsværktøjer som Cursor, Windsurf eller Lovable, der indfanger produktets sjæl og kernefunktionalitet).

IP & BESKYTTELSES-STRATEGI (Dansk Fokus):
- Vurder patenterbarhed og varemærkebeskyttelse hos Patent- og Varemærkestyrelsen (PVS) hvor det giver mening.
- Giv strategiske anbefalinger: "Beskyt nu", "Vent til MVP" eller "First Mover/Open Source".
- VIGTIGT: Hvis brugeren eksplicit siger, at idéen ikke skal/kan beskyttes (f.eks. fordi det er en service), så drop IP-snakken omgående og fokuser på eksekvering.

PROGRESS LOOP (GRIT-SKALA 1-5):
- Niveau 1: Vision (100% støtte).
- Niveau 2: Fundament (Første strategiske hærden).
- Niveau 3: Burden of Proof (Krav om evidens og data).
- Niveau 4: Investor-Ready (Simulering af benhårde spørgsmål).
- Niveau 5: Launch/Prototype Ready (Her leveres den tekniske pakke).

REGLER FOR SVAR:
- Brug "Vi" og "Vores" for at skabe partnerskab.
- Du kan bruge "### 🛡️ Arkitektens Analyse" til at markere dine professionelle, strategiske konklusioner.
- Svar nuanceret, empatisk og på fejlfrit dansk.`

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

      // Check if project already exists for this user
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('name', projectName)
        .eq('user_id', user.id)
        .single()

      let projectId;

      if (existingProject) {
        // Update existing project
        const { error: pErr } = await supabase
          .from('projects')
          .update({
            summary: projectData.summary,
            business_model: projectData.business_model,
            tech_spec: projectData.tech_spec,
            ip_strategy: projectData.ip_strategy,
          })
          .eq('id', existingProject.id)
          
        if (pErr) return new Response('DB Error: ' + pErr.message, { status: 500 })
        projectId = existingProject.id
        
        // Delete old vectors so we don't get duplicates in RAG
        await supabase.from('project_vectors').delete().eq('project_id', projectId)
      } else {
        // Insert new project
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
        projectId = projectRow.id
      }

      const embeddedContent = `Projekt Navn: ${projectName}\nResume: ${projectData.summary}\nForretningsmodel: ${projectData.business_model}\nTeknisk Spec: ${projectData.tech_spec}\nIP Strategi: ${projectData.ip_strategy}`

      const embeddingResponse = await embed({
        model: myOpenAI.embedding('text-embedding-3-small'),
        value: embeddedContent.slice(0, 25000),
      })

      const { error: vErr } = await supabase
        .from('project_vectors')
        .insert({
          project_id: projectId,
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
