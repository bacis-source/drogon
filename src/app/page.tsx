/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useChat } from "@ai-sdk/react";
import { SendHorizontal, Mic, Paperclip, Cloud, Save, Zap, Star, LayoutTemplate, Trophy, Loader2, Flame, FileText, X } from "lucide-react";
import * as mammoth from "mammoth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage() {
  const [gritLevel, setGritLevel] = useState<number>(1);
  const { messages, sendMessage, status, error } = useChat({
    // @ts-ignore - 'body' property causes type errors in Vercel build but works perfectly at runtime
    body: { gritLevel },
  });
  const isLoading = status !== "ready" && status !== "error";
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<{name: string, url: string}[]>([]);
  const [documentTexts, setDocumentTexts] = useState<{name: string, content: string}[]>([]);

  const processFiles = (files: File[]) => {
    for (const file of files) {
      if (file.name.endsWith('.docx') || file.type.includes('wordprocessingml')) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const arrayBuffer = reader.result as ArrayBuffer;
            const result = await mammoth.extractRawText({ arrayBuffer });
            let text = result.value;
            const CHAR_LIMIT = 30000;
            if (text.length > CHAR_LIMIT) {
              text = text.slice(0, CHAR_LIMIT);
              alert(`Husk at systemet udtrækker max ~10 sider. Dokumentet "${file.name}" er blevet afkortet for at skåne dit budget.`);
            }
            setDocumentTexts(prev => [...prev, { name: file.name, content: text }]);
          } catch (err) {
            console.error("Fejl ved læsning af Word-dokument:", err);
            alert(`Kunne ikke læse Word-dokumentet: ${file.name}`);
          }
        };
        reader.readAsArrayBuffer(file);
      } 
      else if (file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          let text = reader.result as string;
          const CHAR_LIMIT = 30000;
          if (text.length > CHAR_LIMIT) {
             text = text.slice(0, CHAR_LIMIT);
             alert(`Husk at systemet udtrækker max ~10 sider. Dokumentet "${file.name}" er blevet afkortet for at skåne dit budget.`);
          }
          setDocumentTexts(prev => [...prev, { name: file.name, content: text }]);
        };
        reader.readAsText(file);
      }
      else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            const MAX_DIMENSION = 1200;
            if (width > height && width > MAX_DIMENSION) {
              height = Math.round((height * MAX_DIMENSION) / width);
              width = MAX_DIMENSION;
            } else if (height > MAX_DIMENSION) {
              width = Math.round((width * MAX_DIMENSION) / height);
              height = MAX_DIMENSION;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
              setAttachments(prev => [...prev, { name: file.name || 'Pasted Image', url: compressedBase64 }]);
            }
          };
          img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      processFiles(Array.from(e.clipboardData.files));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0 && documentTexts.length === 0) return;
    
    let combinedInput = input || " ";
    if (documentTexts.length > 0) {
      const docString = documentTexts.map(doc => `[VEDHÆFTET DOKUMENT: ${doc.name}]\n${doc.content}\n[SLUT PÅ DOKUMENT: ${doc.name}]`).join('\n\n');
      combinedInput = `${docString}\n\n${combinedInput}`;
    }

    const inputParts: any[] = [];
    if (combinedInput.trim()) inputParts.push({ type: "text", text: combinedInput });
    attachments.forEach(att => inputParts.push({ type: "image", image: att.url }));

    const payload = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: combinedInput,
      parts: inputParts.length > 0 ? inputParts : undefined
    };
    
    // @ts-expect-error - AI SDK evolving API types
    sendMessage(payload);
    setInput("");
    setAttachments([]);
    setDocumentTexts([]);
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
          <button 
            onClick={() => {
              setInput("GEM ");
              inputRef.current?.focus();
            }}
            className="flex items-center gap-2 px-4 py-2 border border-[#F59E0B] rounded-full text-[#F59E0B] hover:bg-[#F59E0B]/10 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="text-[10px] font-bold tracking-widest uppercase">GEM VISION</span>
          </button>
          
          <div 
            onClick={() => setGritLevel(prev => prev >= 5 ? 1 : prev + 1)}
            className="flex items-center gap-3 px-4 py-2 bg-[#161C2C] border border-slate-800/80 rounded-full cursor-pointer hover:bg-slate-800/90 transition-colors"
            title="Klik for at justere Drogons modstand (Grit Level 1-5)"
          >
             <Zap className="w-4 h-4 text-[#F59E0B]" />
             <div className="flex gap-1">
               {[1, 2, 3, 4, 5].map((level) => (
                 <span key={level} className={`w-1.5 h-1.5 rounded-full bg-[#F59E0B] ${gritLevel >= level ? 'opacity-100' : 'opacity-30'}`}></span>
               ))}
             </div>
             <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase select-none w-20">GRIT LEVEL {gritLevel}</span>
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
                  <div className="leading-relaxed whitespace-pre-wrap text-[15px] markdown-content">
                    {(m as any).content && (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2 text-[#F59E0B]" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-4 mb-2 text-[#F59E0B]" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-base font-bold mt-4 mb-2 text-[#F59E0B]" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="pl-1" {...props} />,
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          code: ({node, ...props}) => <code className="bg-slate-800/50 text-teal-400 px-1.5 py-0.5 rounded text-sm" {...props} />
                        }}
                      >
                        {(m as any).content}
                      </ReactMarkdown>
                    )}
                    {(m as any).parts && (m as any).parts.map((p: any, i: number) => {
                       if (p.type === 'image') return <img key={i} src={p.image} className="max-w-md w-full rounded-xl mt-3 mb-2 border border-slate-700/50 block shadow-lg object-contain bg-[#0E1320]" alt="attachment" />;
                       if (p.type === 'text' && !(m as any).content) return <div key={i}><ReactMarkdown remarkPlugins={[remarkGfm]}>{p.text}</ReactMarkdown></div>;
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
        {(attachments.length > 0 || documentTexts.length > 0) && (
          <div className="flex flex-wrap gap-2 px-6 pt-4">
            {attachments.map((att, i) => (
              <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-700/50 group/img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {documentTexts.map((doc, i) => (
              <div key={`doc-${i}`} className="flex gap-2 items-center bg-[#F59E0B]/10 pr-2 pl-3 py-1 rounded-md mb-2 h-8 border border-[#F59E0B]/20">
                 <FileText className="w-3 h-3 text-[#F59E0B]"/>
                 <span className="text-[10px] text-[#F59E0B] font-mono truncate max-w-[150px]">{doc.name}</span>
                 <button type="button" onClick={() => setDocumentTexts(prev => prev.filter((_, idx) => idx !== i))} className="text-[#F59E0B]/50 hover:text-[#F59E0B] transition-colors ml-1 p-1"><X className="w-3 h-3" /></button>
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
            onPaste={handlePaste}
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
          <Link href="/pitch" className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase hover:opacity-80 transition-opacity">
            <Star className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-[#F59E0B]">INVESTOR PAKKE</span>
          </Link>
          <Link href="/architecture" className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase hover:opacity-80 transition-opacity text-blue-400">
            <LayoutTemplate className="w-4 h-4" />
            TEKNISK KRAVSPEC
          </Link>
          <Link href="/pitch" className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase hover:opacity-80 transition-opacity text-red-500">
            <Trophy className="w-4 h-4" />
            DRAGONS DEN
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase opacity-50 cursor-help" title="System Monitor">
            <Zap className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-[#F59E0B]">STATUS ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
