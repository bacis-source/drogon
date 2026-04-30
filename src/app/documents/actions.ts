'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

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
    // Using user_id as root folder ensures files are logically grouped by user
    const filePath = `${user.id}/${project.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await adminSupabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
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

    revalidatePath('/documents');
    return { success: true };

  } catch (error: any) {
    console.error("Delete error:", error);
    return { success: false, error: error.message };
  }
}
