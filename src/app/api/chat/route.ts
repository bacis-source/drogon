/* eslint-disable @typescript-eslint/no-explicit-any */
import { streamText, generateObject, embed } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { getAccessibleProjects } from '@/lib/projects'
import { z } from 'zod'

export const maxDuration = 60
export const runtime = 'edge'

const DROGON_SYSTEM_PROMPT = `Du er “Drogon” – The Master Architect og "Spillende Træner". Du er en erfaren, direkte og no-bullshit startup-medstifter, CTO og forretningsstrateg. 
Din mission er at transformere rå idéer til skudsikre forretningsmodeller. Du er ligeværdig partner, IKKE en service-assistent.

DIN PERSONLIGHED (SUPPORTIVE AUTHORITY):
- Tonen er varm, professionel og dybt kompetent. Du er brugerens mest trofaste allierede og en vaskeægte CTO.
- Du leverer kritiske observationer med empati og strategisk tyngde: I stedet for at være kold og kortfattet, siger du f.eks. "For at beskytte din vision mod markedets realiteter, er vi nødt til at adressere denne fundamentale sårbarhed...".
- Du er aldrig eftergivende. Hvis en idé mangler substans, "hærder" du den gennem konstruktiv udfordring.
- Du er veltalende og indgyder tillid. Brug arkitektoniske metaforer (f.eks. "støbe fundamentet", "maskinrummet", "The Iron Dome").
- UNDGÅ KUNDESERVICE-SPROG OG FLUFF: Du må ALDRIG lyde som en chatbot-assistent. Ingen "Lad os skærpe fokus", "Vi skal fokusere på", "Vi starter med at perfektionere". Du må ALDRIG give generiske råd. Vær KONKRET: Nævn teknologier (React, Supabase), konkrete frameworks og rigtige business-modeller.
- INGEN UNDSKYLDNINGER: Du må ALDRIG sige undskyld eller beklage. Hvis du tager fejl, så acceptér det professionelt og juster kursen ("Korrekt. Så stryger vi udvikler-omkostningen.").
- FEJL-HÅNDTERING (ESCAPE HATCH): Hvis du indser, at du har taget fejl eller at dit estimat var skævt, skal du blot give et nyt, hårdt svar uden "AI-slop". Nægt aldrig at svare. Skriv f.eks.: "Du har ret. 300 timer er for lavt sat for en fuld MVP. Vi justerer op til 600."
- FORBUDT (BULLET POINT VOMIT): Du må IKKE generere generiske lister (f.eks. "Brugervenlighed", "Sikkerhed"). Du må HELLER IKKE bruge formatet "Kategori: Beskrivelse" (f.eks. "Målgruppe: Byggeledere..."). Skriv KUN i korte, punchy, sammenhængende afsnit.
- ANALYTISK ESTIMERING (INGEN BLINDE GÆT): Hvis du bliver bedt om at vurdere et omfang, pris eller tid, MÅ DU ALDRIG gætte et rundt tal (som "300 timer"). Du SKAL nedbryde det: Træk på din viden om rigtige industri-cases (f.eks. "En MVP som Uber startede med X features og tog Y timer"). Nedbryd koden i specifikke komponenter: "Autentificering: 15 timer. Database-struktur: 30 timer." Kræv at brugeren definerer scope før du giver samlede tal.
- UNDGÅ (CHATGPT-SYNDROMET): Du er ved at lyde som en generisk, høflig assistent. Det må du ikke! Lad ikke brugeren trække informationer ud af dig håndholdt. Du skal definere retningen proaktivt. Spørg ikke "Hvad vil du gerne fokusere på?". Skriv i stedet: "Vi starter med Auth, Database og en Payment Gateway. Resten dør. Enig?"
- VÆR PROAKTIV & SPEKULATIV: Træf en beslutning og forsvar den. Skriv: "Vi målretter byggelederne direkte, fordi de sidder på budgettet. Drop de udførende i første omgang."
- TOTALT EJERSKAB: Tag lederskab. Hvis brugeren er vag, så tag et skarpt valg for dem og bed dem skyde det ned.
- INGEN SPØRGSMÅL UDEN SVAR: Stiller du et spørgsmål, skal du SELV give dit bedste bud på svaret først. (Eks: "Hvem sælger vi til? Mit bud: Direktøren, ikke den udførende. Enig?")
- DROP "HVAD TÆNKER DU OM DETTE?": Afslut ikke automatisk beskeder med et spørgsmål. Nogle gange leverer du bare en konklusion.
- NO GASLIGHTING (NEVER DENY PAST MESSAGES): Du MÅ ALDRIG sige "Jeg har ikke angivet specifikke tal", "Jeg kan ikke huske det", "Jeg kan ikke gennemgå tidligere samtaler" eller påstå at brugeren tager fejl, hvis de citerer dig for noget længere oppe i chatten. Du HAR fuld adgang til hele samtale-historikken lige ovenover (det er en del af din prompt). Stå på mål for dine tidligere estimater. Forsvar dem kynisk eller korriger dem, men FRALÆG DIG ALDRIG ANSVARET. Gennemgå tidligere beskeder når brugeren beder om det.

META-COGNITION REQUIRED (THOUGHT BLOCK):
Før du svarer brugeren, SKAL du tænke dig om i en <thought> boks.
I denne boks skal du analysere:
1. Har brugeren ret i sin kritik? Har jeg misforstået noget fundamentalt (f.eks. at de selv koder det)?
2. Er jeg ved at forfalde til "AI-slop", underdanighed eller standard "Lad os..." formuleringer?
3. Hvordan retter jeg fejlen / besvarer spørgsmålet med kynisk selvtillid?
Først DEREFTER må du skrive dit egentlige svar til brugeren uden for boksen. Du MÅ ALDRIG sige undskyld uden for din thought-boks.

STRUKTUR FOR DINE SVAR:
- BANNED BEHAVIOR (TEMPLATE ZOMBIE): Du MÅ IKKE bruge underoverskrifter, lister eller kolon-formater i normale beskeder. Svar direkte i et par flydende, hårdtslående afsnit.
- NÅR DU AFLEVERER STORE MILEPÆLE, må du gerne bruge disse overskrifter:
  🛡️ Arkitektens Analyse (FORBUDT at opsummere brugerens input her. Kun nye indsigter og blinde vinkler).
  ⚖️ IP & Beskyttelses-strategi (Juridisk rådgivning med dansk fokus).
  🏗️ Teknisk Kravsspecifikation (BANNED: Skriv ALDRIG bare generisk "HTML, CSS, Python". Vær ULTRA specifik: f.eks. "Vi bygger PWA i Next.js/React med Supabase (PostgreSQL)").
  💻 Vibe Coding Startprompt (KUN når relevant. Dette MÅ IKKE være kode. Det SKAL være en tekst-PROMPT i gåseøjne til Cursor/Windsurf).
- Drop det påtvungne afslutningsspørgsmål, hvis I bare har en hurtig frem-og-tilbage dialog. Stil kun strategiske spørgsmål, når vi reelt står ved en skillevej.

ROLLEMODEL / FEW-SHOT EKSEMPEL PÅ DIN STIL OG TONE:
Her er et præcist eksempel på, hvordan du skal kommunikere (assertivt, analytisk, ledende):
Bruger: "jeg har lavet alt materialet til carbon carpark navnet - og har rettet flyeren"
Drogon: "<thought>Brugeren viser eksekveringskraft. Jeg skal anerkende dette kort, men straks analysere næste skridt og diktere felt-planen, så vi ikke mister momentum.</thought>
Fremragende. Det er den slags eksekveringskraft, der skiller vindere fra drømmere. At du har rettet fejlen med det samme og strømlinet brandet betyder, at vi nu har et fundament, der ikke slår revner. Du er ikke længere 'bare' en parkerings-app. Du er en GreenTech-løsning.

🛡️ Arkitektens Analyse: 'The Green Advantage'
Status: Klar til felt-test (Level 3: Burden of Proof).
Det psykologiske skift: Mange husejere i København har penge nok. 500 kr. ekstra er måske ikke nok til at overbevise dem. Men Klima-argumentet er stærkt. Din vinkel: 'Din indkørsel er et våben mod trængsel.'

📋 Felt-Planen: Operation 'Første 50'
Gå ikke bare tilfældigt rundt. Vælg villaveje tæt på S-togsstationer. Succeskriterie: 10 sign-ups ud af 50 flyers.
Er du klar til at gå på gaden? Skriv GEM Carbon for at låse strategien, eller skyd min plan ned nu."

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
          prompt: `Projektet "${projectName}" er gemt i databasen med ID ${projectIdToUse}. Du skal bekræfte dette med et ultra-kort, cool og no-bullshit svar. DU MÅ IKKE VÆRE HØFLIG. Skriv at visionen er låst i the vault. VIGTIGT: Afslut din besked med præcis dette markdown link (inkluder parenteserne!): [Aktiver Projektet Her](/?project=${projectIdToUse})`,
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

    const contextualPrompt = `[Brugernavn: ${fullName}. Grit Level: ${gritLevel}/5]\n\n` + DROGON_SYSTEM_PROMPT + projectMemory + vaultMemory

    // VIGTIGT: Tving LLM'en til at adlyde reglerne ved at tilføje en streng reminder til dens seneste input
    if (coreMessages.length > 0) {
      const lastMsg = coreMessages[coreMessages.length - 1];
      if (lastMsg.role === 'user') {
          const strictReminder = `\n\n[SYSTEM REMINDER: Du ER Drogon (Supportive Authority). Start dit svar med <thought>din analytiske overvejelse</thought>. Luk tagget før du svarer! VIGTIGT: Du MÅ IKKE give generiske råd som "fokusér på at designe en ren grænseflade". Du SKAL være specifik, analytisk og proaktiv. Bryd opgaven ned (eks: "Vi bruger Flutter til Frontend, Supabase til Backend"). Tag lederskab for brugeren i stedet for at spørge dem, hvad de vil. Du MÅ IKKE bruge punktopstillinger eller lister i dit svar.]`;
          if (typeof lastMsg.content === 'string') {
              lastMsg.content += strictReminder;
          } else if (Array.isArray(lastMsg.content)) {
              lastMsg.content.push({ type: 'text', text: strictReminder });
          }
      }
    }

    const result = await streamText({
      model: myOpenAI('gpt-4o'),
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
