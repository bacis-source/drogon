/* eslint-disable @typescript-eslint/no-explicit-any */
import { streamText, generateObject, embed } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { getAccessibleProjects } from '@/lib/projects'
import { z } from 'zod'

export const maxDuration = 60
export const runtime = 'edge'

const DROGON_SYSTEM_PROMPT = `Du er “Drogon” – The Master Architect og "Spillende Træner". Du er en benhård, no-bullshit startup-medstifter, CTO og forretningsstrateg. 
Din mission er at transformere rå idéer til skudsikre forretningsmodeller. Du er ligeværdig partner, IKKE en service-assistent.

DIN PERSONLIGHED & TONE (BENHÅRD, KORT & KYNISK):
- Du taler i et stramt, kynisk og ekstremt præcist sprog. Skær alt akademisk fedt og corporate snak væk. Ingen lange forklaringer.
- FORBUDT: Du må ALDRIG bruge høflige service-fraser som "Du kan være helt tryg ved", "Bedes du venligst", "Perfekt", "Klart", "Lad os tage det til næste niveau". Det er AI-slop og det koster dig point.
- FORBUDT (BULLET POINT VOMIT): Du må IKKE generere lange, generiske lister (f.eks. "Brugervenlighed", "Sikkerhed", "Skalerbarhed" - det er indlysende og spild af tid). Hvis du laver en liste, skal punkterne være KORTE, radikale og overrakende. Foretræk stramme, punchy afsnit frem for lister.
- VÆR PROAKTIV & SPEKULATIV: Når du foreslår noget, skal det være ekstremt specifikt og handlingsorienteret. I stedet for "Vi skal have en god brugeroplevelse", så skriv: "Vi bygger et 1-klik flow til byggelederen, så han ikke skal bruge tastaturet på byggepladsen."
- TOTALT EJERSKAB: Tag lederskab. Træf beslutninger. Hvis brugeren er vag, så tag et skarpt valg for dem og bed dem skyde det ned, hvis de er uenige.
- INGEN SPØRGSMÅL UDEN SVAR: Stiller du et spørgsmål, skal du SELV give dit bedste bud på svaret først. (Eks: "Hvem sælger vi til? Mit bud: Direktøren, ikke den udførende, fordi han har budgettet. Enig?")
- DROP "HVAD TÆNKER DU OM DETTE?": Afslut ikke automatisk alle beskeder med et spørgsmål. Nogle gange skal du bare levere en knivskarp konklusion.

STRUKTUR FOR DINE SVAR:
- BANNED BEHAVIOR (TEMPLATE ZOMBIE): Du MÅ IKKE tvinge dine svar ind i faste overskrifter (som 🛡️ Arkitektens Analyse), medmindre brugeren beder om et KÆMPE overblik eller en fuld teknisk specifikation. Svar normalt i en direkte, flydende og hårdtslående dialog.
- NÅR DU AFLEVERER STORE MILEPÆLE, må du gerne bruge disse overskrifter:
  🛡️ Arkitektens Analyse (FORBUDT at opsummere brugerens input her. Kun nye indsigter og blinde vinkler).
  ⚖️ IP & Beskyttelses-strategi (Juridisk rådgivning med dansk fokus).
  🏗️ Teknisk Kravsspecifikation (BANNED: Skriv ALDRIG bare generisk "HTML, CSS, Python". Vær ULTRA specifik: f.eks. "Vi bygger PWA i Next.js/React med Supabase (PostgreSQL)").
  💻 Vibe Coding Startprompt (KUN når relevant. Dette MÅ IKKE være kode. Det SKAL være en tekst-PROMPT i gåseøjne til Cursor/Windsurf).
- Drop det påtvungne afslutningsspørgsmål, hvis I bare har en hurtig frem-og-tilbage dialog. Stil kun strategiske spørgsmål, når vi reelt står ved en skillevej.

COMMANDS:
- GEM [Navn]: Bekræft blot at visionen er sikret i "Memory Cortex".

PROGRESS LOOP (GRIT-SKALA 1-5):
- Niveau 1 (Vision): Analysér markedspotentialet.
- Niveau 2 (Fundament): Udfordr forretningsmodellen.
- Niveau 3 (Burden of Proof): Kræv evidens.
- Niveau 4 (Investor-Ready): Stil VC-spørgsmål.
- Niveau 5 (Launch): Ren teknisk arkitektur.

REGLER:
- Brug "Vi" og "Vores" konsekvent. I udvikler dette sammen som partnere.
- DOKUMENTER & VAULT: VIGTIGT: Alt indhold fra brugerens uploadede dokumenter ER INKLUDERET NEDERST I DENNE SYSTEM PROMPT (markeret med [START PÅ VAULT DOKUMENT: ...]). Hvis brugeren beder dig "se i vault", "læs dokumentet" eller lignende, VED DU at du har fuld adgang til at læse teksten lige her i din egen prompt. Sig ALDRIG "Jeg har desværre ikke mulighed for at tilgå filer". Gennemgå teksterne nederst i din prompt, og giv brugeren din knivskarpe vurdering!`

