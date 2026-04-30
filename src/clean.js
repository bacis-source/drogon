const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // I need the service role key to bypass RLS

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Service Key or URL. We cannot hard wipe without service key.");
  console.error("URL:", supabaseUrl, "Key missing?", !supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function wipeDatabase() {
  console.log('Initiating hard wipe of database vectors using service role...');
  
  // Wipe all project_vectors globally
  const { error: err1 } = await supabase.from('project_vectors').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (err1) {
    console.error("Error wiping vectors:", err1);
  } else {
    console.log("Vector table completely purged.");
  }

  const { error: err2 } = await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (err2) {
    console.error("Error wiping projects:", err2);
  } else {
    console.log("Projects table completely purged.");
  }
}

wipeDatabase();
