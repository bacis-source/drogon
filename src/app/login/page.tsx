import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldAlert } from 'lucide-react'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#101625] rounded-3xl border border-cyan-900/30 p-8 shadow-[0_0_40px_rgba(34,211,238,0.05)]">
        <div className="text-center mb-8 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-cyan-900/20 flex items-center justify-center border border-cyan-800/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
             <div className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-cyan-50">Secure Access</h1>
            <p className="text-sm text-cyan-600/70 py-1 font-mono">DROGON . MASTER ARCHITECT</p>
          </div>
        </div>

        {params?.error && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-900/50 flex items-center gap-3 text-red-400 text-sm">
             <ShieldAlert className="w-4 h-4" />
             {params.error}
          </div>
        )}

        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-cyan-500/70" htmlFor="email">
              Email Protocol
            </label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="operator@antigravity.sys"
              className="bg-[#0B0F19] border-cyan-900/40 focus-visible:ring-cyan-500/50 text-cyan-50 placeholder:text-slate-600"
              required 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-cyan-500/70" htmlFor="password">
              Clearance Key
            </label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="••••••••"
              className="bg-[#0B0F19] border-cyan-900/40 focus-visible:ring-cyan-500/50 text-cyan-50 placeholder:text-slate-600"
              required 
            />
          </div>

          <div className="pt-6 grid grid-cols-2 gap-4">
            <Button 
              formAction={login}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-[#0B0F19] font-medium shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all"
            >
              Authenticate
            </Button>
            <Button 
              formAction={signup} 
              variant="outline"
              className="w-full border-cyan-800/50 text-cyan-400 hover:bg-cyan-900/20 hover:text-cyan-300 transition-all font-medium"
            >
              Initialize Node
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
