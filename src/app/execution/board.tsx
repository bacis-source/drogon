'use client'

import { useState, useTransition, DragEvent } from "react"
import { CircleDashed, CheckCircle2, GripVertical } from "lucide-react"
import { updateTaskStatus } from "./actions"

interface ExecutionTask {
  task: string;
  status: 'BACKLOG' | 'IN_PROGRESS' | 'DONE';
  phase: string;
}

interface ExecutionBoardProps {
  projectId: string;
  initialPlan: ExecutionTask[];
}

export function ExecutionBoard({ projectId, initialPlan }: ExecutionBoardProps) {
  const [plan, setPlan] = useState<ExecutionTask[]>(initialPlan)
  const [isPending, startTransition] = useTransition()
  
  // Drag state
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<'BACKLOG' | 'IN_PROGRESS' | 'DONE' | null>(null)

  const handleDragStart = (e: DragEvent<HTMLDivElement>, taskName: string) => {
    setDraggedTask(taskName)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>, status: 'BACKLOG' | 'IN_PROGRESS' | 'DONE') => {
    e.preventDefault() 
    if (dragOverCol !== status) {
        setDragOverCol(status)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetStatus: 'BACKLOG' | 'IN_PROGRESS' | 'DONE') => {
    e.preventDefault()
    setDragOverCol(null)
    
    if (!draggedTask) return

    // Find current task
    const taskObj = plan.find(t => t.task === draggedTask)
    if (!taskObj || taskObj.status === targetStatus) {
      setDraggedTask(null)
      return
    }

    // Optimistic Update
    const updatedPlan = plan.map(t => 
      t.task === draggedTask ? { ...t, status: targetStatus } : t
    )
    setPlan(updatedPlan)

    // Server Update
    startTransition(async () => {
      try {
        await updateTaskStatus(projectId, draggedTask, targetStatus)
      } catch (err) {
        // Revert on error
        setPlan(initialPlan)
        console.error("Failed to update status", err)
      }
    })
    
    setDraggedTask(null)
  }

  // Fallback click handler
  const handleMove = (taskName: string, targetStatus: 'BACKLOG' | 'IN_PROGRESS' | 'DONE') => {
    const updatedPlan = plan.map(t => 
      t.task === taskName ? { ...t, status: targetStatus } : t
    )
    setPlan(updatedPlan)
    startTransition(async () => {
      try {
        await updateTaskStatus(projectId, taskName, targetStatus)
      } catch (err) {
        setPlan(initialPlan)
      }
    })
  }

  const cols = [
    {
      id: 'BACKLOG' as const,
      title: 'BACKLOG',
      icon: <CircleDashed className="w-4 h-4 text-slate-500" />,
      textClass: "text-slate-500",
      bgClass: "bg-[#0D121F]",
      borderClass: dragOverCol === 'BACKLOG' ? "border-slate-500 shadow-[0_0_15px_rgba(100,116,139,0.2)]" : "border-slate-800/80",
      itemBgClass: "bg-[#161C2C]",
      itemBorderClass: "border-slate-700/50 hover:border-slate-600",
      itemPhaseClass: "text-emerald-500/70",
      itemTitleClass: "text-slate-300 group-hover:text-white"
    },
    {
      id: 'IN_PROGRESS' as const,
      title: 'IN PROGRESS',
      icon: <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />,
      textClass: "text-emerald-500",
      bgClass: "bg-[#0D121F]",
      borderClass: dragOverCol === 'IN_PROGRESS' ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "border-emerald-900/30",
      itemBgClass: "bg-[#111A24]",
      itemBorderClass: "border-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.05)]",
      itemPhaseClass: "text-emerald-400",
      itemTitleClass: "text-slate-200 group-hover:text-white"
    },
    {
      id: 'DONE' as const,
      title: 'DONE',
      icon: <CheckCircle2 className="w-4 h-4 text-slate-600" />,
      textClass: "text-slate-600",
      bgClass: "bg-[#0D121F]",
      borderClass: dragOverCol === 'DONE' ? "border-slate-600 shadow-[0_0_15px_rgba(71,85,105,0.2)]" : "border-slate-800/80",
      itemBgClass: "bg-[#161C2C]",
      itemBorderClass: "border-slate-800",
      itemPhaseClass: "text-slate-500",
      itemTitleClass: "text-slate-400 line-through"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cols.map(col => {
        const colTasks = plan.filter(t => t.status === col.id)
        
        return (
          <div 
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`rounded-2xl p-4 border transition-all duration-300 ${col.bgClass} ${col.borderClass} ${isPending ? 'opacity-70' : ''}`}
          >
            <div className="flex items-center gap-2 mb-4 px-2">
              {col.icon}
              <span className={`text-xs font-bold tracking-widest uppercase ${col.textClass}`}>
                {col.title}
              </span>
              <span className={`ml-auto text-xs font-bold ${col.textClass} opacity-80`}>
                {colTasks.length}
              </span>
            </div>
            
            <div className="space-y-3 min-h-[150px]">
              {colTasks.map((task, i) => (
                <div 
                  key={`${task.task}-${i}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.task)}
                  onDragEnd={() => setDraggedTask(null)}
                  className={`p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing group ${col.itemBgClass} ${col.itemBorderClass} ${col.id === 'DONE' ? 'opacity-60 hover:opacity-100' : ''} relative`}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-slate-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    <div className="flex-1">
                      <span className={`text-[9px] font-bold tracking-widest uppercase mb-2 block ${col.itemPhaseClass}`}>
                        {task.phase}
                      </span>
                      <h3 className={`text-sm font-medium leading-snug transition-colors ${col.itemTitleClass}`}>
                        {task.task}
                      </h3>
                    </div>
                  </div>
                  
                  {/* Fallback buttons for click */}
                  <div className="absolute right-2 top-2 hidden group-hover:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {col.id !== 'BACKLOG' && (
                      <button 
                        onClick={() => handleMove(task.task, col.id === 'DONE' ? 'IN_PROGRESS' : 'BACKLOG')}
                        className="p-1 rounded hover:bg-slate-700/50 text-slate-400 bg-slate-800/80 backdrop-blur-sm shadow-sm"
                        title="Flyt tilbage"
                      >
                        &larr;
                      </button>
                    )}
                    {col.id !== 'DONE' && (
                      <button 
                        onClick={() => handleMove(task.task, col.id === 'BACKLOG' ? 'IN_PROGRESS' : 'DONE')}
                        className="p-1 rounded hover:bg-slate-700/50 text-slate-400 bg-slate-800/80 backdrop-blur-sm shadow-sm"
                        title="Flyt frem"
                      >
                        &rarr;
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {colTasks.length === 0 && (
                <div className="h-full min-h-[100px] border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-600 text-xs font-medium tracking-wide">
                  Træk hertil
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
