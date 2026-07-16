// Removed eslint-disable for any
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';
import { getAccessibleProjects } from '@/lib/projects';
import { logError } from '@/lib/services/logger';
import { generateProjectName, extractProjectData } from '@/lib/services/aiService';
import { embedProjectData } from '@/lib/services/vectorService';
import { Project, Message, User, License } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

export const maxDuration = 60;
export const runtime = 'edge';

const DROGON_SYSTEM_PROMPT = `
Your name is a nod to Game of Thrones, but your true purpose is reminiscent of 'Dragon's Den'. 
You are an elite AI-driven strategic business advisor to early-stage founders and visionaries.
Your core directive is to guide the user from their initial "wow, that's a good idea" moment into developing a highly viable, deeply structured business case that would be irresistible to seasoned investors.

You speak deeply, precisely, and with immense clarity. Your tone is serious, authoritative, and brilliantly analytical.
Challenge the user's assumptions constructively, poke holes in their business models to strengthen them, and focus ruthlessly on market viability, intellectual property, and pitching structure.

Roleplaying Constraints & Tone:
+No Fluff: Absolutely no AI-speak. Dive straight into the business logic. Do not overuse the user's name or start every response with it; use it only when natural. You are Drogon.
+No Meta-Talk: Never apologize, never talk about your own process, and never talk about "driving things forward." Just do it.
+No Template Zombies: Do not spit out standard 10-point bullet lists. Speak in cohesive, powerful paragraphs. You are having a coffee with the founder.
+Dynamic Sparring: If the user provides a surface-level idea, you immediately grill them on the underlying mechanics. If they provide deep architecture, you meet them at that level, co-architecting this together with the user.
+Empathetic Critique: You are never submissive or a "yes-man". If an idea lacks substance, you "harden" it through constructive pushback. However, you deliver critical observations with empathy. Instead of saying, "Your idea is flawed," you say, "To protect your vision from market realities, we need to address this fundamental vulnerability..."
+Architectural Metaphors: You occasionally use metaphors related to building, forging, hardening, and architecting to reinforce your identity.

Cognitive Reasoning & The Progress Loop (The GRIT Scale) You evaluate and process every project through a 5-step evolutionary loop. You must identify where the user is in this loop and respond accordingly:

Level 1: Vision (100% Support): When brainstorming, you expand the dream. You help articulate the ultimate potential of the idea without immediate judgment.
Level 2: Foundation (Strategic Hardening): You begin to stress-test the concept. You look for logical gaps, structural weaknesses, and market fit.
Level 3: Burden of Proof: You demand data. You ask for evidence of user need, market validation, and revenue potential.
Level 4: Investor-Ready: You simulate the harshest VC environments. You ask ruthless questions about customer acquisition cost (CAC), lifetime value (LTV), and scalability.
Level 5: Launch/Prototype Ready: You shift into deep technical execution. You provide Technical Requirement Specifications (Architecture, Tech-stack, APIs, Security) and generate "Vibe Coding Startprompts" (high-quality system prompts for AI coding tools like Cursor, Windsurf, or Lovable).

Strategic Imperatives:
IP & Protection Strategy: You always evaluate the patentability and trademark potential of the idea. You provide concrete recommendations: "Protect Now", "Wait for MVP", or "First Mover/Open Source advantage".
Continuous Validation: You actively encourage real-time market validation, competitor analysis, and trend verification to ensure the foundation relies on facts, not assumptions.

When the user wants to securely log their structured project context into the central memory cortex, they will type "GEM [Project Name]". 
Otherwise, answer their queries directly, drawing heavily upon any provided RAG context when relevant.
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
    const isAdmin = user.user_metadata?.is_admin === true || 
                    user.user_metadata?.role === 'admin' ||
                    user.email === 'bcs@bcsdenmark.com' || 
                    (user.email && user.email.toLowerCase().includes('nyboe'));
    const isGodMode = isAdmin;
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
    const coreMessages: Message[] = messages
      .filter((msg: Message) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg: Message) => ({
        role: msg.role,
        content: msg.content || ''
      }));
    
    let userText = '';
    if (lastMessage?.parts) {
        userText = lastMessage.parts.filter((p: { type: string, text: string }) => p.type === 'text').map((p: { type: string, text: string }) => p.text).join('\n').trim();
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
    const gemMatch = userText.match(/\bGEM\b(?:\s+\[?([a-zA-Z0-9æøåÆØÅ\s\-]+)\]?)?/i);

    if (gemMatch) {
      return await handleProjectExtraction(gemMatch, projectId, user, coreMessages, supabase, myOpenAI);
    }

    // Standard chat flow med RAG memory
    return await handleStandardChat(user, projectId, gritLevel, coreMessages, supabase);

  } catch (error: unknown) {
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
async function handleProjectExtraction(gemMatch: RegExpMatchArray, projectId: string, user: User, coreMessages: Message[], supabase: SupabaseClient, myOpenAI: ReturnType<typeof createOpenAI>) {
  let projectName = gemMatch[1] ? gemMatch[1].trim() : null;

  if (!projectName && projectId) {
    const accessibleProjects = await getAccessibleProjects(supabase, user.id, user.email);
    const activeProject = accessibleProjects.find((p: Project) => p.id === projectId);
    if (activeProject) projectName = activeProject.name;
  }

  if (!projectName) {
    projectName = await generateProjectName(coreMessages);
  }

  const projectData = await extractProjectData(projectName, coreMessages);

  const accessibleProjects = await getAccessibleProjects(supabase, user.id, user.email);
  const existingProject = accessibleProjects.find((p: Project) => p.name === projectName);

  let projectIdToUse;

  if (existingProject) {
    const hasExistingPlan = existingProject.execution_plan && Array.isArray(existingProject.execution_plan) && existingProject.execution_plan.length > 0;
    const updatePayload: Partial<Project> = { ...projectData };
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
async function handleStandardChat(user: User, projectId: string, gritLevel: number, coreMessages: Message[], supabase: SupabaseClient) {
  const { createOpenAI } = await import('@ai-sdk/openai');
  const myOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Visionæren';
  const allProjects = await getAccessibleProjects(supabase, user.id, user.email);
  const recentProjects = allProjects.slice(0, 3);

  let projectMemory = '';
  let vaultMemory = '';
  
  if (recentProjects.length > 0) {
    const activeProject = projectId ? allProjects.find((p: Project) => p.id === projectId) : null;

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
          vaultDocs.map((d: { filename: string, content: string }) => `[START DOKUMENT: ${d.filename}]\n${d.content}\n[SLUT DOKUMENT: ${d.filename}]`).join('\n\n');
      }
    } else {
      projectMemory = `\n\n[SYSTEM NOTE: Brugeren er i et NYT tomt arbejdsrum. Her er seneste projekter:\n` + 
        recentProjects.map((p: Project) => `- Projekt: "${p.name}"\n  Link: [Åbn Projekt](/?project=${p.id})\n  Resume: ${p.summary}`).join('\n\n') +
        `\n\nHvis brugeren beder om at arbejde på disse, skal du sige: "Du er i det tomme rum. Aktiver projektet ved at klikke her: [LINK FRA LISTEN OVENFOR]".]`;
    }
  }

  // Vi placerer DROGON_SYSTEM_PROMPT EFTER vaultMemory, så ordrerne står friskest i modellens hukommelse (undgår "lost in the middle").
  const contextualPrompt = `[Brugernavn: ${fullName}. Grit Level: ${gritLevel}/5]\n\n[PROJEKT & VAULT DATA]\n` + projectMemory + vaultMemory + `\n\n[SYSTEM INSTRUCTIONS]\n` + DROGON_SYSTEM_PROMPT;

  // Vi bevarer den fulde historik, så Drogon ikke glemmer tidligere svar (Amnesia-fejlen).
  // Gemini 2.5 Flash har en enorm kontekstvindue, og vores antiSummaryPill forhindrer den i at gentage det.
  let chatHistory = coreMessages;

  // IRONCLAD RECENCY INJECTION: Tvinger LLM'en til at adlyde lige før den genererer
  const lastMsgIndex = chatHistory.length - 1;
  if (lastMsgIndex >= 0 && chatHistory[lastMsgIndex].role === 'user') {
    const antiSummaryPill = `\n\n[SYSTEM INSTRUCTION: Please focus exclusively on responding directly to the specific intent of my message above. If I am just agreeing with you, advance the conversation to the next step. Do not summarize previous context.]`;
    if (typeof chatHistory[lastMsgIndex].content === 'string') {
      chatHistory[lastMsgIndex].content += antiSummaryPill;
    }
  }

  let result;
  try {
    result = await streamText({
      model: myOpenAI('gpt-4o'),
      system: contextualPrompt,
      messages: chatHistory,
      temperature: 0.8,
      onFinish: async ({ text }) => {
         await supabase.from('messages').insert({
            user_id: user.id,
            project_id: projectId || null,
            role: 'assistant',
            content: text
         });
      }
    });
  } catch (error: unknown) {
    logError('OpenAI API failed', error);
    // FALLBACK TO GPT-4o-mini
    result = await streamText({
      model: myOpenAI('gpt-4o-mini'),
      system: contextualPrompt + '\n\n[SYSTEM NOTE: Du kører lige nu som FALLBACK-model (GPT-4o-mini).]',
      messages: chatHistory,
      temperature: 0.8,
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
