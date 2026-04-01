-- Remove auth-based RLS policies and replace with open access
-- This app is single-user (Bohdan only), no auth needed

-- Drop existing restrictive policies on proposals
drop policy if exists "Users can view own proposals" on proposals;
drop policy if exists "Users can insert own proposals" on proposals;
drop policy if exists "Users can update own proposals" on proposals;
drop policy if exists "Users can delete own proposals" on proposals;

-- Add open policies for proposals
create policy "Allow all select on proposals" on proposals for select using (true);
create policy "Allow all insert on proposals" on proposals for insert with check (true);
create policy "Allow all update on proposals" on proposals for update using (true);
create policy "Allow all delete on proposals" on proposals for delete using (true);

-- Drop auth-based policies on signatures
drop policy if exists "Proposal owners can view signatures" on signatures;
create policy "Allow all select on signatures" on signatures for select using (true);

-- Drop auth-based policies on payments
drop policy if exists "Proposal owners can view payments" on payments;
create policy "Allow all select on payments" on payments for select using (true);

-- Drop auth-based policies on events
drop policy if exists "Proposal owners can view events" on proposal_events;
create policy "Allow all select on events" on proposal_events for select using (true);

-- Make user_id nullable on proposals (no longer tied to auth)
alter table proposals alter column user_id drop not null;

-- Drop the foreign key constraint to auth.users
alter table proposals drop constraint if exists proposals_user_id_fkey;

-- Also open up business_profiles if it has RLS
drop policy if exists "Users can view own profile" on business_profiles;
drop policy if exists "Users can update own profile" on business_profiles;
drop policy if exists "Users can insert own profile" on business_profiles;
create policy "Allow all on business_profiles" on business_profiles for all using (true) with check (true);
