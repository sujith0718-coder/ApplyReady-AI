/*
# ApplyReady AI core schema (single-tenant, no auth)

1. New Tables
- profiles: student profile facts (name, degree, year, cgpa, skills)
- opportunities: uploaded opportunity notices with extracted title and deadline
- requirements: per-opportunity requirements with priority, status, confidence, source text, dependencies
- documents: evidence vault items with category, verification status, extracted text
2. Security
- RLS enabled on all tables
- TO anon, authenticated CRUD (single-tenant demo, no sign-in)
3. Notes
- Requirements link to opportunities via opportunity_id FK
- Documents link to opportunities via opportunity_id FK
- dependencies stored as text[] for the blocker chain
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Aarav Kumar',
  degree text NOT NULL DEFAULT 'B.Tech Computer Science',
  year text NOT NULL DEFAULT '3',
  cgpa text NOT NULL DEFAULT '8.6',
  skills text NOT NULL DEFAULT 'React, Python, Figma',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'National Student Innovation Hackathon',
  deadline text NOT NULL DEFAULT '2026-08-15',
  notice_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  req_key text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'missing',
  confidence numeric DEFAULT 0.9,
  source_text text NOT NULL DEFAULT '',
  dependencies text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  verification_status text NOT NULL DEFAULT 'unverified',
  extracted_text text NOT NULL DEFAULT '',
  uploaded_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_profiles" ON profiles;
CREATE POLICY "anon_crud_profiles" ON profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_opportunities" ON opportunities;
CREATE POLICY "anon_crud_opportunities" ON opportunities FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_requirements" ON requirements;
CREATE POLICY "anon_crud_requirements" ON requirements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_crud_documents" ON documents;
CREATE POLICY "anon_crud_documents" ON documents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
