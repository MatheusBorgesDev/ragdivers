-- Invite codes: one per person. Only the SHA-256 of the code is stored; the label is a slug, never a name or e-mail.
create table invites (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  label text not null check (label ~ '^[a-z0-9-]{3,32}$'),
  role text not null check (role in ('maintainer', 'friend')),
  consented_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- The app connects as the database owner from the server only; nothing is exposed through Supabase's public API.
alter table invites enable row level security;
