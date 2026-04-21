/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useChat } from "@ai-sdk/react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat();
  const isLoading = status !== "ready" && status !== "error";
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const payload = {
      role: "user" as const,
      content: input,
      parts: [{ type: "text", text: input }]
    };
    
    // @ts-expect-error - AI SDK evolving API types
    sendMessage(payload);
    setInput("");
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-[#0B0F19] text-slate-200">
      <header className="flex-none p-4 border-b border-cyan-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <h1 className="text-xl font-semibold tracking-tight text-cyan-50">Drogon</h1>
        </div>
        <div className="text-xs font-mono text-cyan-600/70">SECURE CHANNEL</div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-6 pb-2">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 mt-32 space-y-4">
              <h2 className="text-2xl font-light tracking-wide text-cyan-100">Welcome to Antigravity</h2>
              <p className="text-sm">Identify your objective to Master Architect Drogon.</p>
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  m.role === "user"
                    ? "bg-cyan-900/20 text-cyan-50 border border-cyan-800/30"
                    : "bg-[#101625] text-slate-300 border border-slate-800 shadow-md"
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-60 text-cyan-400">
                  {m.role === "user" ? "You" : "Drogon"}
                </div>
                <div className="leading-relaxed whitespace-pre-wrap">
                  {(m as any).content || ((m as any).parts && (m as any).parts.map((p: any) => p.text).join(""))}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-5 py-3 bg-[#101625] text-slate-300 border border-slate-800 shadow-md">
                <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-cyan-500 flex items-center gap-2">
                  Drogon
                  <span className="flex gap-1 ml-1">
                    <span className="w-1 h-1 rounded-full bg-cyan-500 animate-bounce" />
                    <span className="w-1 h-1 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1 h-1 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
                <div className="text-slate-500 animate-pulse italic text-sm">Thinking...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-none p-4 max-w-4xl w-full mx-auto mb-2">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center bg-[#101625] rounded-full border border-cyan-900/40 focus-within:border-cyan-500/60 focus-within:shadow-[0_0_15px_rgba(34,211,238,0.15)] transition-all overflow-hidden px-2 py-1"
        >
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type 'GEM [Project Name]' to save context, or ask a question..."
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-cyan-50 placeholder:text-slate-600 h-10 px-4"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
            className="rounded-full bg-cyan-600 hover:bg-cyan-500 text-[#0B0F19] transition-colors w-10 h-10 flex-shrink-0 ml-2 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
          >
            <SendHorizontal className="w-4 h-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
