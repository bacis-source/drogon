require('dotenv').config({ path: 'src/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('vault_documents').select('id').limit(1);
  if (error) {
     console.log("TABLE DOES NOT EXIST OR ERROR:", error.message);
  } else {
     console.log("TABLE EXISTS. DATA:", data);
  }
}
check();
