-- Proposals table
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  client_name text,
  client_email text,
  content jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'sent', 'viewed', 'signed', 'paid')),
  payment_type text check (payment_type in ('one_time', 'deposit_milestone', 'subscription')),
  total_amount integer,
  deposit_amount integer,
  currency text default 'usd',
  stripe_price_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Signatures table
create table if not exists signatures (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references proposals(id) on delete cascade not null,
  signer_name text not null,
  signer_email text not null,
  signature_data text not null,
  ip_address text,
  signed_at timestamptz default now()
);

-- Payments table
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references proposals(id) on delete cascade not null,
  stripe_session_id text,
  stripe_subscription_id text,
  amount integer not null,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  type text not null check (type in ('one_time', 'deposit', 'milestone', 'subscription')),
  created_at timestamptz default now()
);

-- Proposal events table (tracking)
create table if not exists proposal_events (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid references proposals(id) on delete cascade not null,
  event_type text not null check (event_type in ('viewed', 'signed', 'paid', 'created')),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_proposals_user_id on proposals(user_id);
create index if not exists idx_proposals_status on proposals(status);
create index if not exists idx_signatures_proposal_id on signatures(proposal_id);
create index if not exists idx_payments_proposal_id on payments(proposal_id);
create index if not exists idx_payments_stripe_session_id on payments(stripe_session_id);
create index if not exists idx_proposal_events_proposal_id on proposal_events(proposal_id);

-- Row Level Security
alter table proposals enable row level security;
alter table signatures enable row level security;
alter table payments enable row level security;
alter table proposal_events enable row level security;

-- Proposals: users can only see their own
create policy "Users can view own proposals"
  on proposals for select
  using (auth.uid() = user_id);

create policy "Users can insert own proposals"
  on proposals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own proposals"
  on proposals for update
  using (auth.uid() = user_id);

create policy "Users can delete own proposals"
  on proposals for delete
  using (auth.uid() = user_id);

-- Signatures: anyone can insert (public pages), owners can view
create policy "Anyone can insert signatures"
  on signatures for insert
  with check (true);

create policy "Proposal owners can view signatures"
  on signatures for select
  using (
    exists (
      select 1 from proposals
      where proposals.id = signatures.proposal_id
      and proposals.user_id = auth.uid()
    )
  );

-- Payments: similar to signatures
create policy "Anyone can insert payments"
  on payments for insert
  with check (true);

create policy "Anyone can update payments"
  on payments for update
  using (true);

create policy "Proposal owners can view payments"
  on payments for select
  using (
    exists (
      select 1 from proposals
      where proposals.id = payments.proposal_id
      and proposals.user_id = auth.uid()
    )
  );

-- Events: anyone can insert, owners can view
create policy "Anyone can insert events"
  on proposal_events for insert
  with check (true);

create policy "Proposal owners can view events"
  on proposal_events for select
  using (
    exists (
      select 1 from proposals
      where proposals.id = proposal_events.proposal_id
      and proposals.user_id = auth.uid()
    )
  );
