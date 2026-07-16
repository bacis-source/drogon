export interface Project {
  id: string;
  user_id: string;
  name: string;
  summary?: string;
  business_model?: string;
  tech_architecture?: any;
  execution_plan?: any;
  lean_canvas?: any;
  budget?: any;
  created_at: string;
}

export interface Message {
  id: string;
  project_id: string | null;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    [key: string]: any;
  };
}

export interface License {
  id: string;
  user_id: string;
  tier: 'CORE' | 'PRO' | 'ENTERPRISE';
  status: 'ACTIVE' | 'INACTIVE';
  credits_remaining: number;
}
