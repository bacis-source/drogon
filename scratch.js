require('dotenv').config({ path: 'src/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('vault_documents').select('*').then(res => console.log(JSON.stringify(res, null, 2)));
