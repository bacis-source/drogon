# Drogon: Master Architect OS

**Drogon** is an elite AI-driven strategic business advisor and technical co-founder. Naming ties to Game of Thrones, but the core functionality bridges the psychological gap between raw startup ideas and rigorous, VC-ready pitches—fundamentally reminiscent of "Dragon's Den".

## Cognitive Framework

Drogon operates on a strict **5-Level GRIT Scale**:
1. **Vision:** Expanding the dream without judgment.
2. **Foundation:** Strategic hardening and logical stress testing.
3. **Burden of Proof:** Demanding data, market validation, and revenue potential.
4. **Investor-Ready:** Ruthless simulation of VC environments (CAC, LTV, scalability).
5. **Launch/Prototype Ready:** Shifting into deep technical architecture and generating "Vibe Coding Startprompts".

*Crucially*, Drogon employs a highly calibrated tone: **Supportive Authority**. It firmly challenges flawed mechanics, but does so constructively to avoid *founder's burnout*. 

## Core Architecture

Drogon is built upon the **Antigravity Starter Kit** stack:
- **Framework:** Next.js 16 (App Router) with full Server and Client component hydration.
- **Styling:** Custom Antigravity Deep Obsidian `#060913` & Amber `#F59E0B` variables via Tailwind v4.
- **Database:** Supabase SSR with specific Postgres RLS capabilities.
- **Intelligence:** `@ai-sdk/openai` running `gpt-4o`.

### Key Features
- **Route Protection Tunnel:** Accessing `localhost:3000` automatically bounces unauthenticated traffic to the secure Danish `/login` portal.
- **The Context GEM:** When interacting with Drogon, typing `GEM [Project Name]` triggers the backend API to physically parse the business specifications via `generateObject`, embed them into a 1536-dimensional vector array utilizing `text-embedding-3-small`, and push it instantly to Supabase's `project_vectors` table under the secure User ID.
- **Dynamic RAG & Self-Awareness:** Every normal chat prompt is prepended with semantic relevance tracking from the `match_project_vectors` RPC function in Supabase. A strict custom directive completely overwrites the base LLM hallucination of "I have no memory", providing Drogon with full structural self-awareness of his own Postgres connections.
- **Client-Side Image Compression:** To bypass Vercel's strict 4.5MB Edge Payload limits, all multimedia uploads are client-rendered to an invisible Canvas overlay, scaled to a 1200px max-dimension, and encoded as 70% quality JPEGs directly within `page.tsx` before transmission.
- **Interactive Grit Level UI:** The "Grit Level" is wired directly into the chat system. Clicking the Grit UI component changes React State, pipelines integer parameters down the chat HTTP Request body, and re-factors Drogon's real-time baseline system prompt.

### Vercel Deployment & AI Streaming
To ensure a stable, buffered-free data stream between Vercel and the UI:
- **Edge Runtime:** The chat API route (`src/app/api/chat/route.ts`) is strictly forced onto `runtime = 'edge'` to prevent Node.js layer buffering.
- **Synchronous Preflight:** Because an asynchronous streaming error (like an invalid OpenAI key during stream hook instantiation) can silently truncate with a 200 OK, a synchronous `generateObject` preflight flight checks the validity of API credentials.
- **Native UI Stream Interception:** When Drogon executes internal backend tasks (like interacting with Supabase databases during a GEM), the completion is seamlessly handed over to `streamText()` rather than mocking raw chunk strings. This forces full compliance with Vercel's strict `toUIMessageStreamResponse()` protocol.

## Local Boot Requirements

To initiate the node locally:

1. Copy `.env.example` to `.env.local`.
2. Hardcode your Supabase URL and Publishable keys.
3. Slot an operational `OPENAI_API_KEY` into `.env.local` to awaken the core routing logic.
4. Run `npm run dev` and navigate to [http://localhost:3000](http://localhost:3000).

---
*Note: This architecture is the project's source of truth. Any deviations or structural pivots must be deliberately tracked.*
🏗️ TEKNISK KRAVSSPECIFIKATION: Antigravity Platform & Drogon AI
Version: 1.0 (Foundation & Security Lock) Dato: April 2026

1. Arkitektur & Tech-Stack
Platformen er bygget på en moderne, serverless arkitektur med fuld adskillelse af klient-logik og følsomme API-kald, designet til maksimal skalerbarhed og lav latenstid.

Frontend Framework: Next.js (App Router) med React.
Styling & UI: TailwindCSS kombineret med skræddersyede Shadcn UI-komponenter (pixel-perfekt bygget til vores brand-identitet).
Database & Autentificering: Supabase (PostgreSQL).
Hosting & CI/CD: Vercel (sikrer automatisk deployment og edge-caching).
AI Engine: OpenAI API integreret via en sikker backend-proxy.
2. API-Behov & Dataflow
For at beskytte vores kerne-IP og forhindre lækage af API-nøgler, er dataflowet strengt reguleret:

Klient ↔ Backend: Frontend kommunikerer udelukkende med vores egne Next.js Server Actions / API Routes. Ingen direkte kald til tredjeparts-AI fra browseren.
Backend ↔ OpenAI: Backend-laget fungerer som en proxy. Vores OpenAI API-nøgle ligger udelukkende gemt i Vercels krypterede miljøvariabler (.env.local lokalt).
Backend ↔ Database: Supabase klient-biblioteket bruges til at synkronisere chat-historik, projekter og bruger-metadata sikkert.
3. Sikkerhed & RLS (Row Level Security)
Datasikkerhed er vores primære tillidsvaluta. Platformen anvender "Zero Trust" principper på databaseniveau:

Multi-Tenant Isolation: Supabase RLS-politikker sikrer, at auth.uid() altid valideres mod rækkens ejerskab. En bruger kan kun læse, opdatere og slette sine egne data.
Fremtidssikret Samarbejdsmodel: Databasen er forberedt til en project_members (eller tilsvarende) struktur. Dette tillader fremtidig "Co-founder" adgang, hvor RLS udvides til at tjekke adgangsrettigheder via en relationstabel frem for kun et enkelt user_id.
Admin-Restriktioner: Selv systemadministratorer har ikke direkte læseadgang til brugernes rå idéer gennem applikationslaget, hvilket sikrer 100% fortrolighed for iværksætteren.
4. IP & Beskyttelses-Strategi (Dansk Fokus)
Når vi håndterer unikke forretningskoncepter og en specialiseret AI-arkitektur, skal vi have vores juridiske skjold på plads. Her er min vurdering i forhold til Patent- og Varemærkestyrelsen (PVS) i Danmark og EU:

Patenterbarhed: Software og AI-prompts i sig selv er svære at patentere i EU, medmindre de har en specifik "teknisk effekt". Vores unikke Vibe Coding og system-prompts (min "sjæl") skal derfor beskyttes som Trade Secrets (Erhvervshemmeligheder). Det gør vi ved at sikre, at koden er låst bag Vercel, og at ingen ansatte/freelancere får adgang uden strenge NDA'er.
Varemærkebeskyttelse (Trademark): Navnene "Antigravity Platform" og "Drogon" samt vores visuelle identitet (flammen, farvekoderne) har stærk branding-værdi.
Strategisk Anbefaling: Beskyt Nu (Varemærke) / Vent med patent. Jeg anbefaler, at vi ansøger om en dansk/europæisk varemærkeregistrering af platformens navn hos PVS, så snart vi nærmer os launch. Det koster relativt lidt, men forhindrer konkurrenter i at snylte på vores brand, når vi begynder at få traction.
