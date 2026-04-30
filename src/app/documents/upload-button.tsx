'use client';

import { useState, useRef } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadDocument } from './actions';

export function UploadButton({ projectId }: { projectId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);

    const result = await uploadDocument(formData);

    if (!result.success) {
      setError(result.error || 'Der opstod en fejl ved upload.');
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-500/50 px-8 py-6 rounded-xl font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] z-10 flex items-center gap-2"
      >
        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
        {isUploading ? 'Uploader til Vault...' : 'Upload Fil'}
      </Button>
      {error && <p className="text-red-500 text-sm mt-3 font-medium bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">{error}</p>}
    </div>
  );
}
