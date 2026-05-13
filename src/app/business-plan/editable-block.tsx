'use client';

import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { updateBusinessPlanBlock } from './actions';

export function EditableBusinessPlanBlock({
  projectId,
  blockKey,
  title,
  content,
  icon
}: {
  projectId: string;
  blockKey: string;
  title: string;
  content: string;
  icon: React.ReactNode;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateBusinessPlanBlock(projectId, blockKey, value);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert('Der opstod en fejl ved gemning');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(content);
    setIsEditing(false);
  };

  return (
    <div className="bg-[#0B101D] border border-blue-900/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(59,130,246,0.03)] h-full flex flex-col group hover:border-blue-700/50 transition-all duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-bl-full -z-10 group-hover:bg-blue-600/10 transition-colors"></div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-900/20 border border-blue-800/30 flex items-center justify-center">
            {icon}
          </div>
          <h2 className="text-sm font-bold text-slate-300 tracking-wider uppercase">{title}</h2>
        </div>
        
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCancel}
              disabled={isSaving}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? <span className="w-4 h-4 block animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" /> : <Check className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-[100px] relative">
        {isEditing ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isSaving}
            className="w-full h-full min-h-[150px] bg-[#070A12] border border-blue-800/50 rounded-xl p-4 text-slate-300 font-mono text-sm leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 resize-y nice-scrollbar transition-all"
            placeholder={`Beskriv ${title.toLowerCase()} her...`}
          />
        ) : (
          <div 
            className="text-slate-400 leading-relaxed text-sm whitespace-pre-wrap"
            onClick={() => {
                if (!content) setIsEditing(true);
            }}
          >
            {content ? content : (
              <span className="italic opacity-40 cursor-pointer hover:opacity-70 transition-opacity">
                Klik her for at redigere...
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
