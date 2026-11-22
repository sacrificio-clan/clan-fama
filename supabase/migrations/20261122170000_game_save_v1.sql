-- SACRIFICIO RPG - persistence V1
-- Run AFTER 20261122160000_game_rpg_v1.sql in Supabase SQL Editor.
-- Enables server-validated planting and harvesting. Browser clients cannot write
-- directly to game tables; they may call these authenticated RPC functions only.

begin;

-- ---------------------------------------------------------------------------
-- 1. Make sure each existing clan profile has an RPG profile and farm.
-- ---------------------------------------------------------------------------

insert into public.game_profiles (player_id)
select id from public.profiles
on conflict (player_id) do nothing;

insert into public.game_farms (player_id)
select player_id from public.game_profiles
on conflict (player_id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Return only the authenticated player's RPG state.
-- ---------------------------------------------------------------------------

create or replace function public.game_get_state()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_player_id uuid := auth.uid();
  v_active boolean;
  v_result jsonb;
begin
  if v_player_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select is_active into v_active
    from public.profiles
   where id = v_player_id;

  if not found or v_active is not true then
    raise exception 'PROFILE_NOT_ACTIVE';
  end if;

  insert into public.game_profiles (player_id)
  values (v_player_id)
  on conflict (player_id) do nothing;

  insert into public.game_farms (player_id)
  values (v_player_id)
  on conflict (player_id) do nothing;

  select jsonb_build_object(
    'player_id', gp.player_id,
    'gold', gp.gold,
    'lifetime_gold_earned', gp.lifetime_gold_earned,
    -- Farm slot capacity is initially three. Clan-achievement slot mapping will be added separately.
    'slot_count', 3,
    'slot_capacity_ready', true,
    'plots', coalesce((
      select jsonb_agg(jsonb_build_object(
        'slot_index', p.slot_index,
        'plant_item_id', p.plant_item_id,
        'seed_item_id', p.seed_item_id,
        'planted_at', p.planted_at,
        'finishes_at', p.finishes_at
      ) order by p.slot_index)
      from public.game_plots p
      where p.player_id = v_player_id
    ), '[]'::jsonb),
    'inventory', coalesce((
      select jsonb_agg(jsonb_build_object(
        'item_id', i.item_id,
        'quantity', i.quantity,
        'tag_ids', i.tag_ids,
        'instance_id', i.instance_id,
        'instance_data', i.instance_data
      ) order by i.item_id, i.tag_ids)
      from public.game_inventory i
      where i.player_id = v_player_id
    ), '[]'::jsonb),
    'discoveries', coalesce((
      select jsonb_agg(jsonb_build_object(
        'discovery_id', u.discovery_id,
        'discovered_at', u.discovered_at
      ) order by u.discovery_id)
      from public.game_unlocks u
      where u.player_id = v_player_id
    ), '[]'::jsonb)
  )
  into v_result
  from public.game_profiles gp
  where gp.player_id = v_player_id;

  return coalesce(v_result, jsonb_build_object(
    'player_id', v_player_id,
    'gold', 0,
    'lifetime_gold_earned', 0,
    'slot_count', 3,
    'slot_capacity_ready', true,
    'plots', '[]'::jsonb,
    'inventory', '[]'::jsonb,
    'discoveries', '[]'::jsonb
  ));
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Start planting. Cost and growth time are read from trusted catalog metadata.
-- ---------------------------------------------------------------------------

create or replace function public.game_start_planting(
  p_slot_index integer,
  p_plant_item_id integer
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_player_id uuid := auth.uid();
  v_active boolean;
  v_gold bigint;
  v_item public.game_items%rowtype;
  v_cost bigint;
  v_reward bigint;
  v_growth_hours integer;
  v_seed_item_id integer;
  v_started_at timestamptz := now();
  v_finishes_at timestamptz;
begin
  if v_player_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select is_active into v_active
    from public.profiles
   where id = v_player_id;

  if not found or v_active is not true then
    raise exception 'PROFILE_NOT_ACTIVE';
  end if;

  if p_slot_index is null or p_slot_index < 0 or p_slot_index > 2 then
    raise exception 'PLOT_SLOT_NOT_UNLOCKED';
  end if;

  select * into v_item
    from public.game_items
   where id = p_plant_item_id
     and category = 'plant';

  if not found or coalesce(v_item.metadata->>'starter', 'false') <> 'true' then
    raise exception 'PLANT_NOT_AVAILABLE';
  end if;

  v_cost := greatest(0, coalesce((v_item.metadata->>'seedCost')::numeric::bigint, 0));
  v_reward := greatest(0, coalesce((v_item.metadata->>'goldReward')::numeric::bigint, 0));
  v_growth_hours := coalesce((v_item.metadata->>'growthHours')::integer, 0);
  v_seed_item_id := nullif(v_item.metadata->>'seedItemId', '')::integer;

  if v_growth_hours <= 0 then
    raise exception 'INVALID_PLANT_GROWTH_TIME';
  end if;

  insert into public.game_profiles (player_id)
  values (v_player_id)
  on conflict (player_id) do nothing;

  select gold into v_gold
    from public.game_profiles
   where player_id = v_player_id
   for update;

  if v_gold < v_cost then
    raise exception 'NOT_ENOUGH_GOLD';
  end if;

  if exists (
    select 1 from public.game_plots
     where player_id = v_player_id
       and slot_index = p_slot_index
  ) then
    raise exception 'PLOT_ALREADY_OCCUPIED';
  end if;

  v_finishes_at := v_started_at + make_interval(hours => v_growth_hours);

  update public.game_profiles
     set gold = gold - v_cost
   where player_id = v_player_id;

  insert into public.game_plots (
    player_id, slot_index, plant_item_id, seed_item_id, planted_at, finishes_at
  ) values (
    v_player_id, p_slot_index, p_plant_item_id, v_seed_item_id, v_started_at, v_finishes_at
  );

  insert into public.game_transactions (
    player_id, event_key, gold_delta, item_changes, metadata
  ) values (
    v_player_id,
    'PLANT_' || p_plant_item_id,
    -v_cost,
    '[]'::jsonb,
    jsonb_build_object('slot_index', p_slot_index, 'plant_item_id', p_plant_item_id)
  );

  return jsonb_build_object(
    'success', true,
    'slot_index', p_slot_index,
    'plant_item_id', p_plant_item_id,
    'seed_item_id', v_seed_item_id,
    'planted_at', v_started_at,
    'finishes_at', v_finishes_at,
    'gold_cost', v_cost,
    'gold_reward', v_reward
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Harvest. Server checks completion, awards Gold, preserves tag identity,
-- records the harvest, and rolls the permanent worm discovery with pity.
-- ---------------------------------------------------------------------------

create or replace function public.game_harvest_plot(p_slot_index integer)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_player_id uuid := auth.uid();
  v_active boolean;
  v_plot public.game_plots%rowtype;
  v_plant public.game_items%rowtype;
  v_reward bigint;
  v_now timestamptz := now();
  v_local_time time;
  v_tags integer[] := '{}'::integer[];
  v_failures bigint := 0;
  v_worm_chance numeric;
  v_worm_found boolean := false;
  v_existing_discovery boolean := false;
begin
  if v_player_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select is_active into v_active
    from public.profiles
   where id = v_player_id;

  if not found or v_active is not true then
    raise exception 'PROFILE_NOT_ACTIVE';
  end if;

  select * into v_plot
    from public.game_plots
   where player_id = v_player_id
     and slot_index = p_slot_index
   for update;

  if not found then
    raise exception 'PLOT_EMPTY';
  end if;

  if v_plot.finishes_at > v_now then
    raise exception 'PLANT_NOT_READY';
  end if;

  select * into v_plant
    from public.game_items
   where id = v_plot.plant_item_id;

  if not found then
    raise exception 'PLANT_CATALOG_ENTRY_MISSING';
  end if;

  v_reward := greatest(0, coalesce((v_plant.metadata->>'goldReward')::numeric::bigint, 0));

  -- Time-affinity tags are calculated by the server using the agreed Brazil time zone.
  v_local_time := timezone('America/Sao_Paulo', v_now)::time;
  if v_local_time >= time '12:00' and v_local_time < time '13:00' then
    v_tags := array[6]::integer[]; -- SOL
  elsif v_local_time >= time '00:00' and v_local_time < time '01:00' then
    v_tags := array[7]::integer[]; -- LUA
  end if;

  -- Rarity odds are intentionally not rolled yet; rates must be balanced first.
  insert into public.game_inventory (
    player_id, item_id, quantity, tag_ids, instance_id
  ) values (
    v_player_id, v_plot.plant_item_id, 1, v_tags, null
  )
  on conflict (player_id, item_id, tag_ids) where instance_id is null
  do update set
    quantity = public.game_inventory.quantity + excluded.quantity,
    updated_at = now();

  update public.game_profiles
     set gold = gold + v_reward,
         lifetime_gold_earned = lifetime_gold_earned + v_reward
   where player_id = v_player_id;

  delete from public.game_plots
   where id = v_plot.id
     and player_id = v_player_id;

  insert into public.game_transactions (
    player_id, event_key, gold_delta, item_changes, metadata
  ) values (
    v_player_id,
    'HARVEST_' || v_plot.plant_item_id,
    v_reward,
    jsonb_build_array(jsonb_build_object(
      'item_id', v_plot.plant_item_id,
      'quantity', 1,
      'tag_ids', v_tags
    )),
    jsonb_build_object('slot_index', p_slot_index)
  );

  -- Permanent worm discovery: base 1%, +1 percentage point after every failed harvest.
  select exists (
    select 1 from public.game_unlocks
     where player_id = v_player_id and discovery_id = 800001
  ) into v_existing_discovery;

  if not v_existing_discovery then
    insert into public.game_pity_counters (player_id, counter_key, failures)
    values (v_player_id, 'WORM_DISCOVERY', 0)
    on conflict (player_id, counter_key) do nothing;

    select failures into v_failures
      from public.game_pity_counters
     where player_id = v_player_id and counter_key = 'WORM_DISCOVERY'
     for update;

    -- Another harvest from this player may have found the worm while this call waited.
    select exists (
      select 1 from public.game_unlocks
       where player_id = v_player_id and discovery_id = 800001
    ) into v_existing_discovery;

    if not v_existing_discovery then
      v_worm_chance := least(100, 1 + v_failures);
      v_worm_found := random() * 100 < v_worm_chance;

      if v_worm_found then
        insert into public.game_unlocks (player_id, discovery_id)
        values (v_player_id, 800001)
        on conflict (player_id, discovery_id) do nothing;

        update public.game_pity_counters
           set failures = 0, updated_at = now()
         where player_id = v_player_id and counter_key = 'WORM_DISCOVERY';
      else
        update public.game_pity_counters
           set failures = failures + 1, updated_at = now()
         where player_id = v_player_id and counter_key = 'WORM_DISCOVERY';
      end if;
    else
      v_worm_chance := 0;
    end if;
  end if;

  return jsonb_build_object(
    'success', true,
    'item_id', v_plot.plant_item_id,
    'quantity', 1,
    'tag_ids', v_tags,
    'gold_earned', v_reward,
    'worm_found', v_worm_found,
    'worm_chance_percent', case when v_existing_discovery then 0 else v_worm_chance end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. RPC permissions.
-- SECURITY DEFINER functions verify auth.uid() and active clan membership.
-- No direct client INSERT/UPDATE/DELETE access is granted on game tables.
-- ---------------------------------------------------------------------------

revoke all on function public.game_get_state() from public, anon;
revoke all on function public.game_start_planting(integer, integer) from public, anon;
revoke all on function public.game_harvest_plot(integer) from public, anon;

grant execute on function public.game_get_state() to authenticated;
grant execute on function public.game_start_planting(integer, integer) to authenticated;
grant execute on function public.game_harvest_plot(integer) to authenticated;

commit;

-- Verification after execution:
-- select public.game_get_state();
-- select proname from pg_proc where pronamespace = 'public'::regnamespace and proname like 'game_%';
