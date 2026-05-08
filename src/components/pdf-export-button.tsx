"use client";

import { Zap } from "lucide-react";

export function PdfExportButton() {
  const handleExport = () => {
    window.print();
  };

  return (
    <button 
      onClick={handleExport}
      className="bg-red-600 hover:bg-red-700 text-white font-black text-lg uppercase tracking-widest py-5 px-12 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] transition-all flex items-center gap-3 transform hover:scale-105 print:hidden"
    >
      <Zap className="w-6 h-6" />
      Eksportér Til PDF
    </button>
  );
}
