-- Opretter licenses-tabellen til Brainstore.dk integration

CREATE TYPE license_tier AS ENUM ('CORE', 'ENTERPRISE');
CREATE TYPE license_status AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

CREATE TABLE IF NOT EXISTS public.licenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  license_key text UNIQUE NOT NULL,
  tier license_tier NOT NULL DEFAULT 'CORE',
  status license_status NOT NULL DEFAULT 'ACTIVE',
  credits_remaining integer DEFAULT 100,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- Brugere kan kun se deres egne licenser
CREATE POLICY "Brugere kan læse egne licenser"
  ON public.licenses
  FOR SELECT
  USING (auth.uid() = user_id);

-- En trigger til automatisk at opdatere updated_at
CREATE TRIGGER handle_updated_at_licenses
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime (updated_at);
