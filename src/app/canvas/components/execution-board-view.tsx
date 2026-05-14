"use client";

import React, { useState, useEffect } from 'react';
import { KanbanTask, DashboardData } from '@/types/legacy';
import { CheckSquare, Zap, Clock, CheckCircle2 } from 'lucide-react';

interface ExecutionBoardViewProps {
  data: DashboardData | null;
}

export function ExecutionBoardView({ data }: ExecutionBoardViewProps) {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);

  useEffect(() => {
    if (data?.tasks) {
      setTasks(data.tasks);
    }
  }, [data]);

  const handleUpdateTask = (id: string, status: KanbanTask['status']) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    // TODO: Sync to Supabase
  };

  if (tasks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-[#0A0F1E] flex-1">
        <div className="w-20 h-20 bg-slate-900 rounded-[32px] flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
          <CheckSquare className="w-10 h-10 text-amber-500 opacity-20" />
        </div>
        <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Eksekveringsplan</h3>
        <p className="mb-10 max-w-md text-slate-400 leading-relaxed">
          Når vi har lagt strategien og du beder Drogon om at GEMME dit projekt, opretter jeg automatisk en "Blueprint of Action" med opgaver, prioriteter og milepæle.
        </p>
      </div>
    );
  }

  const Column = ({ title, status, icon }: { title: string; status: KanbanTask['status']; icon: React.ReactNode }) => {
    const colTasks = tasks.filter(t => t.status === status);
    return (
      <div className="flex-1 flex flex-col min-w-[300px] bg-slate-950/30 rounded-[32px] p-6 border border-white/5">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
             <span className="text-slate-500">{icon}</span>
             <h3 className="text-xs font-black uppercase tracking-widest text-white">{title}</h3>
          </div>
          <span className="text-[10px] font-black bg-slate-900 px-2 py-1 rounded-md text-slate-500">{colTasks.length}</span>
        </div>
        <div className="space-y-4 flex-1">
          {colTasks.map(task => (
            <div key={task.id} className="p-5 bg-slate-900 border border-white/5 rounded-2xl hover:border-amber-500/30 transition-all shadow-xl group">
               <div className="flex justify-between items-start mb-3">
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                    task.priority === 'high' ? 'bg-red-500/10 text-red-500' : task.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {task.priority}
                  </span>
                  <span className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">{task.category}</span>
               </div>
               <p className="text-xs font-bold text-slate-200 mb-6 leading-relaxed">{task.title}</p>
               <div className="flex gap-2">
                  {status !== 'todo' && <button onClick={() => handleUpdateTask(task.id, 'todo')} className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-all">To-Do</button>}
                  {status !== 'doing' && <button onClick={() => handleUpdateTask(task.id, 'doing')} className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-all">Doing</button>}
                  {status !== 'done' && <button onClick={() => handleUpdateTask(task.id, 'done')} className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-all">Done</button>}
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-10 bg-[#0A0F1E] flex-1">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Blueprint of Action</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1">Fra Strategi til Eksekvering</p>
        </div>
      </div>

      <div className="flex gap-6 h-full min-h-[700px] overflow-x-auto pb-8">
        <Column title="Blueprint / To-Do" status="todo" icon={<Clock size={16} />} />
        <Column title="In Assembly / Doing" status="doing" icon={<Zap size={16} />} />
        <Column title="Hardened / Done" status="done" icon={<CheckCircle2 size={16} />} />
      </div>
    </div>
  );
}
