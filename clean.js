const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
const SUPABASE_URL = urlMatch[1].trim().replace(/['"]/g, '');
const SUPABASE_KEY = keyMatch[1].trim().replace(/['"]/g, '');

async function clean() {
  const res1 = await fetch(`${SUPABASE_URL}/rest/v1/project_vectors?id=gt.0`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY }
  });
  console.log('Vectors deleted:', res1.status);
  
  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/projects?name=not.eq.randomstring`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY }
  });
  console.log('Projects deleted:', res2.status);
}
clean();
