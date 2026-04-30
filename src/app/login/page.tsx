"use client";

import { login, signup, resetPassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, User, Lock, Compass, CheckCircle2 } from "lucide-react";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

type AuthMode = 'login' | 'signup' | 'forgot_password';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  
  const [mode, setMode] = useState<AuthMode>('login');

  let formAction;
  let submitText;
  if (mode === 'signup') {
    formAction = signup;
    submitText = "Opret Konto";
  } else if (mode === 'forgot_password') {
    formAction = resetPassword;
    submitText = "Send Nulstillingslink";
  } else {
    formAction = login;
    submitText = "Start Session";
  }

  return (
    <div className="min-h-screen bg-[#060913] text-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-[#0E1320] rounded-[2.5rem] border border-slate-800/40 p-10 pb-8 shadow-2xl relative">
        
        {/* Drogon Header */}
        <div className="text-center mt-10 mb-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-[1.2rem] bg-[#F59E0B] flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
             <Compass className="w-8 h-8 text-[#060913]" fill="#060913" stroke="white" strokeWidth={1} />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1">DROGON</h1>
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#F59E0B]">
              MASTER ARCHITECT OS
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-900/50 flex items-center gap-3 text-red-400 text-sm">
             <ShieldAlert className="w-4 h-4 flex-shrink-0" />
             {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-green-900/20 border border-green-900/50 flex items-center gap-3 text-green-400 text-sm">
             <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
             {message}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#F59E0B] transition-colors">
              <User className="h-5 w-5" />
            </div>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="Email"
              className="bg-[#050810] border-0 focus-visible:ring-1 focus-visible:ring-[#F59E0B]/50 text-white placeholder:text-slate-500 h-14 pl-12 rounded-xl text-base shadow-inner"
              required 
            />
          </div>

          {mode === 'signup' && (
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#F59E0B] transition-colors">
                <User className="h-5 w-5" />
              </div>
              <Input 
                id="full_name" 
                name="full_name" 
                type="text" 
                placeholder="Fornavn (Hvordan skal Drogon tiltale dig?)"
                className="bg-[#050810] border-0 focus-visible:ring-1 focus-visible:ring-[#F59E0B]/50 text-white placeholder:text-slate-500 h-14 pl-12 rounded-xl text-base shadow-inner"
                required={mode === 'signup'}
              />
            </div>
          )}
          
          {mode !== 'forgot_password' && (
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#F59E0B] transition-colors">
                <Lock className="h-5 w-5" />
              </div>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="Adgangskode"
                className="bg-[#050810] border-0 focus-visible:ring-1 focus-visible:ring-[#F59E0B]/50 text-white placeholder:text-slate-500 h-14 pl-12 rounded-xl text-base shadow-inner"
                required
              />
            </div>
          )}

          {mode === 'login' && (
            <div className="flex justify-end pt-1 pb-4">
              <button 
                type="button" 
                onClick={() => setMode('forgot_password')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-400 transition-colors uppercase tracking-wider"
              >
                Glemt adgangskode?
              </button>
            </div>
          )}

          {mode !== 'login' && <div className="pb-4"></div>}

          <Button 
            key={mode}
            type="submit"
            className="w-full bg-[#F59E0B] hover:bg-[#EAB308] text-[#050810] font-bold text-base h-14 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all flex items-center justify-center gap-2"
          >
            {submitText}
            <span className="text-xl leading-none -mt-1 hover:translate-x-1 duration-200">→</span>
          </Button>
          
          <div className="text-center pt-6 pb-4">
            <button 
              type="button" 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-xs font-semibold text-slate-400 hover:text-[#F59E0B] transition-colors uppercase tracking-wider"
            >
              {mode === 'login' ? "ny visionær? opret en konto her" : "allerede visionær? log ind her"}
            </button>
          </div>
        </form>

        {/* Footer info matching screenshot */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 flex justify-center items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 opacity-60" />
                END-TO-END SAFE
            </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#060913] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#F59E0B] border-t-transparent animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
