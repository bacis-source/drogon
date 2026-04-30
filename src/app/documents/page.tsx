import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { FileText, FolderLock, ShieldAlert, ArrowRight, Download, Trash2 } from "lucide-react";
import Link from "next/link";
import { UploadButton } from "./upload-button";
import { deleteDocument } from "./actions";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0B0F19] text-center h-full">
        <div className="w-24 h-24 rounded-full bg-[#111626] border border-slate-800 flex items-center justify-center mb-6 shadow-2xl">
           <FolderLock className="w-10 h-10 text-slate-700" />
        </div>
        <h2 className="text-2xl font-bold text-slate-300 mb-3 tracking-widest uppercase">Intet Projekt Startet</h2>
        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
          Gå tilbage til samtalen med Drogon for at oprette din første idé, før du bruger Vaulten.
        </p>
        <Link href="/" className="flex items-center gap-2 px-6 py-3 bg-[#F59E0B] text-[#0A0F1E] font-bold rounded-full uppercase tracking-wider text-sm hover:bg-[#EAB308] transition-colors">
          Start Samtale <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // Fetch files securely via Admin client
  const adminSupabase = createAdminClient();
  const folderPath = `${user.id}/${project.id}`;
  
  const { data: files, error } = await adminSupabase.storage
    .from('drogon_vault')
    .list(folderPath);

  // Generate signed URLs for all valid files (ignoring the .emptyFolderPlaceholder if any)
  const validFiles = files?.filter(f => f.name !== '.emptyFolderPlaceholder') || [];
  
  const filesWithUrls = await Promise.all(
    validFiles.map(async (f) => {
      const filePath = `${folderPath}/${f.name}`;
      const { data } = await adminSupabase.storage
        .from('drogon_vault')
        .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
      return {
        name: f.name.replace(/^\d+_/, ''), // Remove timestamp prefix for display
        path: filePath,
        url: data?.signedUrl || '#',
        size: ((f.metadata?.size || 0) / 1024).toFixed(1) + ' KB',
        created_at: new Date(f.created_at || Date.now()).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
      };
    })
  );

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0A0F1E] nice-scrollbar">
      {/* Header */}
      <header className="p-8 pb-4 border-b border-slate-800/60 bg-[#0B0F19]/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2 opacity-80">
          <FolderLock className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase">SECURE VAULT</span>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase">{project.name}</h1>
      </header>

      {/* Content */}
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        
        {/* Upload Action Area */}
        <div className="bg-gradient-to-r from-[#161324] to-[#0D121F] border border-purple-900/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-[80px] pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
          
          <div className="flex-1 z-10 mb-6 md:mb-0">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/50 w-max mb-4">
               <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
               <span className="text-[9px] font-bold tracking-widest text-purple-400 uppercase">End-To-End Krypteret Vault</span>
             </div>
             <h2 className="text-2xl font-bold text-white mb-2">Upload Fortrolige Filer</h2>
             <p className="text-slate-400 max-w-md">
               Alt materiale her i vaulten er total-sikret og låst eksklusivt til dit projekt.
             </p>
          </div>
          
          <UploadButton projectId={project.id.toString()} />
        </div>

        {/* File List */}
        {filesWithUrls.length > 0 ? (
          <div className="bg-[#111626] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
             <div className="bg-[#161C2C] border-b border-slate-800/80 px-6 py-4 flex items-center">
                <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">Dine Filer ({filesWithUrls.length})</span>
             </div>
             <div className="divide-y divide-slate-800/50">
               {filesWithUrls.map((f, i) => (
                 <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors group">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                          <FileText className="w-5 h-5 text-purple-400" />
                       </div>
                       <div>
                         <h3 className="text-sm font-bold text-slate-200 mb-0.5">{f.name}</h3>
                         <div className="flex gap-3 text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                           <span>{f.size}</span>
                           <span>•</span>
                           <span>{f.created_at}</span>
                         </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                       <a href={f.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-md hover:bg-slate-700 transition-colors" title="Download">
                         <Download className="w-4 h-4" />
                       </a>
                       {/* Note: Delete requires a client form to call the server action. 
                           For a simple MVP, we just use a form wrapper. */}
                       <form action={async () => {
                         'use server';
                         await deleteDocument(f.path);
                       }}>
                         <button type="submit" className="p-2 bg-red-900/20 text-red-400 hover:text-red-300 rounded-md hover:bg-red-900/40 transition-colors" title="Slet">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </form>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        ) : (
          <div className="bg-[#111626] border border-slate-800/50 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 rounded-2xl bg-slate-800/30 flex items-center justify-center mb-4">
                <FolderLock className="w-8 h-8 text-slate-600" />
             </div>
             <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-1">Vaulten er tom</h3>
             <p className="text-sm text-slate-500 max-w-sm">Dine uploadede NDAs, skitser og kontrakter vil blive vist her i skyen.</p>
          </div>
        )}

      </div>
    </div>
  );
}
