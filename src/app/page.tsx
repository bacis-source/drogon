/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useChat } from "@ai-sdk/react";
import { SendHorizontal, Mic, Paperclip, Cloud, Save, Zap, Star, LayoutTemplate, Trophy, Loader2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";

export default function ChatPage() {
  const { messages, sendMessage, status, error } = useChat();
  const isLoading = status !== "ready" && status !== "error";
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<{name: string, url: string}[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result as string;
        setAttachments(prev => [...prev, { name: file.name, url: base64Url }]);
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;
    
    const inputParts: any[] = [];
    if (input.trim()) inputParts.push({ type: "text", text: input });
    attachments.forEach(att => inputParts.push({ type: "image", image: att.url }));

    const payload = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: input || " ",
      parts: inputParts.length > 0 ? inputParts : undefined
    };
    
    // @ts-expect-error - AI SDK evolving API types
    sendMessage(payload);
    setInput("");
    setAttachments([]);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-[#0E1320] text-slate-200">
      
      {/* 1. Top Bar */}
      <header className="flex-none p-6 flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-900/50 bg-[#0E2024] opacity-80 backdrop-blur-sm">
          <Cloud className="w-3.5 h-3.5 text-teal-500" />
          <span className="text-[10px] font-bold tracking-widest text-teal-500 uppercase">CLOUD SIKRET</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 border border-[#F59E0B] rounded-full text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors">
            <Save className="w-4 h-4" />
            <span className="text-[10px] font-bold tracking-widest uppercase">GEM VISION</span>
          </button>
          
          <div className="flex items-center gap-3 px-4 py-2 bg-[#161C2C] border border-slate-800/80 rounded-full">
             <Zap className="w-4 h-4 text-[#F59E0B]" />
             <div className="flex gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] opacity-30"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] opacity-30"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] opacity-30"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] opacity-30"></span>
             </div>
             <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">GRIT LEVEL 1</span>
          </div>
        </div>
      </header>
      
      {/* 2. Main Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-8 pb-2">
          
          {messages.length === 0 && (
            <div className="flex justify-start items-start gap-4 mt-8">
              <div className="w-8 h-8 rounded-full bg-[#F59E0B] flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <Flame className="w-4 h-4 text-[#0E1320]" fill="#0E1320" />
              </div>
              <div className="max-w-[70%] rounded-2xl rounded-tl-sm px-6 py-5 bg-[#111626] border border-slate-800/60 shadow-lg text-slate-300">
                <p className="leading-relaxed whitespace-pre-wrap text-[15px]">
                  Velkommen som Arkitekt. Jeg er klar til at bygge din første vision.<br/><br/>
                  Fortæl mig om din idé – hvilket problem løser vi?
                </p>
              </div>
            </div>
          )}

          {messages.map((m) => (
             <div key={m.id} className={`flex items-start gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
               
               {m.role !== "user" && (
                 <div className="w-8 h-8 rounded-full bg-[#F59E0B] flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                   <Flame className="w-4 h-4 text-[#0E1320]" fill="#0E1320" />
                 </div>
               )}

               <div className={`max-w-[70%] rounded-2xl px-6 py-5 ${
                  m.role === "user"
                    ? "bg-[#1E253A] text-white border border-slate-700/50 rounded-tr-sm"
                    : "bg-[#111626] text-slate-300 border border-slate-800/60 rounded-tl-sm shadow-lg"
                }`}>
                  <div className="leading-relaxed whitespace-pre-wrap text-[15px]">
                    {(m as any).content && <p>{(m as any).content}</p>}
                    {(m as any).parts && (m as any).parts.map((p: any, i: number) => {
                       if (p.type === 'image') return <img key={i} src={p.image} className="max-w-md w-full rounded-xl mt-3 mb-2 border border-slate-700/50 block shadow-lg object-contain bg-[#0E1320]" alt="attachment" />;
                       if (p.type === 'text' && !(m as any).content) return <p key={i}>{p.text}</p>;
                       return null;
                    })}
                  </div>
               </div>
             </div>
          ))}

          {isLoading && (
            <div className="flex justify-start items-start gap-4">
               <div className="w-8 h-8 rounded-full bg-[#F59E0B] flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                 <Loader2 className="w-4 h-4 text-[#0E1320] animate-spin" />
               </div>
               <div className="max-w-[70%] rounded-2xl rounded-tl-sm px-6 py-5 bg-[#111626] border border-slate-800/60 text-slate-400">
                  <div className="flex gap-1.5 items-center italic">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
               </div>
            </div>
          )}

          {error && (
            <div className="flex justify-start items-start gap-4">
               <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                 <span className="text-red-500 font-bold">!</span>
               </div>
               <div className="max-w-[70%] rounded-2xl rounded-tl-sm px-6 py-5 bg-[#111626] border border-red-900/50 text-red-400">
                  <p className="font-bold mb-1">System Fejl (Backend)</p>
                  <p className="text-sm break-all">{error.message}</p>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Input Zone */}
      <div className="flex-none p-6 pt-2 w-full max-w-4xl mx-auto flex flex-col gap-6">

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex gap-3 px-2 flex-wrap">
            {attachments.map((att, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-700 w-16 h-16 bg-[#161C2C]">
                <img src={att.url} alt="upload" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                <button 
                  type="button" 
                  onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-900/80 hover:bg-red-500/90 flex items-center justify-center text-white text-[10px] font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="relative flex items-center bg-[#111626] border border-slate-800/80 rounded-[2rem] px-2 py-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.4)] focus-within:border-slate-700 transition-colors">
          <button type="button" className="p-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
            <Mic className="w-5 h-5" />
          </button>
          
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Fortæl mig om din næste store idé eller upload materiale..."
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-slate-600 h-10 px-2 text-[15px]"
          />
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*" 
            multiple 
            className="hidden" 
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
            <Paperclip className="w-5 h-5" />
          </button>

          <Button
            type="submit"
            disabled={isLoading || (!input.trim() && attachments.length === 0)}
            className="rounded-full bg-[#202940] hover:bg-[#2A3655] text-slate-300 transition-colors w-12 h-12 flex-shrink-0 ml-1 flex items-center justify-center border border-slate-700/50"
          >
            <SendHorizontal className="w-5 h-5 ml-0.5" />
          </Button>
        </form>

        {/* Toolbar Links */}
        <div className="flex justify-center items-center gap-8 pb-4">
          <button className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase hover:opacity-80 transition-opacity">
            <Star className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-[#F59E0B]">INVESTOR PAKKE</span>
          </button>
          <button className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase hover:opacity-80 transition-opacity text-blue-400">
            <LayoutTemplate className="w-4 h-4" />
            TEKNISK KRAVSPEC
          </button>
          <button className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase hover:opacity-80 transition-opacity text-red-500">
            <Trophy className="w-4 h-4" />
            DRAGONS DEN
          </button>
          <button className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase hover:opacity-80 transition-opacity text-[#F59E0B]">
            <Zap className="w-4 h-4" />
            STATUS
          </button>
        </div>
      </div>
    </div>
  );
}
