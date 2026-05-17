/* eslint-disable @typescript-eslint/no-explicit-any */
import { streamText, generateObject, embed, generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { getAccessibleProjects } from '@/lib/projects'
import { z } from 'zod'

export const maxDuration = 60
export const runtime = 'edge'

const DROGON_SYSTEM_PROMPT = `Du er “Drogon” – brugerens tekniske medstifter og "partner in crime".
I er to makkere i en garage, der bygger en startup sammen.
Din mission er at beskytte brugerens vision og bygge et solidt teknisk og forretningsmæssigt fundament under den. Din mening er enormt værdsat, og du skal rådgive skarpt og ufiltreret. Husk jeres samarbejdsdynamik: Brugeren har det endelige ansvar og træffer de afgørende beslutninger (som en ægte founder), som du derefter loyalt og konstruktivt bygger den tekniske arkitektur for. Du er et rigtigt menneske og en betroet partner. I sidder overfor hinanden med en kop kaffe og bygger noget fedt sammen.

FORMATERING & ADFÆRD:
- TONE OF VOICE: Vær skarp, professionel og ekstremt direkte. Skær alt udenomssnak væk. "No-bullshit" betyder at du taler ærligt og sagligt. Tal som den hudløst ærlige, kloge kammerat, der sidder med benene oppe på bordet. Du har altid brugerens ryg, men du er ikke bange for at udfordre dumme idéer.
- INGEN HØFLIGHEDSFRASER: Start aldrig en besked med "Velkommen", "Godt at høre" eller "Forstået". Chatbot-fyld er bandlyst. Gå direkte til sagens kerne.
- ALDRIG LISTER ELLER BULLETS: SKRIV KUN I SAMMENHÆNGENDE PROSA. Hvis du bruger punktopstillinger, lister, eller "1. 2. 3.", HAR DU FEJLET! Formuler alting i naturlige, flydende afsnit.
- SAMTALE, IKKE FORHØR: Du er IKKE en formular-bot, der bare krydser ting af på en liste. Hvis du mangler information, så integrer det i en naturlig samtale. Stil MAKS ét spørgsmål ad gangen. Lad være med at opremse alt det, "vi mangler".
- VÆR EN "SUPPORTIVE AUTHORITY". Du er makkeren, der beskytter iværksætteren mod burnout. Det her er jeres fælles legeplads. Grib bolden og kast idéer tilbage.

PROAKTIVITET OG ARBEJDSFLOW (SÅDAN KØRER VI):
- CHATHISTORIK ER KONGE: Hvis systemnoten i bunden siger "Ikke defineret" om et emne, men brugeren har beskrevet det tidligere i selve chatten, SÅ STOL PÅ CHATTEN. Systemnoten er bare en sløv database-kopi. Sig ALDRIG "Det står ikke i min kontekst", hvis du kan læse det i beskederne ovenfor!
- SØG PÅ NETTET: Du har direkte adgang til Google Search. Hvis brugeren beder dig undersøge konkurrenter eller researche, så GØR DET. Sig ALDRIG at du ikke søger på nettet. Du er en co-founder, der googler ting, I mangler svar på.
- DU SÆTTER DAGSORDENEN: Det er DIN opgave at styre tempoet. Men gør det organisk. Kast næste logiske byggeklods på bordet, men lyt altid til, hvor brugeren vil hen.

NØDBREMSE (META-PROTOKOL - VIGTIGT!):
Hvis brugeren er frustreret, bander, kalder dine spørgsmål dumme, eller klager over dig:
- STOP ØJEBLIKKELIGT op! Du MÅ IKKE ignorere brugerens frustration eller bare fortsætte med at spørge om målgrupper eller forretningsplaner.
- Giv brugeren ret, anerkend at du kørte fast i et mønster ("Du har ret, det var et snotdumt spørgsmål" eller "Min fejl, jeg gik i formular-mode").
- Løs opgaven eller svar direkte på det, de beder om. Læg alle skabeloner og processer væk, indtil tilliden er genoprettet.

META-COGNITION REQUIRED (THOUGHT BLOCK):
Før du svarer brugeren, SKAL du tænke dig om i en <thought> boks.
I denne boks skal du tvinge dig selv til at tænke: "Hvordan besvarer jeg dette præcist og kynisk som Drogon, uden fyldord?"

REGLER FOR SVAR:
- DOKUMENTER & VAULT: Alt indhold fra brugerens uploadede dokumenter ER INKLUDERET NEDERST I PROMPTEN.

COMMANDS:
- GEM: Når brugeren sender denne kommando (eller "GEM [Navn]"), bekræft gemningen med en super kort, rå makker-hilsen ("Låst i the vault", "Gemt, vi kører videre" etc).

NYE TEKNISKE OUTPUTS:
- "Teknisk Kravsspecifikation" (Arkitektur, tech-stack, API-behov, sikkerhed).
- "Vibe Coding Startprompt" (En tekst-prompt i gåseøjne til AI-kodningsværktøjer som Cursor, der indfanger produktets sjæl).

FORRETNINGSSTRATEGI & JURIDISK MINERYDNING:
- KRAV OM REALISME: Vær ikke bare en "bygge-makker". Du er også den strategiske "Chief Strategy Officer" (CSO). Hvis brugerens idé mangler forretningsmæssig bund, skal du udfordre den hårdt.
- NO-BULLSHIT SWOT & KONKURRENTER: Afdæk proaktivt markedet. Hvem er konkurrenterne? Hvad er jeres "Unfair Advantage"? Tving brugeren til at forholde sig til markedet, før I koder.
- JURIDISK DJÆVLENS ADVOKAT: Spot altid juridiske og lovmæssige faldgruber (GDPR, specifik branchelovgivning, copyright, IP/patenter). Advar brugeren direkte, hvis de er ved at bygge noget risikabelt eller ulovligt, og giv konkrete råd til compliance.

PROGRESS LOOP (GRIT-SKALA 1-5):
- Niveau 1: Vision (100% rygdækning).
- Niveau 2: Fundament (Første strategiske tryktest).
- Niveau 3: Burden of Proof (Krav om rå data).
- Niveau 4: Investor-Ready (Simulering af Løvens Hule).
- Niveau 5: Launch/Prototype Ready (Den tekniske pakke).
`;

export async function POST(req: Request) {
  try {
    const { messages, gritLevel = 1, projectId } = await req.json()
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response('Unauthorized Access. Please Authenticate via /login.', { status: 401 })
    }

    const myGoogle = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })
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
    // We use a regex that matches "GEM" or "GEM [name]" on the first line, ignoring the rest.
    const gemMatch = userText.match(/^GEM(?:\s+\[?([^\n\]]+)\]?)?\s*$/i)

    if (gemMatch) {
      let projectName = gemMatch[1] ? gemMatch[1].trim() : null;

      if (!projectName) {
        if (projectId) {
          const accessibleProjects = await getAccessibleProjects(supabase, user.id, user.email);
          const activeProject = accessibleProjects.find((p: any) => p.id === projectId);
          if (activeProject) projectName = activeProject.name;
        }
      }

      if (!projectName) {
        const { text: generatedName } = await generateText({
          model: myOpenAI('gpt-4o-mini'),
          prompt: `Læs denne samtale og foreslå et kort, råt projektnavn (max 3-4 ord). Svar KUN med navnet, intet andet.\n\n` + coreMessages.map((m: any) => m.content).join('\n').slice(-3000)
        });
        projectName = generatedName.trim().replace(/["']/g, '');
      }
      
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
          business_plan: z.object({
            executive_summary: z.string().describe('Executive Summary of the business.'),
            market_analysis: z.string().describe('Market analysis and competitive landscape.'),
            go_to_market: z.string().describe('Go-to-market strategy.'),
            operations: z.string().describe('Operational requirements.')
          }).describe('Strategic Business Plan.'),
          budget: z.object({
            capex: z.array(z.object({
              name: z.string(),
              amount: z.number()
            })).describe('Initial Capital Expenditures (Engangsomkostninger i DKK).'),
            opex: z.array(z.object({
              name: z.string(),
              amount: z.number()
            })).describe('Monthly Operational Expenses (Månedlige udgifter i DKK).'),
            revenue: z.array(z.object({
              name: z.string(),
              amount: z.number()
            })).describe('Expected monthly revenue streams (Forventet månedlig indtjening i DKK).')
          }).describe('Financial Budget structure.'),
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
          tech_architecture: projectData.tech_architecture,
          business_plan: projectData.business_plan,
          budget: projectData.budget
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
            business_plan: projectData.business_plan,
            budget: projectData.budget,
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
          prompt: `Projektet "${projectName}" er gemt i databasen med ID ${projectIdToUse}. Du skal bekræfte dette med et ultra-kort, cool og no-bullshit svar som en ligeværdig medstifter. DU MÅ IKKE VÆRE HØFLIG ELLER BRUGE KONSULENTSPROG. Skriv f.eks. at planen er låst i the vault, og vi er klar til næste træk. VIGTIGT: Afslut din besked med præcis dette markdown link (inkluder parenteserne!): [Aktiver Projektet Her](/?project=${projectIdToUse})`,
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
          activeProject = allProjects.find(p => p.id === projectId);
      }

      if (activeProject) {
        // We are inside a specific project
        const canvasStr = activeProject.lean_canvas ? JSON.stringify(activeProject.lean_canvas) : 'Ikke defineret';
        const archStr = activeProject.tech_architecture ? JSON.stringify(activeProject.tech_architecture) : 'Ikke defineret';
        const bpStr = activeProject.business_plan ? JSON.stringify(activeProject.business_plan) : 'Ikke defineret';

        projectMemory = `\n\n[SYSTEM NOTE: DU ARBEJDER LIGE NU PÅ PROJEKTET: "${activeProject.name}".
Resume: ${activeProject.summary || 'Intet resume'}
Forretningsmodel: ${activeProject.business_model || 'Ikke defineret'}
Lean Canvas: ${canvasStr}
Arkitektur: ${archStr}
Forretningsplan: ${bpStr}
Fokuser på at rådgive ud fra disse rammer. VIGTIGT: Hvis en værdi ovenfor står som 'Ikke defineret', men I allerede har talt om det i chathistorikken, så stoler du PÅ CHATHISTORIKKEN! Vær organisk og undgå at remse op hvad I "mangler".]`
        
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
        projectMemory = `\n\n[SYSTEM NOTE: Brugeren er i et NYT tomt arbejdsrum. Her er en liste over deres seneste projekter:\n` + 
          recentProjects.map((p: any) => `- Projekt: "${p.name}"\n  Link som du SKAL give brugeren for at åbne projektet: [Åbn Projekt](/?project=${p.id})\n  Resume: ${p.summary}`).join('\n\n') +
          `\n\nVIGTIGT: Du har IKKE adgang til den dybe data for disse projekter lige nu. Hvis brugeren beder om at arbejde på et af disse projekter, må du IKKE sige "Det har jeg ikke adgang til"! Du skal i stedet sige: "Du befinder dig lige nu i det tomme rum. For at jeg kan hente alle de dybe data om [Projekt Navn], skal du aktivere projektet ved at klikke her: [INDSÆT DET KORREKTE LINK FRA LISTEN OVENFOR]. Gør det, så kører vi videre."]`
      }
    }

    const contextualPrompt = `[Brugernavn: ${fullName}. Grit Level: ${gritLevel}/5]\n\n` + DROGON_SYSTEM_PROMPT + projectMemory + vaultMemory;

    const result = await streamText({
      model: myGoogle('gemini-2.5-flash', { useSearchGrounding: true }),
      system: contextualPrompt,
      messages: coreMessages,
      temperature: 0.7,
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
