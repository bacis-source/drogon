import { FileText, FolderLock, UploadCloud, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function DocumentsPage() {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0A0F1E] nice-scrollbar">
      {/* Header */}
      <header className="p-8 pb-4 border-b border-slate-800/60 bg-[#0B0F19]/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2 opacity-80">
          <FolderLock className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase">SECURE VAULT</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase">DOKUMENTER</h1>
      </header>

      {/* Content */}
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        
        {/* Empty State Vault */}
        <div className="bg-[#111626] border border-slate-800/80 rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] pointer-events-none"></div>

          <div className="w-20 h-20 rounded-2xl bg-[#161C2C] border border-slate-700/50 flex items-center justify-center mb-6 shadow-inner z-10">
             <FileText className="w-10 h-10 text-slate-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-200 uppercase tracking-widest mb-3 z-10">Intet i Vaulten Endnu</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-8 z-10">
            Drogon Cloud Storage integration (Supabase Storage) er ved at blive klargjort. Snart vil alle dine kravspecifikationer, NDA'er og pitch-decks blive krypteret og gemt her.
          </p>
          
          <Button disabled className="bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 px-8 py-6 rounded-xl font-bold uppercase tracking-wider cursor-not-allowed z-10 flex items-center gap-2">
            <UploadCloud className="w-5 h-5" />
            Upload Filer (Kommer Snart)
          </Button>

          <div className="mt-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/40 border border-slate-700/50 z-10">
             <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
             <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">End-To-End Krypteret Vault</span>
          </div>
        </div>

      </div>
    </div>
  );
}
