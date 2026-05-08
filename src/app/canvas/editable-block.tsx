'use client'

import { useState, useRef, useEffect } from 'react'
import { updateCanvasBlock } from './actions'
import { Pencil, Check, Loader2, X } from 'lucide-react'

interface EditableBlockProps {
  projectId: string
  blockKey: string
  title: string
  content: string
  className?: string
  icon?: React.ReactNode
}

export function EditableBlock({ projectId, blockKey, title, content, className, icon }: EditableBlockProps) {
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
    const result = await updateCanvasBlock(projectId, blockKey, value)
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
    <div className={`relative group bg-[#111626] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 transition-all flex flex-col h-full overflow-hidden ${className}`}>
      {/* Background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 z-10 border-b border-slate-800/50 pb-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
              {icon}
            </div>
          )}
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">{title}</h2>
        </div>
        
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-md transition-colors opacity-0 group-hover:opacity-100"
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
              className="flex-1 w-full bg-[#0A0F1E] text-slate-300 text-sm leading-relaxed p-3 rounded-lg border border-slate-700 focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] outline-none resize-none transition-colors"
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
                className="p-2 px-4 text-xs font-bold uppercase tracking-wider bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0F1E] rounded-lg transition-colors flex items-center gap-1.5"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Gem
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => setIsEditing(true)}
            className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap cursor-pointer group-hover:text-slate-300 transition-colors h-full"
          >
            {value ? value : <span className="italic opacity-50 block mt-2 text-center text-slate-500">Intet indhold endnu. Klik for at redigere eller bed Drogon udfylde det i chatten.</span>}
          </div>
        )}
      </div>
    </div>
  )
}
