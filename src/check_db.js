import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log("Checking projects...");
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, created_at, user_id')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching projects:", error);
    return;
  }
  
  console.log("Found projects:");
  console.table(data);
}

checkData();