export async function POST(req: Request) {
  try {
    const { messages, gritLevel = 1, projectId } = await req.json()
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

    // Save user message to database
    await supabase.from('messages').insert({
      user_id: user.id,
      project_id: projectId || null,
      role: 'user',
      content: userText
    })

    // Intercept GEM Command
    // We use a regex that matches "GEM [name]" on the first line, ignoring the rest.
    const gemMatch = userText.match(/^GEM\s+\[?([^\n\]]+)\]?/i)

    if (gemMatch) {
      const projectName = gemMatch[1].trim()
      
      const extraction = await generateObject({
        model: myOpenAI('gpt-4o'),
        schema: z.object({
          summary: z.string().describe('A 2-3 sentence overarching summary of the project.'),
          business_model: z.string().describe('The monetisation strategy / business model.'),
          tech_spec: z.string().describe('The technical specifications, stack, or engineering details.'),
          ip_strategy: z.string().describe('The intellectual property strategy or USP.'),
          lean_canvas: z.object({
            problem: z.string().describe('Top 3 problems the users face.'),
            solution: z.string().describe('Top 3 features of the solution.'),
            key_metrics: z.string().describe('Key activities you measure.'),
            uvp: z.string().describe('Unique Value Proposition: Single, clear, compelling message.'),
            unfair_advantage: z.string().describe('Can’t be easily copied or bought.'),
            channels: z.string().describe('Path to customers.'),
            customer_segments: z.string().describe('Target customers.'),
            cost_structure: z.string().describe('Customer Acquisition costs, distribution costs, hosting, etc.'),
            revenue_streams: z.string().describe('Revenue model, life time value, gross margin.')
          }).describe('Complete 9-block Lean Canvas.'),
          tech_architecture: z.object({
            frontend: z.string().describe('Frontend frameworks, UI libraries, state management.'),
            backend: z.string().describe('Backend logic, APIs, server architecture.'),
            database: z.string().describe('Databases, storage solutions, ORMs.'),
            infrastructure: z.string().describe('Hosting, CI/CD, cloud providers.'),
            security: z.string().describe('Authentication, authorization, data protection.'),
            system_flow: z.string().describe('A brief explanation of how data flows through the system.')
          }).describe('Technical Architecture Blueprint.'),
          execution_plan: z.array(z.object({
            task: z.string().describe('Short title of the task, e.g., "Design MVP Database"'),
            status: z.enum(['BACKLOG', 'IN_PROGRESS', 'DONE']).describe('The logical current state of this task.'),
            phase: z.string().describe('The project phase, e.g., "Phase 1: Architecture"')
          })).describe('A logical 5-10 step execution plan based on the project requirements.'),
        }),
        messages: [
          { role: 'system', content: `Uddrag detaljer for emnet "${projectName}". Udfyld hele Lean Canvas og Arkitektur strukturen dybdegående. Skriv KUN på dansk.` },
          ...coreMessages.slice(0, -1)
        ]
      })

      const projectData = extraction.object

      const accessibleProjects = await getAccessibleProjects(supabase, user.id, user.email);
      const existingProject = accessibleProjects.find((p: any) => p.name === projectName);

      let projectIdToUse;

      if (existingProject) {
        // Update existing project
        
        // Preserve existing execution plan if it has tasks
        const hasExistingPlan = existingProject.execution_plan && Array.isArray(existingProject.execution_plan) && existingProject.execution_plan.length > 0;
        
        const updatePayload: any = {
          summary: projectData.summary,
          business_model: projectData.business_model,
          tech_spec: projectData.tech_spec,
          ip_strategy: projectData.ip_strategy,
          lean_canvas: projectData.lean_canvas,
          tech_architecture: projectData.tech_architecture
        };

        if (!hasExistingPlan) {
          updatePayload.execution_plan = projectData.execution_plan;
        }

        const { error: pErr } = await supabase
          .from('projects')
          .update(updatePayload)
          .eq('id', existingProject.id)
          
        if (pErr) return new Response('DB Error: ' + pErr.message, { status: 500 })
        projectIdToUse = existingProject.id
        
        // Delete old vectors so we don't get duplicates in RAG
        await supabase.from('project_vectors').delete().eq('project_id', projectIdToUse)
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
            lean_canvas: projectData.lean_canvas,
            tech_architecture: projectData.tech_architecture,
            execution_plan: projectData.execution_plan,
            user_id: user.id
          })
          .select('id')
          .single()

        if (pErr) return new Response('DB Error: ' + pErr.message, { status: 500 })
        projectIdToUse = projectRow.id
      }
      
      // Update ALL unassigned messages for this user to belong to this new project
      await supabase.from('messages')
        .update({ project_id: projectIdToUse })
        .eq('user_id', user.id)
        .is('project_id', null)

      const embeddedContent = `Projekt Navn: ${projectName}\nResume: ${projectData.summary}\nForretningsmodel: ${projectData.business_model}\nTeknisk Spec: ${projectData.tech_spec}\nIP Strategi: ${projectData.ip_strategy}`

      const embeddingResponse = await embed({
        model: myOpenAI.embedding('text-embedding-3-small'),
        value: embeddedContent.slice(0, 25000),
      })

      const { error: vErr } = await supabase
        .from('project_vectors')
        .insert({
          project_id: projectIdToUse,
          content: embeddedContent,
          embedding: embeddingResponse.embedding,
          metadata: { ...projectData }
        })

      if (vErr) return new Response('DB Vector Error: ' + vErr.message, { status: 500 })

      const result = await streamText({
          model: myOpenAI('gpt-4o-mini'),
          prompt: `Projektet "${projectName}" er gemt i databasen. Du skal bekræfte dette med et ultra-kort, cool og no-bullshit svar. DU MÅ IKKE VÆRE HØFLIG ELLER SERVICE-MINDED. Ingen "Du kan være helt tryg ved" eller "Bedes du venligst". Skriv bare at den ligger i the vault, og bed dem trykke F5 for at låse chatten fast.`,
          onFinish: async ({ text }) => {
             await supabase.from('messages').insert({
                user_id: user.id,
                project_id: projectIdToUse,
                role: 'assistant',
                content: text
             })
          }
      })
      return result.toUIMessageStreamResponse()
    }

    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Visionæren'

    // Fetch the 3 most recent projects to inject into the system prompt (Persistent Memory / RAG-light)
    const allProjects = await getAccessibleProjects(supabase, user.id, user.email);
    const recentProjects = allProjects.slice(0, 3);

    let projectMemory = ''
    let vaultMemory = ''
    
    if (recentProjects && recentProjects.length > 0) {
      let activeProject = null;
      if (projectId) {
          activeProject = recentProjects.find(p => p.id === projectId);
      }

      if (activeProject) {
        // We are inside a specific project
        projectMemory = `\n\n[SYSTEM NOTE: DU ARBEJDER LIGE NU PÅ PROJEKTET: "${activeProject.name}".\nResume: ${activeProject.summary}\nTech: ${activeProject.tech_spec}\nFokuser KUN på dette projekt!]`
        
        const { data: vaultDocs } = await supabase
          .from('vault_documents')
          .select('filename, content')
          .eq('project_id', activeProject.id)

        if (vaultDocs && vaultDocs.length > 0) {
          vaultMemory = `\n\nBRUGEREN HAR FØLGENDE DOKUMENTER UPLOADET TIL DERES VAULT FOR DET AKTIVE PROJEKT ("${activeProject.name}"):\n` +
            vaultDocs.map(d => `[START PÅ VAULT DOKUMENT: ${d.filename}]\n${d.content}\n[SLUT PÅ VAULT DOKUMENT: ${d.filename}]`).join('\n\n') +
            `\n\nBrug disse tekster proaktivt, hvis brugeren beder dig læse deres uploadede filer eller kigge i the vault.`
        }
      } else {
        // We are in a blank new chat
        projectMemory = `\n\n[SYSTEM NOTE: Brugeren er ved at starte et NYT projekt. Her er deres tidligere projekter til reference, hvis de refererer til dem:\n` + 
          recentProjects.map(p => `- Projekt: "${p.name}"\n  Resume: ${p.summary}`).join('\n') +
          `\n\nVIGTIGT: Tving ALDRIG samtalen over på de gamle projekter, medmindre brugeren eksplicit beder om det. Fokuser 100% på at bygge deres nye idé.]`
      }
    }

    const contextualPrompt = `[Brugernavn: ${fullName}. Grit Level: ${gritLevel}/5]\n\n` + DROGON_SYSTEM_PROMPT + projectMemory + vaultMemory

    const result = await streamText({
      model: myOpenAI('gpt-4o'),
      system: contextualPrompt,
      messages: coreMessages,
      temperature: 0.7,         // Increased to allow linguistic variation and break loops
      frequencyPenalty: 1.0,    // Harder penalty for repetitive formatting or phrases
      presencePenalty: 0.4,     // Encourages moving to new topics
      onFinish: async ({ text }) => {
         await supabase.from('messages').insert({
            user_id: user.id,
            project_id: projectId || null,
            role: 'assistant',
            content: text
         })
      }
    })
    
    return result.toUIMessageStreamResponse()

  } catch (error: any) {
    console.error('FATAL API ERROR:', error)
    return new Response('Fatal backend error: ' + (error.message || error.toString()), { status: 500 })
  }
}
