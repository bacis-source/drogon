-- Create system constants table to store dynamic variables
CREATE TABLE system_constants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL,
  value numeric NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for system constants
ALTER TABLE system_constants ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to READ system constants (so the calculator can fetch them)
CREATE POLICY "Allow public read access to system constants"
  ON system_constants FOR SELECT
  USING (true);

-- Allow only authenticated users to modify system constants
CREATE POLICY "Allow authenticated full access to system constants"
  ON system_constants FOR ALL
  USING (auth.role() = 'authenticated');

-- Insert dummy data for Wincover MVP
INSERT INTO system_constants (key, value, description) VALUES
  ('co2_per_m2_new_window', 45.5, 'Gennemsnitlig kg CO2 pr. m2 nyt vindue (produktion)'),
  ('price_per_m2_new_window', 2500, 'Gennemsnitlig pris i DKK pr. m2 nyt vindue'),
  ('resale_value_m2', 500, 'Gensalgspris i DKK pr. m2 intakt brugt vindue'),
  ('recycling_co2_cost_m2', 5.0, 'CO2 omkostning ved klargøring til genanvendelse pr. m2'),
  ('damage_rate_no_wincover', 0.15, 'Skadesrate (15%) uden beskyttelse'),
  ('damage_rate_with_wincover', 0.02, 'Skadesrate (2%) med Wincover'),
  ('gentle_removal_extra_cost', 150, 'Meromkostning i DKK pr. vindue for skånsom nedtagning'),
  ('disposal_cost_mixed_ton', 1200, 'Bortskaffelse af blandet byggeaffald i DKK pr. ton'),
  ('transport_co2_ton_km', 0.062, 'CO2 udledning i kg pr. ton/km lastbiltransport'),
  ('avg_window_weight_kg_m2', 35, 'Gennemsnitlig vægt i kg pr. m2 vindue'),
  ('wincover_rental_cost', 150, 'Lejepris pr. vindue for Wincover i DKK');

-- Create calculator sessions table
CREATE TABLE calculator_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  raw_inputs jsonb NOT NULL,
  calculated_results jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for calculator sessions
ALTER TABLE calculator_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to INSERT calculator sessions (Firewall pattern)
CREATE POLICY "Allow public insert to calculator sessions"
  ON calculator_sessions FOR INSERT
  WITH CHECK (true);

-- Allow authenticated admins to SELECT calculator sessions
CREATE POLICY "Allow admin read to calculator sessions"
  ON calculator_sessions FOR SELECT
  USING (auth.jwt() ->> 'email' LIKE '%@wincover.dk');


-- Create leads table
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES calculator_sessions(id) ON DELETE CASCADE,
  email text NOT NULL,
  company text,
  ai_lead_score integer,
  ai_lead_reason text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to INSERT leads
CREATE POLICY "Allow public insert to leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- Allow authenticated admins to SELECT leads
CREATE POLICY "Allow admin read to leads"
  ON leads FOR SELECT
  USING (auth.jwt() ->> 'email' LIKE '%@wincover.dk');
