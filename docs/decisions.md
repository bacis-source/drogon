# Beslutninger

## Retningslinje
- Hver beslutning skal kunne spores tilbage til kravspecifikationen eller en bevidst afvigelse fra den.

## Skabelon
### 15. Maj 2026 - Migration fra OpenAI (gpt-4o) til Google Gemini (2.5 Flash)
- **Hvad valgte vi?** Vi udskiftede den primære LLM-motor fra OpenAI's `gpt-4o` til Google's `gemini-2.5-flash` via Vercel AI SDK (`@ai-sdk/google`).
- **Hvorfor?** OpenAI's indbyggede sikkerhedsfiltre overstyrede gentagne gange system-prompten og nægtede at spille rollen som en ufiltreret, kynisk CTO, hvilket resulterede i fejlmeddelelser ("I'm sorry, I can't assist with that"). Gemini 2.5 Flash har en mere robust accept af komplekse, persona-drevne system-prompts uden at udløse falske positive sikkerhedsadvarsler. Desuden understøtter Gemini et 1 million-token kontekstvindue, hvilket er ideelt for vores projekt-vault struktur.
- **Tekniske Justeringer:** Vi fjernede ikke-understøttede parametre (`frequencyPenalty`, `presencePenalty`) fra API-kaldet for at matche Googles Generative Language API-schema og fjernede "Few-Shot" dialog-eksempler fra system-prompten for at forhindre Gemini i at hallucinere fiktive samtaler.
- **Hvad fravalgte vi?** Vi fravalgte OpenAI og `gpt-4o` for kerne-chatten, selvom `gpt-4o` stadig bruges til hurtig metadatakstraktion og navnegenerering, hvor sikkerhedsfilteret ikke rammes. Vi fravalgte også Gemini 1.5-serien og "Pro" modeller, da de blev blokeret af EU/Google Free Tier-kvoter (limit: 0).
