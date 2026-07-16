import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { licenseKey } = await req.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Her vil vi normalt validere mod Brainstore.dk API.
    // I MVP'en bygger vi logikken ind internt.
    let tier = 'CORE';
    if (licenseKey.toUpperCase().includes('ENT')) {
      tier = 'ENTERPRISE';
    }

    // Tjek om nøglen allerede er brugt (hvis vi havde et rigtigt API ville det ske der)
    const { data: existing } = await supabase
      .from('licenses')
      .select('id')
      .eq('license_key', licenseKey)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ error: "Licensnøglen er allerede i brug." }), { status: 400 });
    }

    // Indsæt licens
    const { error: insertErr } = await supabase.from('licenses').insert({
      user_id: user.id,
      license_key: licenseKey,
      tier: tier,
      status: 'ACTIVE',
      credits_remaining: tier === 'ENTERPRISE' ? 999999 : 100
    });

    if (insertErr) {
      return new Response(JSON.stringify({ error: "Kunne ikke gemme licensen i databasen: " + insertErr.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, tier }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: "Systemfejl ved validering af licens." }), { status: 500 });
  }
}
