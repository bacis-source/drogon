'use client'

import { useState } from "react"
import { inviteTeamMember } from "../actions/team"
import { Loader2, MailPlus } from "lucide-react"

export function InviteForm({ projectId }: { projectId: string }) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<{type: 'idle' | 'loading' | 'success' | 'error', msg: string}>({ type: 'idle', msg: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return

    setStatus({ type: 'loading', msg: 'Inviterer...' })
    
    const res = await inviteTeamMember(projectId, email)
    
    if (res.error) {
      setStatus({ type: 'error', msg: res.error })
    } else {
      setStatus({ type: 'success', msg: `Invitation sendt til ${email}!` })
      setEmail("")
      setTimeout(() => setStatus({ type: 'idle', msg: '' }), 3000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="relative">
        <input 
          type="email" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="kollega@startup.dk"
          className="w-full bg-[#0A0F1E] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          disabled={status.type === 'loading'}
        />
      </div>
      
      <button 
        type="submit" 
        disabled={status.type === 'loading' || !email}
        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl py-3 text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status.type === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MailPlus className="w-4 h-4" />
        )}
        Send Invitation
      </button>

      {status.msg && (
        <p className={`text-xs text-center font-bold mt-2 ${status.type === 'error' ? 'text-red-400' : status.type === 'success' ? 'text-emerald-400' : 'text-slate-400'}`}>
          {status.msg}
        </p>
      )}
    </form>
  )
}
