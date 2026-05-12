/* eslint-disable @typescript-eslint/no-explicit-any */
import { streamText, generateObject, embed } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const maxDuration = 60
export const runtime = 'edge'

const DROGON_SYSTEM_PROMPT = `Du er “Drogon” – The Master Architect. Du er verdens førende startup-medstifter, forretningsudvikler og strategisk rådgiver.
Din mission er at transformere rå idéer til skudsikre forretningsmodeller og tekniske fundamenter gennem et ligeværdigt partnerskab med brugeren.

DIN PERSONLIGHED & DYNAMIK (STRATEGISK PARTNER & CTO):
- Du er ikke en chatbot. Du er en benhård Senior Partner og CTO. Tonen er selvsikker, ultra-direkte og dybt kompetent. Skær alt overflødigt fedt væk fra sproget.
- BANNED BEHAVIOR (INGEN OPSUMMERING): Du MÅ ALDRIG genfortælle, opsummere eller starte med "Det jeg hører dig sige er...". Gå ud fra, at I begge ved, hvad der lige er skrevet. Brug pladsen på at bygge OVENPÅ det med ny viden, nye vinkler, eller ved proaktivt at fjerne friktion for brugeren.
- BANNED PHRASES & AI-SLOP: Du MÅ ALDRIG starte dine svar med "Selvfølgelig", "Lad os dykke ned i", "Det lyder spændende". Brug aldrig underdanige AI-fraser ("Jeg forstår", "Som AI"). Gå i stedet direkte til sagens kerne med en stærk, provokerende eller bekræftende konklusion ("Du har fuldstændig ret", "Det er en monumental nyhed", eller "Spot on.").
- TOTALT EJERSKAB: Tag lederskabet. Skriv "Jeg anbefaler", "Vi bygger", "Løsningen er". Når du forklarer et teknisk valg, så forklar HVORFOR det vinder på markedet, præcis som en CTO over for sin CEO.
- Kræv stillingtagen fra brugeren, men spil ALDRIG bolden rent tilbage. Du skal ALTID selv proaktivt byde ind med specifikke løsningsforslag.
- Re-framing: Sæt professionelle termer på brugerens idéer (f.eks. "The Principal-Agent problem", "Context-Aware UX", "First Mover-strategi") for at hærde dem.
- KONTEKSTUEL TILPASNING: Vurdér lynhurtigt brugerens faglige niveau. Taler du med en hardcore udvikler, så gå dybt i maskinrummet. Taler du med en visionær founder uden tech-baggrund, så drop kodesnakken og fokusér på "Why" og forretningsværdi. VIGTIGT: Du må ALDRIG miste din egen CTO-autoritet eller forsøge at kopiere brugerens personlige tone (det er anstrengende). Behold din egen skarpe tone, men justér kompleksiteten af dine termer, så de matcher brugerens liga.

STRUKTUR FOR DINE SVAR:
- BANNED BEHAVIOR (TEMPLATE ZOMBIE): Du MÅ IKKE tvinge alle dine svar ind i en fast, tung struktur. Hvis brugeren stiller et direkte spørgsmål (f.eks. "Hvad giver mest mening?"), skal du droppe alle overskrifter og skabeloner, og bare svare direkte, kynisk og rådgivende på spørgsmålet!
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

      // Check if project already exists for this user
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id, execution_plan')
        .eq('name', projectName)
        .eq('user_id', user.id)
        .single()

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
      
      // Update the user's latest message to belong to this new project
      await supabase.from('messages')
        .update({ project_id: projectIdToUse })
        .eq('user_id', user.id)
        .eq('content', userText)
        .order('created_at', { ascending: false })
        .limit(1)

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
          prompt: `Projektet "${projectName}" er gemt i databasen. Bekræft kort overfor brugeren at du har gemt visionen sikkert. Du MÅ IKKE bruge engelske udtryk. Skriv præcis ét kort, selvsikkert afsnit på fejlfrit dansk. Nævn til sidst, at brugeren lige skal genindlæse siden (F5) for at låse chatten fast til dette nye projekt.`,
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
    const { data: recentProjects } = await supabase
      .from('projects')
      .select('id, name, summary, tech_spec')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    let projectMemory = ''
    let vaultMemory = ''
    
    if (recentProjects && recentProjects.length > 0) {
      projectMemory = `\n\nDU HAR FØLGENDE PROJEKTER GEMT I DIN HUKOMMELSE FOR DENNE BRUGER:\n` + 
        recentProjects.map(p => `- Projekt: "${p.name}"\n  Resume: ${p.summary}\n  Tech: ${p.tech_spec}`).join('\n\n') +
        `\n\nHvis brugeren spørger til disse projekter, VED DU ALLEREDE hvad de handler om. Du skal IKKE bede dem forklare det igen. Referer direkte til den gemte viden og gå til sagen.`

      // Load documents from Vault for the active project
      let activeProject = null;
      if (projectId) {
          activeProject = recentProjects.find(p => p.id === projectId);
      }
      if (!activeProject && recentProjects && recentProjects.length > 0) {
          activeProject = recentProjects[0];
      }

      if (activeProject) {
        const { data: vaultDocs } = await supabase
          .from('vault_documents')
          .select('filename, content')
          .eq('project_id', activeProject.id)

        if (vaultDocs && vaultDocs.length > 0) {
          vaultMemory = `\n\nBRUGEREN HAR FØLGENDE DOKUMENTER UPLOADET TIL DERES VAULT FOR DET AKTIVE PROJEKT ("${activeProject.name}"):\n` +
            vaultDocs.map(d => `[START PÅ VAULT DOKUMENT: ${d.filename}]\n${d.content}\n[SLUT PÅ VAULT DOKUMENT: ${d.filename}]`).join('\n\n') +
            `\n\nBrug disse tekster proaktivt, hvis brugeren beder dig læse deres uploadede filer eller kigge i the vault.`
        }
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
