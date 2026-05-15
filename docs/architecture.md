# Arkitektur

## Formål
At levere en AI-drevet, "no-bullshit" CTO/CSO-rådgiver (Drogon), der hjælper founders med at validere koncepter, gennemtvinge data-drevne beslutninger og strukturere teknisk arkitektur.

## Frontend
- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS v4 med "Antigravity" design-tokens (Deep Obsidian & Amber).
- **Komponenter:** Server og Client Components, herunder et dynamisk chat-interface og side-paneler (Canvas/Vault) for struktureret datahåndtering.
- **Client-Side Processing:** Billedkomprimering i browseren (Canvas API) før upload for at overholde Vercel's payload-grænser.

## Backend / Logik
- **AI Motor:** Google Generative AI (Gemini 2.5 Flash) via `@ai-sdk/google` for chat-interaktioner og store kontekstvinduer. OpenAI (`gpt-4o`) anvendes sekundært til strukturerede data-udtræk (JSON generering) via `generateObject`.
- **Database:** Supabase (PostgreSQL) til lagring af chat-historik, bruger-projekter og "vault" dokumenter.
- **Vektor-Søgning (RAG):** Embeddings genereres ved hjælp af OpenAI's `text-embedding-3-small` og søges via Supabase `pgvector` for at give Drogon lynhurtig hukommelse om eksisterende projekter uden at sprænge token-grænserne.
- **Hosting & Runtime:** Vercel (Edge-funktioner til streaming for lav latency).

## Flow
1. **Bruger-input:** Brugeren sender en besked eller uploader et dokument (billede/tekst) via chat-grænsefladen.
2. **Kontekst-indsamling:** Backend henter automatisk aktiv projekt-data (Lean Canvas, Arkitektur) og dokumenter fra "The Vault" via Supabase.
3. **AI Streaming:** System-prompt og kontekst samles og sendes til Gemini 2.5 Flash. Svaret streames asynkront tilbage til klienten ("Edge Runtime").
4. **Handoff (Nyt Spor):** Når konteksten bliver for rodet, kan brugeren trigge et "Handoff", hvor AI'en opsummerer samtalen, gemmer konklusionerne i det aktive projekt, arkiverer chatten (`is_archived = true`) og nulstiller chat-vinduet.

## Bevidste simplificeringer
- **Ingen kompliceret brugerstyring:** Autentificering håndteres simpelt via Supabase Auth.
- **Opdelt AI-brug:** Gemini bruges til den ustrukturerede "Drogon" dialog for at omgå OpenAI's aggressive sikkerhedsfiltre, mens OpenAI bruges til deterministisk data-parsing.
