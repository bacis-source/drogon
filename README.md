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
- **Dynamic RAG:** Every normal chat prompt is prepended with semantic relevance tracking from the `match_project_vectors` RPC function in Supabase, meaning Drogon *remembers* past GEM sessions.

## Local Boot Requirements

To initiate the node locally:

1. Copy `.env.example` to `.env.local`.
2. Hardcode your Supabase URL and Publishable keys.
3. Slot an operational `OPENAI_API_KEY` into `.env.local` to awaken the core routing logic.
4. Run `npm run dev` and navigate to [http://localhost:3000](http://localhost:3000).

---
*Note: This architecture is the project's source of truth. Any deviations or structural pivots must be deliberately tracked.*
