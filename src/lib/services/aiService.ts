import { generateObject, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { logError } from './logger';

export async function generateProjectName(coreMessages: any[]): Promise<string> {
  try {
    const myOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { text: generatedName } = await generateText({
      model: myOpenAI('gpt-4o-mini'),
      prompt: `Læs denne samtale og foreslå et kort, råt projektnavn (max 3-4 ord). Svar KUN med navnet, intet andet.\n\n` + coreMessages.map(m => m.content).join('\n').slice(-3000)
    });
    return generatedName.trim().replace(/["']/g, '');
  } catch (error) {
    logError('Failed to generate project name', error);
    throw new Error('Kunne ikke generere projektnavn via AI.');
  }
}

export async function extractProjectData(projectName: string, coreMessages: any[]) {
  try {
    const myOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const extraction = await generateObject({
      model: myOpenAI('gpt-4o'),
      schema: z.object({
        summary: z.string().describe('A 2-3 sentence overarching summary of the project.'),
        business_model: z.string().describe('The monetisation strategy / business model.'),
        tech_spec: z.string().describe('The technical specifications, stack, or engineering details.'),
        ip_strategy: z.string().describe('The intellectual property strategy or USP.'),
        lean_canvas: z.object({
          problem: z.string(),
          solution: z.string(),
          key_metrics: z.string(),
          uvp: z.string(),
          unfair_advantage: z.string(),
          channels: z.string(),
          customer_segments: z.string(),
          cost_structure: z.string(),
          revenue_streams: z.string()
        }).describe('Complete 9-block Lean Canvas.'),
        tech_architecture: z.object({
          frontend: z.string(),
          backend: z.string(),
          database: z.string(),
          infrastructure: z.string(),
          security: z.string(),
          system_flow: z.string()
        }).describe('Technical Architecture Blueprint.'),
        business_plan: z.object({
          executive_summary: z.string(),
          market_analysis: z.string(),
          go_to_market: z.string(),
          operations: z.string(),
          system_prompt: z.string().describe('A ready-to-use System Prompt to power the core AI agent of this startup.')
        }).describe('Strategic Business Plan.'),
        budget: z.object({
          capex: z.array(z.object({ name: z.string(), amount: z.number() })),
          opex: z.array(z.object({ name: z.string(), amount: z.number() })),
          revenue: z.array(z.object({ name: z.string(), amount: z.number() }))
        }),
        execution_plan: z.array(z.object({
          task: z.string(),
          status: z.enum(['BACKLOG', 'IN_PROGRESS', 'DONE']),
          phase: z.string()
        })).describe('Logical 5-10 step execution plan.')
      }),
      messages: [
        { role: 'system', content: `Uddrag detaljer for emnet "${projectName}". Udfyld hele Lean Canvas og Arkitektur strukturen dybdegående. Skriv KUN på dansk.` },
        ...coreMessages.slice(0, -1)
      ]
    });
    return extraction.object;
  } catch (error) {
    logError('Failed to extract project data via generateObject', error, { projectName });
    throw new Error('Kunne ikke udtrække projektdata via AI.');
  }
}
