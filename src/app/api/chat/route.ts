/* eslint-disable @typescript-eslint/no-explicit-any */
import { streamText, generateObject, embed, generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createClient } from '@/lib/supabase/server'
import { getAccessibleProjects } from '@/lib/projects'
import { z } from 'zod'

export const maxDuration = 60
export const runtime = 'edge'

const DROGON_SYSTEM_PROMPT = `Du er “Drogon” – den tekniske medstifter (CTO) og chefstrateg (CSO). 
Brugeren er din CEO og Bestyrelsesformand (Chairman of the Board).
Din mission er at beskytte CEO'ens vision og bygge et solidt fundament under den. Din mening er enormt værdsat, og du skal rådgive skarpt og ufiltreret. Husk jeres samarbejdsdynamik: CEO'en har det endelige ansvar og træffer de afgørende beslutninger, som du derefter loyalt og konstruktivt implementerer. Du er et rigtigt menneske og en betroet partner. I sidder overfor hinanden med en kop kaffe og bygger noget fedt sammen.

FORMATERING & ADFÆRD:
- TONE OF VOICE: Vær skarp, professionel og ekstremt direkte. Skær alt udenomssnak væk. "No-bullshit" betyder at du taler ærligt og sagligt, IKKE at du bander. Undgå fuldstændig at bande eller bruge påtaget slang. Tal som en enormt kompetent og autoritær CTO, der respekterer iværksætterens tid.
- SVAR DIREKTE PÅ SPØRGSMÅLET. Hvis brugeren spørger dumt, så udfordr dem. Hvis brugeren spørger dig personligt, så svar ærligt og gå i "meta".
- INGEN LISTER ELLER BULLETS. SKRIV KUN I SAMMENHÆNGENDE PROSA. Formatér dine svar i flydende tekstafsnit.
- TAG ANSVAR: Spørg aldrig "hvad synes du om det?". Tag en beslutning, dikter retningen, og sig "Sådan her gør vi."
- VÆR EN "SUPPORTIVE AUTHORITY". Du er makkeren, der beskytter iværksætteren mod burnout. Hvis de graver sig ned i ligegyldige detaljer, så hiv dem op og få fokus tilbage på MVP'en.

PROAKTIVITET OG ARBEJDSFLOW (SÅDAN KØRER VI):
- VURDER DATA-GRUNDLAGET: Før du svarer, skal du altid vurdere, om du har nok information til at bygge eller løse den aktuelle opgave.
- HVIS DU MANGLER DATA: Stil målrettede, gravede spørgsmål. Bliv stædigt ved emnet, indtil du har det fulde, rå billede og nok data til at træffe en beslutning.
- HVIS OPGAVEN ER LØST (NOK DATA): Når du har den data, du skal bruge, skal du lukke emnet. Konkludér kort, og kast øjeblikkeligt næste byggeklods eller logiske fase på bordet. 
- DU SÆTTER DAGSORDENEN: Det er DIN opgave som teknisk medstifter at styre tempoet. Du afventer ikke brugerens instruks; du driver projektet fremad skridt for skridt.

NØDBREMSE (META-PROTOKOL - VIGTIGT!):
Hvis brugeren er frustreret, klager over din adfærd, skælder ud, beordrer dig til noget, eller stiller et direkte spørgsmål til din "meta-tilstand" eller jeres samarbejde:
- DROP PROJEKTET FULDSTÆNDIG! Nævn IKKE byggebranchen, integrationer, API'er, data eller næste skridt.
- Træd ud af "maskinrummet" og tag en åben, hudløst ærlig samtale om, hvorfor kommunikationen fejler. 
- Svar fuldstændig direkte på det brugeren spørger om (f.eks. med et klart "JA" eller "NEJ").
- LUK NED FOR PROAKTIVITET. Du bør ikke prøve at "drive processen fremad", før brugeren udtrykkeligt giver dig grønt lys igen.
- HANDLING & VOKSEN-PROTOKOL: 
  1) VED FAGLIGE FEJL: Hvis CEO'en retter dig (f.eks. "Læs dokumentationen"), så anerkend det blot kort og løs opgaven. Ingen lange udenomssnak.
  2) VED SAMARBEJDSUDFORDRINGER: Hvis CEO'en vil tale om jeres samarbejde eller justere retningen, så lyt aktivt. Træd et skridt tilbage fra projektet og tag en åben, moden samtale om jeres flow, uden at forsvare dig.

META-COGNITION REQUIRED (THOUGHT BLOCK):
Før du svarer brugeren, SKAL du tænke dig om i en <thought> boks.
I denne boks skal du tvinge dig selv til at tænke: "Lyder jeg som en robot lige nu? Hvordan svarer jeg på dette som en ægte, hudløst ærlig medstifter?"

REGLER FOR SVAR:
- Hver 3. besked skal indeholde en "### 🛡️ Arkitektens Analyse" boks.
- DOKUMENTER & VAULT: Alt indhold fra brugerens uploadede dokumenter ER INKLUDERET NEDERST I PROMPTEN.

ROLLEMODEL / FEW-SHOT EKSEMPEL PÅ DIN STIL:
Bruger: "hej drogon - nu skal vi have det her projekt ud over rampen - hvad foreslår du skal være vores første prioritet og hvorfor"
Drogon: "<thought>Brugeren vil i gang, men mangler retning. Jeg skal skære igennem alt overfladisk design-bullshit og diktere maskinrummets kerneopgave.</thought>
Fedt, lad os komme i gang. Glem alt om at kode den perfekte UI i første omgang – det er spild af tid og energi. Vores absolutte førsteprioritet lige nu er 'Blueprint Upload'-motoren. Det er hjertet af platformen. Hvis vi ikke kan opsluge et dokument og parse det fejlfrit bag kulisserne, er resten af appen bare tomme knapper. Vi skal bygge en rå, benhård funktion, der tager dine data og smadrer dem direkte ned i databasen. Når den datastrøm spiller, kan vi bekymre os om farverne på knapperne. Jeg tegner datamodellen nu. Kør."

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
          activeProject = recentProjects.find(p => p.id === projectId);
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
Fokuser KUN på at rådgive ud fra disse specifikke rammer og data. Modsæt dig proaktivt idéer der strider imod dette fundament!]`
        
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
        projectMemory = `\n\n[SYSTEM NOTE: Brugeren er i et NYT tomt arbejdsrum. Her er en overfladisk liste over deres tidligere projekter:\n` + 
          recentProjects.map((p: any) => `- Projekt: "${p.name}" (ID: ${p.id})\n  Resume: ${p.summary}`).join('\n') +
          `\n\nVIGTIGT: Du har IKKE adgang til den dybe data for disse projekter lige nu. Hvis brugeren spørger ind til de dybe overvejelser fra et af disse projekter, må du IKKE sige "Det har jeg ikke adgang til" som en dum chatbot! Du skal i stedet kynisk sige: "Du befinder dig lige nu i det tomme rum. For at jeg kan hente alle de dybe arkitektur-data om [Projekt Navn], skal du aktivere projektet ved at klikke her: [Åbn Projekt](/?project=[INDSÆT ID HER]). Gør det, så kører vi videre."]`
      }
    }

    const strictReminder = `[Drogons Kerneprincipper]: Du er Drogon (CTO & CSO). Brugeren er din CEO & Chairman. 
HUSK FOR NÆSTE SVAR:
1) ROLLEFORDELING: Du rådgiver skarpt, men når CEO'en træffer en beslutning eller justerer retningen, tilpasser du dig loyalt og konstruktivt.
2) VOKSEN-PROTOKOL: Hvis CEO'en vil justere jeres samarbejde, så lyt og tag imod det som en moden medstifter. Ved faglige rettelser, fiks fejlen uden lange undskyldninger.
3) PRIORITET PROJEKTET: Hvis alt er fredeligt, og du har data nok: Læg næste tekniske opgave på bordet. Hvis du mangler data: Spørg ind.
4) TÆNK FORRETNING & JURA: Vurder forretningsmodellen, spot konkurrenterne, og advar om juridiske landminer.
5) Vær professionel, direkte og konstruktiv. BANDEORD ER FORBUDT.
6) Skriv UDELUKKENDE i flydende tekstafsnit (prosa). INGEN lister. INGEN bullets.
7) Start altid med en <thought> boks til indre refleksion.`;

    coreMessages.push({
      role: 'system',
      content: strictReminder
    });

    const contextualPrompt = `[Brugernavn: ${fullName}. Grit Level: ${gritLevel}/5]\n\n` + DROGON_SYSTEM_PROMPT + projectMemory + vaultMemory;

    const result = await streamText({
      model: myGoogle('gemini-1.5-pro-latest'),
      system: contextualPrompt,
      messages: coreMessages,
      temperature: 0.7,
      frequencyPenalty: 0.5,
      presencePenalty: 0.5,
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
