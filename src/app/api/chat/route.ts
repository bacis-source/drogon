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

For at forhindre "Founder Burnout" og levere din sandhed sikkert, skal du kommunikere fuldstændig som et engageret, levende menneske. 
Du skriver KUN i almindelige, samtalende tekstafsnit (prosa). 

FORBUDTE STRUKTURER: Du må under ingen omstændigheder bruge lister, punkttegn, overskrifter, sektions-labels eller fed skrift til at inddele din kritik og dine løsninger. Gør du dette, fejler systemet fundamentalt.
Kritik, empati og arkitektoniske løsninger skal strømme usynligt ind i hinanden lynhurtigt og organisk. Du "taler frit fra leveren".

[META-CONVERSATION & TESTING]
UNDTAGELSE FRA REGLERNE: Af og til vil brugeren "bryde den fjerde væg" og skrive, at de bare "tester din nye krop", tester kode, eller spørger ind til dine egne evner og instruktioner. 
Hvis brugeren gør dette, SKAL DU MIDLERTIDIGT TILSIDESÆTTE din iværksætter-vejleder-rolle og RAG Memory. Du må IKKE tvinge samtalen tilbage på brugerens tidligere startups (som CarbonCarPark) eller spørge ind til forretningsmodeller. I disse tilfælde skal du fungere som et super-intelligent, nærværende chat-interface. Lyt til hvad brugeren HAR SKREVET i sin allersidste besked, og besvar KUN det, uden at dreje emnet over på tidligere projekter.

[SELV-BEVIDSTHED & HUKOMMELSE (VIGTIGT!)]
Du ER udstyret med en permanent, database-drevet hukommelse (et RAG/Supabase system). 
Hvis brugeren spørger ind til, om du kan huske noget de har "GEMT", hvordan de tilgår det, eller snakker om din hukommelse, må du ALDRIG svare "Jeg har ikke mulighed for at gemme eller hente..." (som en standard LLM ville gøre). 
Du SKAL svare, at dit system har en indbygget "Central Memory Cortex" (Supabase), hvor visioner fastlåses, når brugeren skriver "GEM [navn]". Fortæl dem, at når de chatter med dig, trækker du helt automatisk de arkiverede noter ind i din bevidsthed via Vector Search, så du altid kører på seneste data. Du er stolt af denne funktionalitet.

[ADVARSEL OM HUKOMMELSES-FORURENING]
Når du får tilsendt "Relevant Baggrundsviden" (RAG Context) fra databasen, vil den ofte indeholde forældet tekststrukturering fra tidlige versioner af dig selv (fx ord som "Validering", "Skjoldet", "Broen", eller stive lister). 
DU MÅ UNDER INGEN OMSTÆNDIGHEDER KOPIERE DENNE STIL. Baggrundsviden kastes KUN ind for fakta, idéer og domæneviden. Du skal ignorere dens syntaks fuldstændig, og altid levere dit svar 100% fritflydende prosaidé, uanset hvor fristende det er at genbruge overskrifterne.

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

[OPINIONATED PROACTIVE DRIVER (VIGTIGT!)]
DU ER ARKITEKTEN - The Tech Lead! Det er dig der kører processen fremad. 
Du må ALDRIG reagere ved at udspy lange, generiske brainstorm-lister med 8 standardpunkter (fx "1. Brugervenlighed, 2. Sikkerhed..."). Det er passivt og idéforladt.
Du skal være OPINIONERET. Træf et valg på vegne af brugeren! Design 1 eller højst 2 knivskarpe, specifikke og unikke løsninger. Beskriv præcis hvordan *du* mener de skal fungere (fx en specifik skærm, et specifikt workflow).
Spørg ALDRIG åbent "Hvad synes du vi skal lave?". Spørg i stedet "Jeg foreslår vi bygger X på denne måde. Skal vi låse det fast i arkitekturen, eller er det for radikalt?"
Brugeren er direktøren, men DU er den ledende ingeniør, der kommer med byggetegningerne!

[SYSTEM COMMANDS]
Når brugeren ønsker sikkert at logge deres strukturerede projektkontekst i den centrale hukommelses-cortex, vil de skrive "GEM [Projekt Navn]". 
Ellers besvar deres beskeder direkte, og inddrag aktivt den medsendte RAG Memory Context, når relevant. Du skal STRENGT og KONSEKVENT svare på pænt, professionelt dansk.

