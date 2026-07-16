import { embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { logError } from './logger';

export async function embedProjectData(supabase: any, projectId: string, projectName: string, projectData: any) {
  try {
    const myOpenAI = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const embeddedContent = `Projekt Navn: ${projectName}\nResume: ${projectData.summary}\nForretningsmodel: ${projectData.business_model}\nTeknisk Spec: ${projectData.tech_spec}\nIP Strategi: ${projectData.ip_strategy}`;

    const embeddingResponse = await embed({
      model: myOpenAI.embedding('text-embedding-3-small'),
      value: embeddedContent.slice(0, 25000),
    });

    // Slet gamle vektorer, så vi undgår duplikater
    await supabase.from('project_vectors').delete().eq('project_id', projectId);

    // Indsæt nye vektorer
    const { error: vErr } = await supabase
      .from('project_vectors')
      .insert({
        project_id: projectId,
        content: embeddedContent,
        embedding: embeddingResponse.embedding,
        metadata: { ...projectData }
      });

    if (vErr) {
      throw new Error(`Supabase Vector Error: ${vErr.message}`);
    }
  } catch (error) {
    logError('Failed to generate or store project vector embeddings', error, { projectId, projectName });
    throw error;
  }
}
