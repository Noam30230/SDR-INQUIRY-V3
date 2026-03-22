-- Account Scorer — Schéma Supabase
-- À coller dans l'éditeur SQL de ton projet Supabase (onglet "SQL Editor")

-- Table principale
create table if not exists accounts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users not null,
  company_name  text not null,
  domain        text,
  country       text,
  salesforce_id text,
  tier          text check (tier in ('T1', 'T2', 'T3', 'DQ')),
  score         integer check (score between 0 and 100),
  signals       jsonb default '{"positive": [], "negative": []}'::jsonb,
  tech_stack    jsonb default '{}'::jsonb,
  web_quality   jsonb default '{}'::jsonb,
  press_signals jsonb default '{"articles": []}'::jsonb,
  reasoning     text,
  raw_data      jsonb default '{}'::jsonb,
  status        text default 'pending' check (status in ('pending', 'scoring', 'done', 'error')),
  error_message text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Index pour les requêtes fréquentes
create index if not exists accounts_user_id_idx on accounts(user_id);
create index if not exists accounts_tier_idx on accounts(tier);
create index if not exists accounts_status_idx on accounts(status);
create index if not exists accounts_created_at_idx on accounts(created_at desc);

-- Mise à jour automatique de updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger accounts_updated_at
  before update on accounts
  for each row execute function update_updated_at();

-- Row Level Security : chaque SDR voit uniquement ses comptes
alter table accounts enable row level security;

create policy "Users can view own accounts"
  on accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert own accounts"
  on accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own accounts"
  on accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete own accounts"
  on accounts for delete
  using (auth.uid() = user_id);

-- Activer realtime pour les mises à jour live de l'UI
alter publication supabase_realtime add table accounts;
