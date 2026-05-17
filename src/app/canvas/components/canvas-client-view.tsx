"use client";

import React, { useState } from 'react';
import { LayoutTemplate, Activity, KanbanSquare, CheckCircle } from 'lucide-react';

import { ProjectSelector } from '@/components/project-selector';

interface CanvasClientViewProps {
  project: any;
  allProjects: any[];
  leanCanvasGrid: React.ReactNode;
  dashboardView: React.ReactNode;
  executionView: React.ReactNode;
}

export function CanvasClientView({ project, allProjects, leanCanvasGrid, dashboardView, executionView }: CanvasClientViewProps) {
  const [activeTab, setActiveTab] = useState<'canvas' | 'dashboard' | 'execution'>('canvas');

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0A0F1E] nice-scrollbar flex flex-col">
      {/* Header & Tabs */}
      <header className="px-8 pt-8 pb-0 border-b border-slate-800/60 bg-[#0B0F19]/50 sticky top-0 z-20 backdrop-blur-md flex-none">
        <div className="flex items-center gap-3 mb-2 opacity-80">
          <LayoutTemplate className="w-4 h-4 text-[#F59E0B]" />
          <span className="text-[10px] font-bold tracking-widest text-[#F59E0B] uppercase">PROJEKT ARBEJDSRUM</span>
        </div>
        <div className="flex justify-between items-end mb-6">
          <h1 className="text-4xl font-extrabold text-white tracking-tight uppercase max-w-2xl truncate">{project.name}</h1>
          <ProjectSelector projects={allProjects} activeProjectId={project.id} />
        </div>

        {/* Custom Tabs */}
        <div className="flex gap-6 border-b border-transparent">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`pb-4 flex items-center gap-2 text-sm font-bold tracking-widest uppercase transition-all border-b-2 ${
              activeTab === 'canvas' 
                ? 'border-[#F59E0B] text-[#F59E0B]' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <LayoutTemplate className="w-4 h-4" />
            Lean Canvas
          </button>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-4 flex items-center gap-2 text-sm font-bold tracking-widest uppercase transition-all border-b-2 ${
              activeTab === 'dashboard' 
                ? 'border-[#F59E0B] text-[#F59E0B]' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('execution')}
            className={`pb-4 flex items-center gap-2 text-sm font-bold tracking-widest uppercase transition-all border-b-2 ${
              activeTab === 'execution' 
                ? 'border-[#F59E0B] text-[#F59E0B]' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Execution Board
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className={`absolute inset-0 overflow-y-auto ${activeTab === 'canvas' ? 'block' : 'hidden'}`}>
          <div className="p-6 lg:p-8 h-full">
            {leanCanvasGrid}
          </div>
        </div>
        
        <div className={`absolute inset-0 overflow-y-auto ${activeTab === 'dashboard' ? 'block' : 'hidden'}`}>
           {dashboardView}
        </div>
        
        <div className={`absolute inset-0 overflow-y-auto ${activeTab === 'execution' ? 'block' : 'hidden'}`}>
           {executionView}
        </div>
      </div>
    </div>
  );
}
