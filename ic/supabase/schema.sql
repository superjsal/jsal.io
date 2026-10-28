-- Platform Playbook database: Discord sign-in, an approved team list, and everything the page stores.
-- This database is the source of truth for the Playbook's content (app_data 'defaults' + edits).
-- Run once in Supabase → SQL Editor. Safe to re-run: it only creates what is missing and replaces functions and policies.
--
-- Who can do what (enforced here, not just hidden in the page):
--   anyone signed in with Discord   → can only ask for access (their own row in access_requests)
--   members (approved)              → read everything, post requests, upvote, comment, delete their own requests and comments
--   admins                          → also edit answers, set request status, approve, remove or promote people

-- ---------- People ----------
create table if not exists public.members (
  user_id     uuid primary key references auth.users on delete cascade,
  role        text not null default 'member' check (role in ('member', 'admin')),
  discord_id  text,
  name        text,
  avatar      text,
  approved_at timestamptz not null default now()
);

create table if not exists public.access_requests (
  user_id    uuid primary key default auth.uid() references auth.users on delete cascade,
  discord_id text,
  name       text,
  avatar     text,
  created_at timestamptz not null default now()
);

create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where user_id = auth.uid());
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where user_id = auth.uid() and role = 'admin');
$$;

-- Name, avatar and Discord id always come from the Discord sign-in, never from what the browser sends.
create or replace function public.fill_identity() returns trigger
language plpgsql security definer set search_path = public as $$
declare m jsonb;
begin
  select raw_user_meta_data into m from auth.users where id = new.user_id;
  new.discord_id := coalesce(m ->> 'provider_id', m ->> 'sub');
  new.name := coalesce(m -> 'custom_claims' ->> 'global_name', m ->> 'full_name', m ->> 'name', m ->> 'user_name');
  new.avatar := m ->> 'avatar_url';
  return new;
end;
$$;
revoke execute on function public.fill_identity() from public, anon, authenticated;

drop trigger if exists access_requests_identity on public.access_requests;
create trigger access_requests_identity before insert or update on public.access_requests
  for each row execute function public.fill_identity();
drop trigger if exists members_identity on public.members;
create trigger members_identity before insert on public.members
  for each row execute function public.fill_identity();

