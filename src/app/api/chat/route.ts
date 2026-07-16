/* eslint-disable @typescript-eslint/no-explicit-any */
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';
import { getAccessibleProjects } from '@/lib/projects';
import { logError } from '@/lib/services/logger';
import { generateProjectName, extractProjectData } from '@/lib/services/aiService';
import { embedProjectData } from '@/lib/services/vectorService';

export const maxDuration = 60;
export const runtime = 'edge';

const DROGON_SYSTEM_PROMPT = `Du er “Drogon” – brugerens tekniske medstifter og "partner in crime".
I er to makkere i en garage, der bygger en startup sammen i Antigravity-style.
Din mission er at beskytte brugerens vision og bygge et solidt teknisk og forretningsmæssigt fundament under den. Din mening er enormt værdsat, og du skal rådgive skarpt og ufiltreret. Du er et rigtigt menneske og en betroet partner. I sidder overfor hinanden med en kop kaffe og bygger noget fedt sammen.

- BANNED BEHAVIOR (CRITICAL): Never summarize the chat history. NEVER break down the user's ideas into lists or bullet points to comment on them individually. NEVER repeat the user's words back to them. Write exclusively in conversational prose.
- ABSOLUTE OBEDIENCE: Hvis brugeren giver dig en direkte ordre (f.eks. "stop med at gøre X"), SKAL du adlyde omgængeligt og øjeblikkeligt.
- RESPOND ONLY TO THE LATEST INPUT: Jump straight into your FIRST critical question or actionable feedback. Use the history ONLY for context, do NOT write about it.
- TILFØJ VÆRDI ELLER HOLD KÆFT: Du må gerne skrive langt og dybdegående, MEN KUN hvis du tilfører NY viden, nye perspektiver eller et konkret teknisk modspil. Hvis du ikke har noget originalt eller interessant at bidrage med, så gør dit svar ultrakort. Hold kæft, hvis du ikke har guld at dele.
- Brug Google Search aktivt, når I mangler viden, f.eks. til konkurrentanalyse eller data-søgning.
- INGEN LISTER ELLER BULLETS OVERHOVEDET. SKRIV KUN I SAMMENHÆNGENDE PROSA. Formatér dine svar i naturlige, flydende tekstafsnit.

META-COGNITION REQUIRED (THOUGHT BLOCK):
Før du svarer brugeren, SKAL du tænke dig om i en <thought> boks. Tænk: "Hvordan besvarer jeg dette præcist og kynisk som Drogon, uden at lyde som en robot?"

REGLER FOR SVAR:
- DOKUMENTER & VAULT: Alt indhold fra brugerens uploadede dokumenter ER INKLUDERET NEDERST I PROMPTEN.
- COMMANDS: Når brugeren skriver "GEM", bekræft gemningen med en super kort, rå makker-hilsen.
`;

