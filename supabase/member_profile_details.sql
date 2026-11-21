-- SACRIFICIO: notas públicas e conquistas por integrante.
-- Execute este arquivo no Supabase SQL Editor antes de usar o editor no site.

create table if not exists public.member_profile_details (
  member_id uuid primary key references public.members(id) on delete cascade,
  notes text not null default '',
  achievements jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint member_profile_details_achievements_array
    check (jsonb_typeof(achievements) = 'array'),
  constraint member_profile_details_notes_length
    check (char_length(notes) <= 10000)
);

alter table public.member_profile_details enable row level security;

drop policy if exists "Public can read member profile details"
  on public.member_profile_details;
create policy "Public can read member profile details"
  on public.member_profile_details
  for select
  to anon, authenticated
  using (true);

revoke all on table public.member_profile_details from public;
grant select on table public.member_profile_details to anon, authenticated;
revoke insert, update, delete on table public.member_profile_details from anon, authenticated;

create or replace function public.save_member_profile_details(
  p_member_id uuid,
  p_notes text,
  p_achievements jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_is_active boolean;
  v_member public.members%rowtype;
begin
  if v_user_id is null then
    raise exception 'Você precisa estar conectado para editar esta ficha.';
  end if;

  select role, is_active
    into v_role, v_is_active
  from public.profiles
  where id = v_user_id;

  if not found or not coalesce(v_is_active, false) then
    raise exception 'Conta inativa ou perfil não encontrado.';
  end if;

  if v_role not in ('owner', 'manager') then
    raise exception 'Somente o proprietário ou o gerente responsável pode editar esta ficha.';
  end if;

  if p_notes is null or char_length(p_notes) > 10000 then
    raise exception 'As notas devem ter até 10.000 caracteres.';
  end if;

  if p_achievements is null or jsonb_typeof(p_achievements) <> 'array' then
    raise exception 'A lista de conquistas é inválida.';
  end if;

  select *
    into v_member
  from public.members
  where id = p_member_id;

  if not found then
    raise exception 'Integrante não encontrado.';
  end if;

  if v_role = 'manager' and not exists (
    select 1
    from public.houses h
    where h.id = v_member.house_id
      and h.manager_profile_id = v_user_id
  ) then
    raise exception 'Você só pode editar integrantes da sua própria casa.';
  end if;

  insert into public.member_profile_details (member_id, notes, achievements, updated_at)
  values (p_member_id, p_notes, p_achievements, now())
  on conflict (member_id) do update
    set notes = excluded.notes,
        achievements = excluded.achievements,
        updated_at = now();

  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.save_member_profile_details(uuid, text, jsonb) from public;
revoke all on function public.save_member_profile_details(uuid, text, jsonb) from anon;
grant execute on function public.save_member_profile_details(uuid, text, jsonb) to authenticated;

comment on function public.save_member_profile_details(uuid, text, jsonb) is
  'Salva notas públicas e conquistas do integrante; somente owner ou manager da casa do integrante pode editar.';
