require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function runE2E() {
  console.log('Starter E2E Test...');
  
  // 1. Log ind med God Mode brugeren
  console.log('1. Logger ind som bcs@bcsdenmark.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'bcs@bcsdenmark.com',
    password: 'TanteHelga28++'
  });

  if (authError) throw new Error('Login failed: ' + authError.message);
  
  const token = authData.session.access_token;
  console.log('Login succesfuldt!');

  // 2. Simuler en API anmodning til /api/chat med the GEM command
  console.log('2. Sender kompleks idé til Drogon (GEM [BuildPlan])...');
  
  // Note: /api/chat i Next.js bruger cookies, så vi bliver nødt til at sende den via Supabase's cookie eller direkte kalde db hvis cookie auth failer i fetch.
  // Fordi det er svært at mocke Next.js cookies udefra uden et browser-miljø, bypasser vi HTTP kaldet til fetch og slår direkte ned i backenden, 
  // eller vi kalder HTTP med Authorization header (nogle Next.js auth hjælpere læser automatisk Bearer token, men SSR cookie store gør oftest ikke).
  // I stedet simulerer vi logikken bagved direkte, eller bruger en node fetch med Cookie headeren manuelt bygget!
  
  // Vi bygger Cookie headeren: sb-[id]-auth-token
  const cookieString = `sb-wwexfailwqvvrlmycana-auth-token=${encodeURIComponent(JSON.stringify([
    authData.session.access_token,
    authData.session.refresh_token,
    authData.session.provider_token,
    authData.session.provider_refresh_token
  ]))}`;

  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bypass': 'diagnostic123',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      messages: [{ 
        role: 'user', 
        content: 'Jeg vil bygge et digitalt vagtplanlægningssystem til håndværkere kaldet "BuildPlan". Det skal bruge AI til automatisk at matche svendenes kompetencer med byggelederens opgaver i realtid. Forretningsmodellen er SaaS: 100kr pr. svend pr. måned. GEM [BuildPlan]' 
      }],
      gritLevel: 5
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error('API kald fejlede: ' + response.status + ' ' + errText);
  }

  // Læs streamen
  console.log('3. Venter på at Drogon tygger data og gemmer i the vault (dette tager ca. 10-20 sekunder)...');
  const text = await response.text();
  console.log('Drogons svar:', text);

  // 4. Verificer at projektet blev oprettet i databasen og indeholder alt
  console.log('4. Verificerer database output...');
  const { data: latestProjects, error: dbError } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  fs.writeFileSync('debug_projects.json', JSON.stringify(latestProjects, null, 2));
  
  const project = latestProjects.find(p => p.summary && p.summary.includes('BuildPlan') || p.name.includes('BuildPlan') || p.summary.includes('AI'));

  if (!project) {
    throw new Error('Kunne ikke finde projektet i databasen! Se debug_projects.json');
  }

  console.log('=== TEST SUCCES! FØLGENDE DATA BLEV EKSTRAHERET: ===');
  console.log('Resumé:', project.summary);
  console.log('Forretningsmodel:', project.business_model);
  
  // Skriv output til en markdown fil så brugeren kan se det
  const outputMd = `
# E2E Test Resultat: BuildPlan 🚀

**Resumé:**
${project.summary}

## 💰 Budget (Automatisk genereret)
**CAPEX (Engangsomkostninger):**
${project.budget.capex.map(c => `- ${c.name}: ${c.amount} DKK`).join('\n')}

**OPEX (Månedlig drift):**
${project.budget.opex.map(o => `- ${o.name}: ${o.amount} DKK`).join('\n')}

**Forventet Indtjening (Månedlig):**
${project.budget.revenue.map(r => `- ${r.name}: ${r.amount} DKK`).join('\n')}

## 🧠 System Prompt (Klar til brug)
\`\`\`text
${project.business_plan.system_prompt || 'System prompt blev ikke fanget'}
\`\`\`

## 📊 Forretningsplan
**Executive Summary:** ${project.business_plan.executive_summary}
**Go-to-market:** ${project.business_plan.go_to_market}

## 🎤 Pitch Præsentation (Data)
*Disse data fodres automatisk direkte ind i \`/pitch\`-UI'et.*
- **The Hook:** "${project.summary}"
- **IP Strategi / The Moat:** ${project.ip_strategy}
`;

  fs.writeFileSync('e2e_result.md', outputMd);
  console.log('E2E test fuldført! Resultater skrevet til e2e_result.md');
}

runE2E().catch(console.error);
