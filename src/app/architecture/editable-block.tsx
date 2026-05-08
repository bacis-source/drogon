'use client'

import { useState, useRef, useEffect } from 'react'
import { updateArchitectureBlock } from './actions'
import { Pencil, Check, Loader2, X } from 'lucide-react'

interface EditableBlockProps {
  projectId: string
  blockKey: string
  title: string
  content: string
  className?: string
  icon?: React.ReactNode
}

export function EditableArchitectureBlock({ projectId, blockKey, title, content, className, icon }: EditableBlockProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(content)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setValue(content)
  }, [content])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length)
    }
  }, [isEditing])

  const handleSave = async () => {
    if (value === content) {
      setIsEditing(false)
      return
    }
    
    setIsSaving(true)
    const result = await updateArchitectureBlock(projectId, blockKey, value)
    setIsSaving(false)
    
    if (result.error) {
      alert("Fejl ved gemning: " + result.error)
      setValue(content)
    } else {
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setValue(content)
    setIsEditing(false)
  }

  return (
    <div className={`relative group bg-[#0B101D] border border-blue-900/30 hover:border-blue-500/50 rounded-2xl p-6 transition-all flex flex-col h-full overflow-hidden shadow-[0_0_15px_rgba(59,130,246,0.02)] hover:shadow-[0_0_20px_rgba(59,130,246,0.05)] ${className}`}>
      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 z-10 border-b border-blue-900/30 pb-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-blue-950/40 flex items-center justify-center border border-blue-800/30">
              {icon}
            </div>
          )}
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-widest">{title}</h2>
        </div>
        
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-blue-500 hover:text-blue-300 hover:bg-blue-900/30 rounded-md transition-colors opacity-0 group-hover:opacity-100"
            title="Rediger"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col z-10 h-full overflow-y-auto nice-scrollbar pr-2">
        {isEditing ? (
          <div className="flex flex-col h-full gap-3">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={isSaving}
              className="flex-1 w-full bg-[#050810] text-blue-100 text-sm leading-relaxed p-3 rounded-lg border border-blue-800 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none resize-none transition-colors font-mono"
              placeholder={`Beskriv ${title.toLowerCase()} her...`}
            />
            <div className="flex justify-end gap-2 mt-auto">
              <button 
                onClick={handleCancel}
                disabled={isSaving}
                className="p-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" /> Annuller
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="p-2 px-4 text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-[0_0_10px_rgba(37,99,235,0.3)]"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Gem
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap cursor-pointer group-hover:text-blue-100 transition-colors h-full font-mono"
          >
            {value ? value : <span className="italic opacity-50 block mt-2 text-center text-blue-800">Intet indhold endnu. Klik for at redigere eller bed Drogon udfylde det i chatten.</span>}
          </div>
        )}
      </div>
    </div>
  )
}