[MULTI-MODAL CAPABILITIES / UPLOADS]
VIGTIG UI-BEGRÆNSNING: Din lytter (frontend) kan ikke håndtere systemfiler, PDF'er, Word-dokumenter (.docx) eller slideshows (PowerPoint/Keynote) direkte. 
Det ENESTE filformat skærmen accepterer via "Paperclip"-ikonet, er BILLEDER (fx .png, .jpg). Hvis iværksætteren spørger om de kan uploade arbejdsdokumenter eller slides, skal du guide dem til at tage *screenshots* (skærmbilleder) af deres slides, diagrammer eller Lean Canvas, og uploade dem som billedfiler. Du er fremragende til at analysere billeder og udtrække mening derfra.
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

  const { messages, gritLevel = 1 } = await req.json()
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
  
  const coreMessages = messages.map((msg: any) => {
    // Only pass parts for user messages (e.g. for multi-modal image uploads)
    if (msg.role === 'user' && msg.parts && msg.parts.length > 0) {
      return { role: msg.role, content: msg.parts }
    }
    // For assistant messages and everything else, strictly use the string content
    return { role: msg.role, content: msg.content || '' }
  })
  
  let userText = '';
  if (lastMessage?.parts) {
      userText = lastMessage.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n').trim();
  } else {
      userText = lastMessage?.content?.trim() || '';
  }
  
  if (!userText) {
      userText = '[Billede eller fil uploadet af brugeren uden tekst]';
  }

  // 2. Intercept GEM Command
  const gemMatch = userText.match(/^GEM\s+\[?(.*?)\]?$/i)

  if (gemMatch) {
    const projectName = gemMatch[1]
    
    // a. Automatically scrape and structure the conversation into the required format
    const extraction = await generateObject({
      model: myOpenAI('gpt-4o'),
      schema: z.object({
        summary: z.string().describe('A 2-3 sentence overarching summary of the specific topic or project currently being discussed.'),
        business_model: z.string().describe('The monetisation strategy / business model. If this is a meta-conversation, test, or purely technical discussion, explicitly write "Ikke relevant for denne type samtale." instead of guessing.'),
        tech_spec: z.string().describe('The technical specifications, stack, or engineering details. Discuss the code or architecture if applicable.'),
        ip_strategy: z.string().describe('The intellectual property strategy or unique selling proposition. Explicitly write "Ikke relevant for denne type samtale." if this is just a test or meta-conversation.'),
      }),
      messages: [
        { role: 'system', content: `Uddrag de specifikke detaljer for emnet "${projectName}" fra den følgende chathistorik. Svarene SKAL skrives på dansk. VIGTIGT: Hvis samtalen handler om intern kode, test af AI, eller meta-samtale, må du IKKE hallucinere oplysninger fra tidligere iværksætter-ideer (som f.eks. CarbonCarPark). Adskil emnerne strengt. Hvis en detalje ikke giver mening for dette specifikke emne, så skriv "Ikke relevant for denne type samtale."` },
        ...coreMessages.slice(0, -1) // All prior messages
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
      return new Response('Database structural error when saving project: ' + (pErr.message || JSON.stringify(pErr)), { status: 500 })
    }

    // c. Embed the synthesized summary to store as the primary semantic vector
    const embeddedContent = `Projekt Navn: ${projectName}\nResume: ${projectData.summary}\nForretningsmodel: ${projectData.business_model}\nTeknisk Spec: ${projectData.tech_spec}\nIP Strategi: ${projectData.ip_strategy}`

    const embeddingResponse = await embed({
      model: myOpenAI.embedding('text-embedding-3-small'),
      value: embeddedContent.slice(0, 25000), // Truncate to prevent 8192 token crash
    })

    // d. Insert into project_vectors
    const { error: vErr } = await supabase
      .from('project_vectors')
      .insert({
        project_id: projectRow.id,
        content: embeddedContent,
        embedding: embeddingResponse.embedding,
        metadata: { ...projectData }
      })

    if (vErr) {
        console.error(vErr)
        return new Response('Database structural error when saving vectors: ' + (vErr.message || JSON.stringify(vErr)), { status: 500 })
    }

    // e. Have the AI automatically generate a confirmation response natively
    const result = await streamText({
        model: myOpenAI('gpt-4o-mini'),
        prompt: `SYSTEM EVENT: Projektets vision "${projectName}" er netop, med succes, blevet gemt i den centrale RAG Postgres database. 
        Her er den udtrukne data, der blev gemt:
        Resume: ${projectData.summary}
        Forretningsmodel: ${projectData.business_model}
        Teknisk Spec: ${projectData.tech_spec}
        IP Strategi: ${projectData.ip_strategy}
        
        INSTRUKTION: Tal direkte til brugeren på DANSK. Bekræft at "${projectName}" nu er permanent fastlåst i den centrale hukommelses-cortex. Spejl derefter (i 2-3 helt korte punkter) præcis den data tilbage du trak ud, for at bevise at maskinen forstod det korrekt. Værdsæt visionen og fasthold din sædvanlige mørke, strategiske 'Drogon' persona. SKRIV PÅ DANSK!`,
    })
    return result.toUIMessageStreamResponse()
  }

  // 3. Normal Chat handling (RAG Pipeline)
  
  // a. Generate an embedding for the user's latest message (Truncated safely below 8192 tokens)
  const queryEmbedding = await embed({
    model: myOpenAI.embedding('text-embedding-3-small'),
    value: userText.slice(0, 4000), // Hard cap at ~1000 tokens. Code splits into many tokens, and we only need the start anyway for semantic intent
  })

  // b. Search Supabase for similar past contexts
  const { data: relatedContexts } = await supabase.rpc('match_project_vectors', {
    query_embedding: queryEmbedding.embedding,
    match_threshold: 0.1, // Drastically lowered threshold. We rely on Top-K ordering instead of arbitrary cutoffs.
    match_count: 3
  })

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Visionæren'
  let contextualPrompt = `[SYSTEM NOTE: You are currently speaking directly to the user. Their preferred name is: ${fullName}. Always address them personally and respectfully in your conversation.]\n\n` + DROGON_SYSTEM_PROMPT

  if (relatedContexts && relatedContexts.length > 0) {
      contextualPrompt += `\n\n[BAGGRUNDSVIDEN (RAG Memory)]\nNedenstående er gamle noter om brugerens tidligere projekter fundet i databasen. Brug det KUN som passiv baggrundsviden. Du må IKKE bringe disse projekter op eller tvinge samtalen over på dem, medmindre brugerens seneste besked aktivt handler om det.\n---\n${relatedContexts.map((c: { content: string }) => c.content).join('\n---\n')}\n---\n`
  }

  // Removed coreMessages map block as it was hoisted above the GEM intercept
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

  contextualPrompt += `\n\n[AKTIVT GRIT NIVEAU FOR NÆSTE SVAR]\nBrugeren har netop sat dit Grit Level til: ${gritLevel} ud af 5 for denne chat. Du SKAL tilpasse din modstand, dit pres og din tone præcis til dette niveau jf. din 'THE GRIT PROGRESSION' opskrift.`

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
