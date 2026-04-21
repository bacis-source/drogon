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
} from "@/components/ui/sidebar"

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-cyan-900/50 bg-[#0B0F19]">
      <SidebarHeader className="border-b border-cyan-900/50 p-4">
        <h2 className="text-lg tracking-tight text-cyan-400 font-semibold uppercase">Project Blueprint</h2>
        <p className="text-xs text-cyan-700 font-medium">ANTIGRAVITY SYSTEM</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-cyan-800">Saved Ideas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-slate-300 hover:text-cyan-400 hover:bg-cyan-950/30">
                  <span>No blueprints saved.</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
