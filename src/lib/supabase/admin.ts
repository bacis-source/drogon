import { createClient } from '@supabase/supabase-js';

// An admin client that uses the SERVICE_ROLE_KEY to bypass Row Level Security.
// ONLY use this in Server Actions or API routes, NEVER expose to the browser!
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
