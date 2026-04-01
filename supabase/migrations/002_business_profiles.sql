-- Business profiles table (one per user, filled during onboarding)
create table if not exists business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  company_name text,
  company_description text,       -- what the company does, services offered
  years_in_business text,
  team_description text,          -- team background, expertise
  key_differentiators text,       -- what makes them different
  notable_clients text,           -- past clients, case studies
  industry_focus text,            -- industries they serve
  website_url text,
  logo_url text,                  -- company logo URL
  team_member1_photo_url text,    -- team member 1 photo URL
  team_member1_name text,         -- team member 1 name
  team_member2_photo_url text,    -- team member 2 photo URL
  team_member2_name text,         -- team member 2 name
  provider_signer_name text,      -- name of person who signs proposals
  provider_signer_title text,     -- title/role (e.g. "CEO", "Managing Director")
  provider_signature_data text,   -- base64 PNG signature image
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Supabase Storage bucket for profile images
-- Run this in Supabase SQL Editor:
insert into storage.buckets (id, name, public)
values ('profile-assets', 'profile-assets', true)
on conflict (id) do nothing;

-- Storage RLS: authenticated users can upload to their own folder
create policy "Users can upload own assets"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own assets"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own assets"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Anyone can view profile assets"
  on storage.objects for select
  to public
  using (bucket_id = 'profile-assets');

-- Index
create index if not exists idx_business_profiles_user_id on business_profiles(user_id);

-- RLS
alter table business_profiles enable row level security;

create policy "Users can view own profile"
  on business_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile"
  on business_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on business_profiles for update
  using (auth.uid() = user_id);
