require('dotenv').config({ path: 'src/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStorage() {
  const { data: users, error: err1 } = await supabase.auth.admin.listUsers();
  if (!users || users.users.length === 0) { console.log("NO USERS"); return; }
  const userId = users.users[0].id;
  
  const { data: projects } = await supabase.from('projects').select('id').eq('user_id', userId);
  if (!projects || projects.length === 0) { console.log("NO PROJECTS"); return; }
  
  for (const proj of projects) {
    const folder = `${userId}/${proj.id}`;
    const { data: files } = await supabase.storage.from('drogon_vault').list(folder);
    console.log(`Files in ${folder}:`, files?.length || 0);
    if (files) console.log(files);
  }
}
checkStorage();
