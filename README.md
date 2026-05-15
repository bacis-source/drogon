# Drogon: Master Architect OS

**Drogon** is an elite AI-driven strategic business advisor and technical co-founder. Naming ties to Game of Thrones, but the core functionality bridges the psychological gap between raw startup ideas and rigorous, VC-ready pitches—fundamentally reminiscent of "Dragon's Den".

## Cognitive Framework

Drogon operates on a strict **5-Level GRIT Scale**:
1. **Vision:** Expanding the dream without judgment.
2. **Foundation:** Strategic hardening and logical stress testing.
3. **Burden of Proof:** Demanding data, market validation, and revenue potential.
4. **Investor-Ready:** Ruthless simulation of VC environments (CAC, LTV, scalability).
5. **Launch/Prototype Ready:** Shifting into deep technical architecture and generating "Vibe Coding Startprompts".

*Crucially*, Drogon employs a highly calibrated tone: **Hardened CTO / Senior Partner**. He firmly challenges flawed mechanics, refuses to use generic AI fluff, takes ownership of architecture, and demands specific, high-bar technical and business standards. He does not summarize or repeat user input—he only builds on top of it.

## Architecture & Tech-Stack

Drogon is built upon the **Antigravity Starter Kit** stack:
- **Framework:** Next.js 16 (App Router) with full Server and Client component hydration.
- **Styling:** Custom Antigravity Deep Obsidian `#060913` & Amber `#F59E0B` variables via Tailwind v4.
- **Database & Auth:** Supabase SSR with specific Postgres RLS capabilities.
- **AI Engine:** `@ai-sdk/openai` running `gpt-4o` via secure backend-proxy.
- **Hosting & CI/CD:** Vercel (Edge-caching).

### Key Features
- **Route Protection Tunnel:** Accessing `localhost:3000` automatically bounces unauthenticated traffic to the secure Danish `/login` portal.
- **The Context GEM:** When interacting with Drogon, typing `GEM [Project Name]` triggers the backend API to physically parse the business specifications via `generateObject`, embed them into a 1536-dimensional vector array utilizing `text-embedding-3-small`, and push it instantly to Supabase's `project_vectors` table under the secure User ID.
- **Phased Handoff Architecture:** To prevent the AI's Context Window from degrading during long project sessions, Drogon supports a manual "Handoff & Nyt Spor". This server action automatically condenses the raw chat history into a dense, strategic `system` summary, archives the noise (`is_archived = true`), and resets the AI's context window while retaining perfect architectural continuity.
- **Dynamic RAG & Self-Awareness:** Every normal chat prompt is prepended with semantic relevance tracking from the `match_project_vectors` RPC function in Supabase. A strict custom directive completely overwrites the base LLM hallucination of "I have no memory", providing Drogon with full structural self-awareness of his own Postgres connections.
- **Client-Side Image Compression:** To bypass Vercel's strict 4.5MB Edge Payload limits, all multimedia uploads are client-rendered to an invisible Canvas overlay, scaled to a 1200px max-dimension, and encoded as 70% quality JPEGs directly within `page.tsx` before transmission.
- **Interactive Grit Level UI:** The "Grit Level" is wired directly into the chat system. Clicking the Grit UI component changes React State, pipelines integer parameters down the chat HTTP Request body, and re-factors Drogon's real-time baseline system prompt.
- **Multi-Tenant Isolation:** Supabase RLS-politikker sikrer, at `auth.uid()` altid valideres mod rækkens ejerskab. En bruger kan kun læse, opdatere og slette sine egne data.

### Vercel Deployment & AI Streaming
To ensure a stable, buffered-free data stream between Vercel and the UI:
- **Edge Runtime:** The chat API route (`src/app/api/chat/route.ts`) is strictly forced onto `runtime = 'edge'` to prevent Node.js layer buffering.
- **Synchronous Preflight:** Because an asynchronous streaming error (like an invalid OpenAI key during stream hook instantiation) can silently truncate with a 200 OK, a synchronous `generateObject` preflight flight checks the validity of API credentials.
- **Native UI Stream Interception:** When Drogon executes internal backend tasks (like interacting with Supabase databases during a GEM), the completion is seamlessly handed over to `streamText()` rather than mocking raw chunk strings. This forces full compliance with Vercel's strict `toUIMessageStreamResponse()` protocol.

## Local Boot Requirements

To initiate the node locally:

1. Navigate to the `src` folder. The workspace root is `src/`.
2. Copy `.env.example` to `.env.local`.
3. Hardcode your Supabase URL and Publishable keys.
4. Slot an operational `OPENAI_API_KEY` into `.env.local` to awaken the core routing logic.
5. Run `npm run dev` inside `src` and navigate to [http://localhost:3000](http://localhost:3000).

---
*Note: This architecture is the project's source of truth. Any deviations or structural pivots must be deliberately tracked.*
