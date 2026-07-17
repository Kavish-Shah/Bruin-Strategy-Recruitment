-- Supabase Database Schema for Bruin Strategy Recruitment Dashboard

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Define Roles Enum
create type user_role as enum ('ADMIN', 'GRADER');

-- Define Applicant Status Enum
create type applicant_status as enum ('unassigned', 'assigned', 'in_progress', 'completed', 'offered', 'rejected');

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role user_role not null default 'GRADER',
  name text not null,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create applicants table
create table public.applicants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null unique,
  resume_url text,
  cohort text not null, -- e.g., 'Freshman Management', 'Upperclassman Management'
  status applicant_status not null default 'unassigned',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create assignments table
create table public.assignments (
  id uuid default gen_random_uuid() primary key,
  applicant_id uuid references public.applicants(id) on delete cascade not null,
  grader_id uuid references public.profiles(id) on delete cascade not null,
  status text not null check (status in ('assigned', 'in_progress', 'completed')) default 'assigned',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (applicant_id, grader_id)
);

-- Create evaluations table
create table public.evaluations (
  id uuid default gen_random_uuid() primary key,
  assignment_id uuid references public.assignments(id) on delete cascade unique not null,
  leadership_score numeric(3, 1) not null check (leadership_score >= 0 and leadership_score <= 5),
  problem_solving_score numeric(3, 1) not null check (problem_solving_score >= 0 and problem_solving_score <= 5),
  communication_score numeric(3, 1) not null check (communication_score >= 0 and communication_score <= 5),
  essay_score numeric(3, 1) not null check (essay_score >= 1 and essay_score <= 10) default 5,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.applicants enable row level security;
alter table public.assignments enable row level security;
alter table public.evaluations enable row level security;

-- Helper function to check if the current user is an Admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
end;
$$ language plpgsql security definer;

-- RLS Policies

-- 1. Profiles Table Policies
create policy "Allow authenticated users to read profiles" on public.profiles
  for select using (auth.uid() is not null);

create policy "Allow admins to manage profiles" on public.profiles
  for all using (public.is_admin());

-- 2. Applicants Table Policies
create policy "Admins have full access to applicants" on public.applicants
  for all using (public.is_admin());

create policy "Graders can view assigned applicants" on public.applicants
  for select using (
    exists (
      select 1 from public.assignments
      where assignments.applicant_id = applicants.id
        and assignments.grader_id = auth.uid()
    )
  );

-- 3. Assignments Table Policies
create policy "Admins have full access to assignments" on public.assignments
  for all using (public.is_admin());

create policy "Graders can view their assignments" on public.assignments
  for select using (grader_id = auth.uid());

create policy "Graders can update status of their assignments" on public.assignments
  for update using (grader_id = auth.uid());

-- 4. Evaluations Table Policies
create policy "Admins have full access to evaluations" on public.evaluations
  for all using (public.is_admin());

create policy "Graders can view evaluations for their assignments" on public.evaluations
  for select using (
    exists (
      select 1 from public.assignments
      where assignments.id = evaluations.assignment_id
        and assignments.grader_id = auth.uid()
    )
  );

create policy "Graders can insert evaluations for their assignments" on public.evaluations
  for insert with check (
    exists (
      select 1 from public.assignments
      where assignments.id = evaluations.assignment_id
        and assignments.grader_id = auth.uid()
    )
  );

create policy "Graders can update evaluations for their assignments" on public.evaluations
  for update using (
    exists (
      select 1 from public.assignments
      where assignments.id = evaluations.assignment_id
        and assignments.grader_id = auth.uid()
    )
  );

-- Round-Robin Distribution Function
create or replace function public.distribute_applicants_round_robin()
returns json as $$
declare
  grader_record record;
  applicant_record record;
  graders_count int;
  assigned_count int := 0;
  grader_array uuid[];
  grader_index int := 1;
begin
  -- Check if caller is Admin
  if not public.is_admin() then
    raise exception 'Unauthorized: Only admins can trigger round-robin assignment.';
  end if;

  -- Fetch active graders (profiles with role = 'GRADER')
  select array_agg(id) into grader_array
  from public.profiles
  where role = 'GRADER';

  graders_count := array_length(grader_array, 1);

  if graders_count is null or graders_count = 0 then
    return json_build_object('success', false, 'message', 'No active graders found to assign applicants to.');
  end if;

  -- Loop over unassigned applicants
  for applicant_record in
    select id from public.applicants
    where status = 'unassigned'
    order by created_at asc
  loop
    -- Insert assignment
    insert into public.assignments (applicant_id, grader_id, status)
    values (applicant_record.id, grader_array[grader_index], 'assigned')
    on conflict (applicant_id, grader_id) do nothing;

    -- Update applicant status to assigned
    update public.applicants
    set status = 'assigned'
    where id = applicant_record.id;

    assigned_count := assigned_count + 1;

    -- Round-robin: move to next grader index (1-indexed array)
    grader_index := (grader_index % graders_count) + 1;
  end loop;

  return json_build_object(
    'success', true,
    'assigned_count', assigned_count,
    'graders_count', graders_count
  );
end;
$$ language plpgsql security definer;
