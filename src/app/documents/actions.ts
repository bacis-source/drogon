'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import * as mammoth from 'mammoth';


const BUCKET_NAME = 'drogon_vault';

export async function uploadDocument(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const file = formData.get('file') as File | null;
    const projectId = formData.get('projectId') as string | null;

    if (!file || !projectId) {
      throw new Error("Missing file or project ID");
    }

    // Verify the project belongs to the user
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      throw new Error("Project not found or access denied");
    }

    // Use Admin client to bypass RLS for Storage
    const adminSupabase = createAdminClient();
    
    // Path: [user_id]/[project_id]/[filename]
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/${project.id}/${timestamp}_${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 1. Upload to Storage
    const { error: uploadError } = await adminSupabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // 2. Parse text for AI Brain
    let text = '';
    try {
      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
         // eslint-disable-next-line @typescript-eslint/no-require-imports
         const pdfParse = require('pdf-parse');
         const parsed = await pdfParse(Buffer.from(buffer));
         text = parsed.text;
      } else if (file.name.toLowerCase().endsWith('.docx') || file.type.includes('wordprocessingml')) {
         const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
         text = result.value;
      } else {
         // Assume text or just skip if not supported
         text = Buffer.from(buffer).toString('utf-8');
      }

      const CHAR_LIMIT = 30000;
      if (text.length > CHAR_LIMIT) {
        text = text.slice(0, CHAR_LIMIT);
      }
      
      // Save parsed text to database for Drogon
      if (text.trim()) {
         await supabase.from('vault_documents').insert({
            user_id: user.id,
            project_id: project.id,
            filename: safeName, // Store safe name without timestamp for easier matching
            content: text
         });
      }
    } catch (parseErr) {
       console.error("Failed to parse document for AI, but upload succeeded:", parseErr);
       // We don't throw here, because the file WAS uploaded to storage successfully.
    }

    revalidatePath('/documents');
    return { success: true };

  } catch (error: any) {
    console.error("Upload error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteDocument(filePath: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Enforce that the user can only delete files inside their own user_id folder
    if (!filePath.startsWith(`${user.id}/`)) {
      throw new Error("Access denied to this file path");
    }

    const adminSupabase = createAdminClient();
    
    const { error } = await adminSupabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }

    // Also remove from vault_documents memory
    const parts = filePath.split('/');
    if (parts.length === 3) {
      const fileNameWithTimestamp = parts[2];
      // Strip timestamp to match the safeName we stored
      const safeName = fileNameWithTimestamp.replace(/^\d+_/, '');
      const projectId = parts[1];
      
      await supabase
        .from('vault_documents')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .eq('filename', safeName);
    }

    revalidatePath('/documents');
    return { success: true };

  } catch (error: any) {
    console.error("Delete error:", error);
    return { success: false, error: error.message };
  }
}
