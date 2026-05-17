import { Suspense } from "react";
import ClientFinancials from "./ClientFinancials";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function FinancialsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#060913] text-slate-200 p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1">Financial Model (MVP)</h1>
          <p className="text-sm text-slate-400">
            Real-time finansiel simulation og scenarie-test. 36 måneders fremskrivning.
          </p>
        </div>
      </div>
      
      <Suspense fallback={<div className="animate-pulse flex-1 bg-[#0E1320] rounded-2xl border border-slate-800/40"></div>}>
        <ClientFinancials />
      </Suspense>
    </div>
  );
}
