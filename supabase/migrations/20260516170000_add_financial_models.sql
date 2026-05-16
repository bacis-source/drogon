-- Create financial_models table
CREATE TABLE IF NOT EXISTS public.financial_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    assumptions JSONB DEFAULT '{}'::jsonb,
    calculated_data JSONB DEFAULT '{}'::jsonb,
    scenarios JSONB[] DEFAULT ARRAY[]::JSONB[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.financial_models ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own financial models (via project ownership)
CREATE POLICY "Users can view their own financial models" 
ON public.financial_models 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = financial_models.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own financial models" 
ON public.financial_models 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = financial_models.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own financial models" 
ON public.financial_models 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = financial_models.project_id 
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own financial models" 
ON public.financial_models 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = financial_models.project_id 
    AND projects.user_id = auth.uid()
  )
);