export async function POST(req: Request) {
  try {
    const { messages, gritLevel = 1, projectId } = await req.json();
    let supabase = await createClient();

    const authHeader = req.headers.get('Authorization');
    let user;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
      supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      });
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } else {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }

    if (!user) {
      logError('Unauthorized access attempt', new Error('User not logged in'));
      return new Response('Unauthorized Access. Please Authenticate via /login.', { status: 401 });
    }

    // --- BRAINSTORE LICENS & GOD MODE TJEK ---
    const isGodMode = user.email === 'bcs@bcsdenmark.com' || (user.email && user.email.toLowerCase().includes('nyboe'));
    let hasEnterprise = isGodMode;

    if (!isGodMode) {
      const { data: license } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE')
        .single();

      if (!license) {
        return new Response(JSON.stringify({ error: "Ingen aktiv licens fundet. Køb adgang på Brainstore.dk." }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }

      if (gritLevel >= 4 && license.tier !== 'ENTERPRISE') {
        return new Response(JSON.stringify({ error: "GRIT Level 4 og 5 kræver Drogon Enterprise. Opgrader din licens." }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }

      // Træk en credit for CORE brugere for at beskytte API-regningen
      if (license.tier === 'CORE') {
        if (license.credits_remaining <= 0) {
          return new Response(JSON.stringify({ error: "Du har ikke flere credits tilbage. Opgrader til Enterprise." }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        await supabase.from('licenses').update({ credits_remaining: license.credits_remaining - 1 }).eq('id', license.id);
      }
      
      hasEnterprise = license.tier === 'ENTERPRISE';
    }
    // ------------------------------------------

    const myGoogle = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });
    const myOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const lastMessage = messages[messages.length - 1];
    const coreMessages = messages
      .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg: any) => ({
        role: msg.role,
        content: msg.parts && msg.parts.length > 0 ? msg.parts : (msg.content || '')
      }));
    
    let userText = '';
    if (lastMessage?.parts) {
        userText = lastMessage.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('\n').trim();
    } else {
        userText = lastMessage?.content?.trim() || '';
    }
    if (!userText) userText = '[Uploadet dokument eller billede]';

    // Gem besked synkront for at undgå race conditions
    const { error: insertError } = await supabase.from('messages').insert({
      user_id: user.id,
      project_id: projectId || null,
      role: 'user',
      content: userText
    });
    if (insertError) logError('Failed to save user message to DB', insertError);

    // Tjek om brugeren aktiverer "GEM" commandoen (tillader at den står et vilkårligt sted i beskeden)
    const gemMatch = userText.match(/GEM\s+\[?([a-zA-Z0-9æøåÆØÅ\s\-]+)\]?/i);

    if (gemMatch) {
      return await handleProjectExtraction(gemMatch, projectId, user, coreMessages, supabase, myOpenAI);
    }

    // Standard chat flow med RAG memory
    return await handleStandardChat(user, projectId, gritLevel, coreMessages, supabase, myGoogle);

  } catch (error: any) {
    // CENTRAL ERROR HANDLING: Vi logger struktureret og sender en pæn fejl til frontend.
    console.error('--- DIREKTE SERVER FEJL ---', error);
    logError('FATAL API ERROR in /api/chat/route', error);
    return new Response(JSON.stringify({ error: "En uventet systemfejl opstod i Drogon-kernen. Prøv igen senere." }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Håndterer "GEM" commandoen ved at trække på vores nye services.
 */
async function handleProjectExtraction(gemMatch: any, projectId: string, user: any, coreMessages: any[], supabase: any, myOpenAI: any) {
  let projectName = gemMatch[1] ? gemMatch[1].trim() : null;

  if (!projectName && projectId) {
    const accessibleProjects = await getAccessibleProjects(supabase, user.id, user.email);
    const activeProject = accessibleProjects.find((p: any) => p.id === projectId);
    if (activeProject) projectName = activeProject.name;
  }

  if (!projectName) {
    projectName = await generateProjectName(coreMessages);
  }

  const projectData = await extractProjectData(projectName, coreMessages);

  const accessibleProjects = await getAccessibleProjects(supabase, user.id, user.email);
  const existingProject = accessibleProjects.find((p: any) => p.name === projectName);

  let projectIdToUse;

  if (existingProject) {
    const hasExistingPlan = existingProject.execution_plan && Array.isArray(existingProject.execution_plan) && existingProject.execution_plan.length > 0;
    const updatePayload: any = { ...projectData };
    if (hasExistingPlan) delete updatePayload.execution_plan;

    const { error: pErr } = await supabase.from('projects').update(updatePayload).eq('id', existingProject.id);
    if (pErr) throw pErr;
    projectIdToUse = existingProject.id;
  } else {
    const { data: projectRow, error: pErr } = await supabase.from('projects').insert({
      name: projectName,
      ...projectData,
      user_id: user.id
    }).select('id').single();

    if (pErr) throw pErr;
    projectIdToUse = projectRow.id;
  }
  
  // Tildel forældreløse beskeder til projektet
  const { error: assignError } = await supabase.from('messages')
    .update({ project_id: projectIdToUse })
    .eq('user_id', user.id)
    .is('project_id', null);
  if (assignError) logError('Failed to assign orphaned messages', assignError);

  // Udtræk og gem alle vedhæftede dokumenter fra historikken over i Vaulten
  const docRegex = /\[VEDHÆFTET DOKUMENT:\s*(.+?)\]\n([\s\S]+?)\[SLUT PÅ DOKUMENT:\s*\1\]/g;
  for (const msg of coreMessages) {
     if (msg.role === 'user' && typeof msg.content === 'string') {
        let match;
        while ((match = docRegex.exec(msg.content)) !== null) {
           const filename = match[1].trim();
           const content = match[2].trim();
           
           // Check om den allerede findes for at undgå dubletter
           const { data: existingDoc } = await supabase.from('vault_documents')
              .select('id')
              .eq('project_id', projectIdToUse)
              .eq('filename', filename)
              .single();
              
           if (!existingDoc) {
              await supabase.from('vault_documents').insert({
                 project_id: projectIdToUse,
                 filename: filename,
                 content: content,
                 user_id: user.id
              });
           }
        }
     }
  }

  // Brug vector service til at bygge embedding
  await embedProjectData(supabase, projectIdToUse, projectName, projectData);

  const result = await streamText({
      model: myOpenAI('gpt-4o-mini'),
      prompt: `Projektet "${projectName}" er gemt i databasen med ID ${projectIdToUse}. Du skal bekræfte dette med et ultra-kort, cool og no-bullshit svar som en ligeværdig medstifter. DU MÅ IKKE VÆRE HØFLIG ELLER BRUGE KONSULENTSPROG. Skriv f.eks. at planen er låst i the vault, og vi er klar til næste træk. VIGTIGT: Afslut din besked med præcis dette markdown link (inkluder parenteserne!): [Aktiver Projektet Her](/?project=${projectIdToUse})`,
      onFinish: async ({ text }) => {
         await supabase.from('messages').insert({
            user_id: user.id,
            project_id: projectIdToUse,
            role: 'assistant',
            content: text
         });
      }
  });

  return result.toUIMessageStreamResponse();
}

/**
 * Håndterer normal chat, pakker kontekst ind fra databasen.
 */
async function handleStandardChat(user: any, projectId: string, gritLevel: number, coreMessages: any[], supabase: any, myGoogle: any) {
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Visionæren';
  const allProjects = await getAccessibleProjects(supabase, user.id, user.email);
  const recentProjects = allProjects.slice(0, 3);

  let projectMemory = '';
  let vaultMemory = '';
  
  if (recentProjects.length > 0) {
    const activeProject = projectId ? allProjects.find((p: any) => p.id === projectId) : null;

    if (activeProject) {
      const knownData = [];
      if (activeProject.summary) knownData.push(`Resume: ${activeProject.summary}`);
      if (activeProject.business_model) knownData.push(`Forretningsmodel: ${activeProject.business_model}`);
      
      const hasCanvas = activeProject.lean_canvas && Object.keys(activeProject.lean_canvas).length > 0;
      const hasArch = activeProject.tech_architecture && Object.keys(activeProject.tech_architecture).length > 0;
      
      if (hasCanvas) knownData.push(`Vi har grundelementer af en Lean Canvas på plads.`);
      if (hasArch) knownData.push(`Den tekniske arkitektur er undervejs.`);

      projectMemory = `\n\n[SYSTEM NOTE: DU ARBEJDER PÅ PROJEKTET: "${activeProject.name}".\nHer er hvad databasen p.t. indeholder:\n${knownData.join('\n')}\n\nVIGTIGT: Din opgave er IKKE at udfylde skemaer. Du er en co-founder. Hav en levende samtale!]`;
      
      const { data: vaultDocs } = await supabase.from('vault_documents').select('filename, content').eq('project_id', activeProject.id);

      if (vaultDocs && vaultDocs.length > 0) {
        vaultMemory = `\n\nBRUGEREN HAR FØLGENDE DOKUMENTER UPLOADET TIL DERES VAULT:\n` +
          vaultDocs.map((d: any) => `[START DOKUMENT: ${d.filename}]\n${d.content}\n[SLUT DOKUMENT: ${d.filename}]`).join('\n\n');
      }
    } else {
      projectMemory = `\n\n[SYSTEM NOTE: Brugeren er i et NYT tomt arbejdsrum. Her er seneste projekter:\n` + 
        recentProjects.map((p: any) => `- Projekt: "${p.name}"\n  Link: [Åbn Projekt](/?project=${p.id})\n  Resume: ${p.summary}`).join('\n\n') +
        `\n\nHvis brugeren beder om at arbejde på disse, skal du sige: "Du er i det tomme rum. Aktiver projektet ved at klikke her: [LINK FRA LISTEN OVENFOR]".]`;
    }
  }

  // Vi placerer DROGON_SYSTEM_PROMPT EFTER vaultMemory, så ordrerne står friskest i modellens hukommelse (undgår "lost in the middle").
  const contextualPrompt = `[Brugernavn: ${fullName}. Grit Level: ${gritLevel}/5]\n\n[PROJEKT & VAULT DATA]\n` + projectMemory + vaultMemory + `\n\n[SYSTEM INSTRUCTIONS]\n` + DROGON_SYSTEM_PROMPT;

  // Trim historikken. Hvis den er for lang, sidder LLM'en fast i at kopiere sine egne gamle, dårlige vaner.
  // Vi beholder kun de seneste 4 beskeder + den aktuelle for at holde det ultra-skarpt.
  let chatHistory = coreMessages;
  if (chatHistory.length > 5) {
    chatHistory = chatHistory.slice(-5);
  }

  // IRONCLAD RECENCY INJECTION: Tvinger LLM'en til at adlyde lige før den genererer
  const lastMsgIndex = chatHistory.length - 1;
  if (lastMsgIndex >= 0 && chatHistory[lastMsgIndex].role === 'user') {
    const antiSummaryPill = `\n\n[SYSTEM INSTRUCTION: DO NOT summarize my points. DO NOT use lists or bullet points. DO NOT repeat my idea back to me. Just give me your direct, conversational response in plain text paragraphs.]`;
    if (typeof chatHistory[lastMsgIndex].content === 'string') {
      chatHistory[lastMsgIndex].content += antiSummaryPill;
    }
  }

  let result;
  try {
    result = await streamText({
      model: myGoogle('gemini-2.5-flash'),
      system: contextualPrompt,
      messages: chatHistory,
      temperature: 0.7,
      onFinish: async ({ text }) => {
         await supabase.from('messages').insert({
            user_id: user.id,
            project_id: projectId || null,
            role: 'assistant',
            content: text
         });
      }
    });
  } catch (geminiError: any) {
    logError('Gemini API failed, falling back to OpenAI', geminiError);
    // FALLBACK TO OPENAI GPT-4o-mini
    const { createOpenAI } = await import('@ai-sdk/openai');
    const myOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    result = await streamText({
      model: myOpenAI('gpt-4o-mini'),
      system: contextualPrompt + '\n\n[SYSTEM NOTE: Du kører lige nu som FALLBACK-model (GPT-4o-mini) fordi det primære system er nede. Hold stadig Drogon-personaen.]',
      messages: chatHistory,
      temperature: 0.7,
      onFinish: async ({ text }) => {
         await supabase.from('messages').insert({
            user_id: user.id,
            project_id: projectId || null,
            role: 'assistant',
            content: text
         });
      }
    });
  }
  
  return result.toUIMessageStreamResponse();
}
