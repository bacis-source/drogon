require('dotenv').config({ path: 'src/.env.local' });
const fetch = require('node-fetch');

async function check() {
  const payload = {
    messages: [
      { role: "user", content: "Drogon, hvad står der i de filer der ligger i the vault lige nu?" }
    ],
    gritLevel: 5
  };

  const response = await fetch('https://drogon.vercel.app/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  console.log("RESPONSE:", text);
}
check();
