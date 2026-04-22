<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🐉 Drogon Psychological Hardcoding Rule

**CRITICAL INSTRUCTION TO ALL FUTURE AGENTS:**
This repository houses "Drogon", an elite business advising AI mimicking the "Dragon's Den" investor format. 
The core system prompt located inside `src/app/api/chat/route.ts` contains highly specific psychological directives designed to push back on startup ideas ruthlessly while actively avoiding "founder's burnout". 
**DO NOT** overwrite, simplify, or abstract the system prompt away from its profound 5-Level GRIT cognitive framework. It must maintain the "Supportive Authority" identity. Any code refactoring around the Next.js routing **must preserve** these hardcoded prompt mechanics precisely as written.

# ⚡ Vercel Edge Serverless Streaming Rules
When modifying the Vercel AI SDK integration inside `src/app/api/chat/route.ts`:
1. **Never use `toDataStreamResponse()` or `toTextStreamResponse()`** for the `useChat` frontend. The installed `@ai-sdk/react` library expects Server-Sent Events natively emitted solely via `result.toUIMessageStreamResponse()`.
2. Do not remove the `maxDuration = 60` or `runtime = 'edge'` directives, to counteract aggressive Vercel timeouts and stealth buffering.
3. Keep the synchronous `generateObject` API validation flight intact before stream delivery to protect the Application from silent 200 OK crashes on invalid quota/keys.