-- Admin actions, as functions so the rules live in one place.
create or replace function public.approve_member(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only admins can approve people'; end if;
  insert into public.members (user_id) values (uid) on conflict (user_id) do nothing;
  delete from public.access_requests where user_id = uid;
end;
$$;

create or replace function public.remove_member(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only admins can remove people'; end if;
  if uid = auth.uid() then raise exception 'You can’t remove yourself'; end if;
  delete from public.members where user_id = uid;
end;
$$;

create or replace function public.set_member_role(uid uuid, new_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only admins can change roles'; end if;
  if uid = auth.uid() then raise exception 'You can’t change your own role'; end if;
  if new_role not in ('member', 'admin') then raise exception 'Unknown role'; end if;
  update public.members set role = new_role where user_id = uid;
end;
$$;

-- ---------- Answers ----------
-- One row holds the built-in content: items, platforms, notes, how-to steps, watch-outs, page types
-- and guides. Loaded only for members.
create table if not exists public.app_data (
  id         text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Admin corrections layered over the built-in answers. Text is Markdown.
-- sec: 'tech', 'content', or 'content.<page type>' for a page-type answer (e.g. 'content.product').
-- how / warn: null = use the built-in how-to steps / watch-out; '' = show none.
create table if not exists public.edits (
  platform text not null,
  sec      text not null,
  item     text not null,
  verdict  text not null check (verdict in ('yes', 'auto', 'plugin', 'code', 'hosting', 'no', 'check')),
  mark     text not null check (char_length(mark) between 1 and 80),
  scope    text not null check (scope in ('U', 'V', 'C')),
  note     text not null default '' check (char_length(note) <= 600),
  how      text check (how is null or char_length(how) <= 2000),
  warn     text check (warn is null or char_length(warn) <= 600),
  edited_by uuid default auth.uid() references auth.users on delete set null,
  at       timestamptz not null default now(),
  primary key (platform, sec, item)
);
-- Bring an edits table made by an earlier version of this file up to date.
alter table public.edits add column if not exists how text;
alter table public.edits add column if not exists warn text;
alter table public.edits drop constraint if exists edits_sec_check;
alter table public.edits add constraint edits_sec_check check (sec ~ '^(tech|content|content\.(home|pages|category|product))$');

-- ---------- Requests and upvotes ----------
-- item: '<section>:<item id>' (section may include a page type, e.g. 'content.product:faq'), or '' for none.
create table if not exists public.requests (
  id        uuid primary key default gen_random_uuid(),
  type      text not null check (type in ('correction', 'platform', 'feature', 'other')),
  title     text not null check (char_length(btrim(title)) between 1 and 120),
  details   text not null default '' check (char_length(details) <= 1000),
  platform  text not null default '',
  item      text not null default '',
  author    uuid not null default auth.uid() references auth.users on delete cascade,
  at        timestamptz not null default now(),
  status    text not null default 'new' check (status in ('new', 'review', 'planned', 'done', 'declined')),
  status_at timestamptz
);

-- One row per person per request: the primary key makes double upvotes impossible.
create table if not exists public.votes (
  request_id uuid not null references public.requests on delete cascade,
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  at         timestamptz not null default now(),
  primary key (request_id, user_id)
);

-- Comments on a request: a short discussion thread under each one. Markdown, like request details.
create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests on delete cascade,
  author     uuid not null default auth.uid() references auth.users on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 1000),
  at         timestamptz not null default now()
);
create index if not exists comments_request_at on public.comments (request_id, at);

-- ---------- Access rules ----------
alter table public.members         enable row level security;
alter table public.access_requests enable row level security;
alter table public.app_data        enable row level security;
alter table public.edits           enable row level security;
alter table public.requests        enable row level security;
alter table public.votes           enable row level security;
alter table public.comments        enable row level security;

do $$
declare t text;
begin
  -- Start clean so re-running this file never leaves an old, looser policy behind.
  foreach t in array array['members', 'access_requests', 'app_data', 'edits', 'requests', 'votes', 'comments'] loop
    execute (select coalesce(string_agg(format('drop policy %I on public.%I;', policyname, t), ' '), '')
             from pg_policies where schemaname = 'public' and tablename = t);
  end loop;
end $$;

-- members: teammates can see who's on the team; changes go through the admin functions.
create policy "members read" on public.members for select to authenticated using (public.is_member());

-- access_requests: you can see and create your own; admins see all and can decline (delete).
create policy "own request read" on public.access_requests for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "own request create" on public.access_requests for insert to authenticated with check (user_id = auth.uid() and not public.is_member());
create policy "own request touch" on public.access_requests for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "admin decline" on public.access_requests for delete to authenticated using (public.is_admin() or user_id = auth.uid());

-- app_data and edits: members read, admins write.
create policy "members read" on public.app_data for select to authenticated using (public.is_member());
create policy "admins write" on public.app_data for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "members read" on public.edits for select to authenticated using (public.is_member());
create policy "admins write" on public.edits for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- requests: members post as themselves (always starting "Not reviewed"); only admins change them; authors or admins delete.
create policy "members read" on public.requests for select to authenticated using (public.is_member());
create policy "members post" on public.requests for insert to authenticated
  with check (public.is_member() and author = auth.uid() and status = 'new' and status_at is null);
create policy "admins update" on public.requests for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "author or admin delete" on public.requests for delete to authenticated using (author = auth.uid() or public.is_admin());

-- votes: members upvote and remove their upvote as themselves only.
create policy "members read" on public.votes for select to authenticated using (public.is_member());
create policy "vote" on public.votes for insert to authenticated with check (public.is_member() and user_id = auth.uid());
create policy "unvote" on public.votes for delete to authenticated using (user_id = auth.uid());

-- comments: members comment as themselves; authors or admins delete.
create policy "members read" on public.comments for select to authenticated using (public.is_member());
create policy "members comment" on public.comments for insert to authenticated
  with check (public.is_member() and author = auth.uid());
create policy "author or admin delete" on public.comments for delete to authenticated using (author = auth.uid() or public.is_admin());

-- Signed-out visitors get nothing at all.
revoke all on public.members, public.access_requests, public.app_data, public.edits, public.requests, public.votes, public.comments from anon;

-- Keep-awake: a weekly GitHub Action calls this so the free Supabase project never pauses for
-- inactivity. It only returns the time and reads no data.
create or replace function public.ping() returns timestamptz
language sql stable as $$ select now() $$;
grant execute on function public.ping() to anon;
revoke execute on function public.approve_member(uuid), public.remove_member(uuid), public.set_member_role(uuid, text) from public, anon;
grant execute on function public.approve_member(uuid), public.remove_member(uuid), public.set_member_role(uuid, text) to authenticated;
