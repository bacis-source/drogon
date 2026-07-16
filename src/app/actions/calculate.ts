'use server';

import { createClient } from '@supabase/supabase-js';
import { runCalculator, CalculatorInputs, SystemConstants } from '@/lib/calculator/engine';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { logError } from '@/lib/services/logger';

// Supabase Setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const myGoogle = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });

/**
 * Beregner ROI og CO2-besparelse ved brug af Wincover.
 * Henter systemkonstanter fra databasen, udregner besparelser via vores rule engine, 
 * gemmer sessionen og beriger endelig resultatet med et AI-genereret salgspitch.
 * 
 * @param {CalculatorInputs} inputs - Objekt indeholdende antal vinduer og gennemsnitlig størrelse.
 * @param {string} email - Brugerens e-mailadresse.
 * @param {string} company - Brugerens firmanavn.
 * @returns {Promise<Object>} Et objekt med succes-status, beregningsresultater og salgstekst.
 */
export async function calculateWincoverRoi(inputs: CalculatorInputs, email: string, company: string) {
  try {
    // 0. INPUT VALIDATION (Hanne's Fix)
    if (!inputs.totalWindows || inputs.totalWindows < 1 || inputs.totalWindows > 100000) {
      throw new Error('Ugyldigt antal vinduer.');
    }
    if (!inputs.avgWindowSizeM2 || inputs.avgWindowSizeM2 < 0.1 || inputs.avgWindowSizeM2 > 100) {
      throw new Error('Ugyldig vinduesstørrelse.');
    }
    if (!email || !email.includes('@')) {
      throw new Error('Ugyldig email-adresse.');
    }

    // 1. Fetch current constants from Supabase
    const { data: constantRows, error: constantsError } = await supabase
      .from('system_constants')
      .select('key, value');

    if (constantsError) {
      throw new Error('Kunne ikke hente beregningsgrundlag.');
    }

    // Convert rows to key-value object
    const constantsMap: Partial<SystemConstants> = {};
    if (constantRows) {
      constantRows.forEach(row => {
        (constantsMap as Record<string, number>)[row.key] = Number(row.value);
      });
    }

    // Ensure all required constants exist (fallback to hardcoded MVP defaults if missing during dev)
    const activeConstants: SystemConstants = {
      co2_per_m2_new_window: constantsMap.co2_per_m2_new_window ?? 45.5,
      price_per_m2_new_window: constantsMap.price_per_m2_new_window ?? 2500,
      damage_rate_no_wincover: constantsMap.damage_rate_no_wincover ?? 0.15,
      damage_rate_with_wincover: constantsMap.damage_rate_with_wincover ?? 0.02,
      wincover_rental_cost: constantsMap.wincover_rental_cost ?? 150, // Fetched securely from DB, NOT client
    };

    // 2. Run the Rule Engine
    const results = runCalculator(inputs, activeConstants);

    // 3. Store the session
    const { data: sessionData, error: sessionError } = await supabase
      .from('calculator_sessions')
      .insert({
        raw_inputs: inputs,
        calculated_results: results
      })
      .select('id')
      .single();

    if (sessionError) {
      throw new Error('Kunne ikke gemme beregningssession.');
    }

    // 4. Generate AI Sales Pitch and Lead Score (Firewall Principle)
    const aiPrompt = `
      Brugeren har netop kørt Wincover CO2-beregneren.
      Input: ${inputs.totalWindows} vinduer, gennemsnitlig størrelse ${inputs.avgWindowSizeM2} m2.
      Facit (Hardcoded matematik):
      - Sparet DKK: ${results.financial.netSavingsDkk} kr.
      - Sparet CO2: ${results.co2.netSavingsKgCo2} kg.
      - Antal reddede vinduer: ${results.metrics.windowsSavedFromDamage}
      Bruger info: Email: ${email}, Firma: ${company}.
      
      Din opgave som Sælger-Søren & Drogon:
      Returnér et JSON objekt med følgende præcise struktur:
      {
        "salesText": "En overbevisende, kort B2B tekst (max 3 sætninger) der præsenterer facit overfor kunden og skaber FOMO.",
        "aiLeadScore": Et tal mellem 1 og 100 der vurderer hvor varmt dette lead er baseret på besparelsens størrelse og firma.,
        "aiLeadReason": "En kort intern note til salgsteamet om hvorfor dette score blev givet."
      }
    `;

    // Note: To use generateObject we would need zod, but using generateText with JSON instruction for simplicity here.
    let aiData = { salesText: "Wincover beskytter din bundlinje og miljøet effektivt.", aiLeadScore: 50, aiLeadReason: "Default - AI udeladt" };
    
    // FIREWALL FIX: We wrap AI and Lead DB insert in a separate try/catch so a failure here 
    // never stops the user from seeing their mathematical results.
    try {
      const { text: aiResponse } = await generateText({
        model: myGoogle('gemini-2.5-flash', { useSearchGrounding: false }),
        prompt: aiPrompt,
        system: "Du er et API der KUN returnerer valid JSON.",
      });
      
      const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanJson);
      if (parsedData.salesText) aiData.salesText = parsedData.salesText;
      if (parsedData.aiLeadScore) aiData.aiLeadScore = Number(parsedData.aiLeadScore);
      if (parsedData.aiLeadReason) aiData.aiLeadReason = parsedData.aiLeadReason;

      // 5. Store the lead with AI scoring
      await supabase
        .from('leads')
        .insert({
          session_id: sessionData.id,
          email,
          company,
          ai_lead_score: aiData.aiLeadScore,
          ai_lead_reason: aiData.aiLeadReason
        });
    } catch (aiError) {
      logError('Failed to generate or save AI Lead Score', aiError, { email, session_id: sessionData?.id });
      // Vi stopper ikke udførelsen her; brugeren får stadig sine matematiske resultater (Firewall Principle).
    }

    return {
      success: true,
      results,
      salesText: aiData.salesText
    };

  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
