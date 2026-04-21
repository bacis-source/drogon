"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Compass, FileText, LayoutTemplate, LogOut, MessageSquare, Plus, CheckSquare, Trophy, Cloud, Check } from "lucide-react"

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-slate-800/80 bg-[#0A0F1E] w-[280px]">
      
      {/* 1. Header (User Info + Logo) */}
      <SidebarHeader className="p-6 pb-2">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-full border border-slate-700/50 bg-[#161C2C] flex items-center justify-center flex-shrink-0">
            <span className="text-[#F59E0B] font-bold text-xs">8</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-widest text-slate-200">BIRGITTE ADM</span>
            <button className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1 hover:text-slate-300 transition-colors mt-0.5">
              <LogOut className="w-3 h-3" /> LOG UD
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#F59E0B] flex items-center justify-center">
            <Compass className="w-5 h-5 text-[#0A0F1E]" fill="#0A0F1E" strokeWidth={1} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">DROGON</h1>
        </div>
      </SidebarHeader>

      {/* 2. Content (Nav Lists) */}
      <SidebarContent className="px-4 py-2">
        <SidebarGroup className="mb-2">
          <div className="flex items-center justify-between px-2 mb-3">
             <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">ARKIV</span>
             <button className="text-[10px] font-bold tracking-widest text-[#F59E0B] hover:text-[#EAB308] flex items-center gap-1">
               <Plus className="w-3 h-3" /> NY
             </button>
          </div>
          <SidebarGroupContent>
            {/* Active Archive Item */}
            <div className="w-full bg-[#111626] border border-[#F59E0B]/30 rounded-xl p-3 flex justify-between items-center cursor-pointer hover:border-[#F59E0B]/60 transition-colors mb-6 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-wider text-[#F59E0B] leading-none mb-1 uppercase">MIN FØRSTE VISION</span>
                <span className="text-[9px] font-semibold text-slate-500 tracking-widest">LVL 1</span>
              </div>
              <span className="text-[#F59E0B]">›</span>
            </div>

            {/* Main Menu */}
            <SidebarMenu className="gap-2">
              <SidebarMenuItem>
                <SidebarMenuButton className="w-full bg-[#F59E0B] hover:bg-[#EAB308] text-[#0A0F1E] active:bg-[#D97706] rounded-xl h-12 justify-start font-bold uppercase tracking-wider text-xs flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 ml-1" />
                  SAMTALE
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton className="w-full hover:bg-slate-800/50 text-slate-400 rounded-xl h-10 justify-start font-bold uppercase tracking-wider text-xs flex items-center gap-3 transition-colors">
                  <LayoutTemplate className="w-4 h-4 ml-1" />
                  LEAN CANVAS
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton className="w-full hover:bg-slate-800/50 text-slate-400 rounded-xl h-10 justify-start font-bold uppercase tracking-wider text-xs flex items-center gap-3 transition-colors">
                  <Compass className="w-4 h-4 ml-1" />
                  ARKITEKTUR
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton className="w-full hover:bg-slate-800/50 text-slate-400 rounded-xl h-10 justify-start font-bold uppercase tracking-wider text-xs flex items-center gap-3 transition-colors">
                  <CheckSquare className="w-4 h-4 ml-1" />
                  EXECUTION
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton className="w-full hover:bg-slate-800/50 text-slate-400 rounded-xl h-10 justify-start font-bold uppercase tracking-wider text-xs flex items-center gap-3 transition-colors">
                  <FileText className="w-4 h-4 ml-1" />
                  DOKUMENTER
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* 3. Footer */}
      <SidebarFooter className="p-6 pt-4 gap-3">
        <div className="w-full bg-[#1A1525] border border-red-900/30 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-[#1E182A] transition-colors">
          <Trophy className="w-4 h-4 text-red-500" />
          <span className="text-[11px] font-bold tracking-widest text-red-500 uppercase">DRAGONS DEN</span>
        </div>
        
        <div className="flex flex-col gap-1 px-1">
          <span className="text-[9px] font-bold tracking-widest text-[#F59E0B] uppercase">CLOUD DATABASE</span>
          <div className="flex items-center gap-1.5 opacity-80">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[9px] font-bold tracking-widest text-emerald-500 uppercase">CLOUD ACTIVE</span>
            <Cloud className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
          </div>
        </div>
      </SidebarFooter>

    </Sidebar>
  )
}
