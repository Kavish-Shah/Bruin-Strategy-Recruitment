-- Supabase Migration & Seed Script for Bruin Strategy Recruitment
-- Run this in Supabase Dashboard -> SQL Editor

-- 1. Add columns to applicants table
ALTER TABLE public.applicants 
ADD COLUMN IF NOT EXISTS assigned_grader_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.applicants 
ADD COLUMN IF NOT EXISTS scheduled_time text;

-- Allow profiles to store grader accounts cleanly
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Grant permissions for public/anon access (or disable RLS if testing locally)
DROP POLICY IF EXISTS "Allow public read access to applicants" ON public.applicants;
CREATE POLICY "Allow public read access to applicants" ON public.applicants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public update access to applicants" ON public.applicants;
CREATE POLICY "Allow public update access to applicants" ON public.applicants FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public insert access to applicants" ON public.applicants;
CREATE POLICY "Allow public insert access to applicants" ON public.applicants FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public all access to profiles" ON public.profiles;
CREATE POLICY "Allow public all access to profiles" ON public.profiles FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public all access to assignments" ON public.assignments;
CREATE POLICY "Allow public all access to assignments" ON public.assignments FOR ALL USING (true);
