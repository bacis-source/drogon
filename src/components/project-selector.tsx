"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Folder } from "lucide-react";

export function ProjectSelector({ projects, activeProjectId }: { projects: any[], activeProjectId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!projects || projects.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 bg-[#161C2C] border border-slate-700/50 rounded-lg px-3 py-1.5 shadow-sm">
      <Folder className="w-4 h-4 text-slate-400" />
      <select 
        value={activeProjectId} 
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('project', e.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }}
        className="bg-transparent border-none text-xs text-slate-200 font-bold focus:ring-0 cursor-pointer min-w-[150px] max-w-[250px] truncate outline-none uppercase tracking-wider"
      >
        {projects.map(p => (
          <option key={p.id} value={p.id} className="bg-[#0E1320] text-slate-300 uppercase">
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
