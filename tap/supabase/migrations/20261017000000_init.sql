-- =============================================================================
-- TAP · Migración inicial: comercios y ventas, con seguridad por filas (RLS).
--
-- Reglas clave:
-- * Cada dueño solo ve y toca SU comercio y SUS ventas.
-- * Montos en pesos colombianos ENTEROS (bigint), sin centavos.
-- * Ninguna columna guarda datos de tarjeta: solo la marca (lista cerrada).
-- * Una venta nace 'pending' y solo puede cambiar por transiciones válidas.
-- * El modo Real ('live') está bloqueado hasta que la verificación de
--   identidad lo habilite (paso 5 reemplaza public.is_live_enabled).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Comercios
-- -----------------------------------------------------------------------------
create table public.merchants (
  id            uuid primary key default gen_random_uuid(),
  -- 1 dueño = 1 comercio en el MVP.
  owner_id      uuid not null unique default auth.uid()
                references auth.users (id) on delete cascade,
  business_name text not null
                check (char_length(btrim(business_name)) between 2 and 80),
  -- Mantener igual a BUSINESS_TYPES en src/lib/business.ts (hay una prueba que lo revisa).
  business_type text not null
                check (business_type in ('tienda', 'minimercado', 'restaurante', 'cafeteria',
                                         'panaderia', 'drogueria', 'peluqueria', 'ferreteria',
                                         'ropa', 'otro')),
  legal_type    text not null default 'persona_natural'
                check (legal_type in ('persona_natural', 'empresa')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.merchants is 'Comercios (un dueño por comercio en el MVP).';

-- -----------------------------------------------------------------------------
-- Ventas
-- -----------------------------------------------------------------------------
create table public.sales (
  -- Lo genera la app; también es la referencia del cobro ante el proveedor (idempotencia).
  id                      uuid primary key,
  merchant_id             uuid not null references public.merchants (id) on delete cascade,
  amount                  bigint not null check (amount > 0),          -- pesos, sin propina
  tip                     bigint not null default 0 check (tip >= 0),  -- pesos
  total                   bigint generated always as (amount + tip) stored,
  currency                text not null default 'COP' check (currency = 'COP'),
  mode                    text not null check (mode in ('test', 'live')),
  status                  text not null default 'pending'
                          check (status in ('pending', 'approved', 'declined', 'canceled',
                                            'failed', 'refunded')),
  provider                text not null check (provider in ('mock', 'sumup')),
  provider_transaction_id text check (char_length(provider_transaction_id) <= 100),
  -- SOLO la marca. Lista cerrada: así es imposible guardar aquí un número de tarjeta.
  card_brand              text check (card_brand in ('Visa', 'Mastercard', 'American Express',
                                                     'Diners Club', 'Otra')),
  failure_reason          text check (char_length(failure_reason) <= 300),
  created_at              timestamptz not null default now(),
  completed_at            timestamptz,
  refunded_at             timestamptz,
  -- Modo Prueba ⇔ proveedor simulado. Nunca un cobro simulado en modo Real ni al revés.
  constraint sales_mode_matches_provider check ((mode = 'test') = (provider = 'mock'))
);

comment on table public.sales is 'Ventas. Nunca guarda datos de tarjeta (solo la marca).';

-- Historial y resumen por día: siempre se consulta por comercio, modo y fecha.
create index sales_merchant_mode_created_idx on public.sales (merchant_id, mode, created_at desc);

-- -----------------------------------------------------------------------------
-- Funciones auxiliares
-- -----------------------------------------------------------------------------

-- ¿El comercio puede cobrar en modo Real?
-- Paso 5 la reemplaza para revisar que la verificación de identidad esté aprobada.
create or replace function public.is_live_enabled(p_merchant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select false;
$$;

-- Ids de los comercios del usuario actual (para las políticas de ventas).
create or replace function public.my_merchant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.merchants where owner_id = (select auth.uid());
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger merchants_set_updated_at
  before update on public.merchants
  for each row execute function public.set_updated_at();

-- Una venta nueva SIEMPRE nace pendiente, con la hora del servidor y sin resultado.
create or replace function public.sales_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.status := 'pending';
  new.created_at := now();
  new.completed_at := null;
  new.refunded_at := null;
  new.provider_transaction_id := null;
  new.card_brand := null;
  new.failure_reason := null;
  return new;
end;
$$;

create trigger sales_before_insert
  before insert on public.sales
  for each row execute function public.sales_before_insert();

-- Cambios permitidos en una venta:
--   pending  → approved | declined | canceled | failed   (cerrar el cobro)
--   approved → refunded                                   (solo el servidor)
-- Nada más: ni montos, ni comercio, ni modo, ni proveedor, ni fechas.
create or replace function public.sales_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.merchant_id is distinct from old.merchant_id
     or new.amount is distinct from old.amount
     or new.tip is distinct from old.tip
     or new.currency is distinct from old.currency
     or new.mode is distinct from old.mode
     or new.provider is distinct from old.provider
     or new.created_at is distinct from old.created_at then
    raise exception 'No se pueden modificar los datos de una venta ya registrada.'
      using errcode = 'check_violation';
  end if;

  if new.status = old.status then
    raise exception 'La venta ya está en estado %.', old.status
      using errcode = 'check_violation';
  end if;

  if old.status = 'pending' and new.status in ('approved', 'declined', 'canceled', 'failed') then
    new.completed_at := now();
    new.refunded_at := null;
  elsif old.status = 'approved' and new.status = 'refunded' then
    -- Los reembolsos los confirma el servidor (Edge Function con la API del proveedor).
    if current_user = 'authenticated' then
      raise exception 'Los reembolsos solo los registra el servidor.'
        using errcode = 'insufficient_privilege';
    end if;
    new.refunded_at := now();
    new.completed_at := old.completed_at;
    new.provider_transaction_id := old.provider_transaction_id;
    new.card_brand := old.card_brand;
    new.failure_reason := old.failure_reason;
  else
    raise exception 'Cambio de estado no permitido: % → %.', old.status, new.status
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger sales_before_update
  before update on public.sales
  for each row execute function public.sales_before_update();

-- -----------------------------------------------------------------------------
-- Seguridad por filas (RLS)
-- -----------------------------------------------------------------------------
alter table public.merchants enable row level security;
alter table public.sales enable row level security;

-- Comercios: el dueño ve, crea y edita el suyo. No se borran desde la app.
create policy "merchants: el dueño lo ve"
  on public.merchants for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "merchants: el dueño lo crea"
  on public.merchants for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "merchants: el dueño lo edita"
  on public.merchants for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- Ventas: solo las de comercios propios. El modo Real exige verificación.
create policy "sales: ver las propias"
  on public.sales for select to authenticated
  using (merchant_id in (select public.my_merchant_ids()));

create policy "sales: registrar en comercio propio"
  on public.sales for insert to authenticated
  with check (
    merchant_id in (select public.my_merchant_ids())
    and (mode = 'test' or public.is_live_enabled(merchant_id))
  );

create policy "sales: cerrar las propias"
  on public.sales for update to authenticated
  using (merchant_id in (select public.my_merchant_ids()))
  with check (merchant_id in (select public.my_merchant_ids()));

-- -----------------------------------------------------------------------------
-- Permisos por columna (defensa adicional a RLS)
-- -----------------------------------------------------------------------------
revoke all on public.merchants, public.sales from anon;
revoke all on public.merchants, public.sales from authenticated;

grant select on public.merchants to authenticated;
grant insert (business_name, business_type, legal_type) on public.merchants to authenticated;
grant update (business_name, business_type, legal_type) on public.merchants to authenticated;

grant select on public.sales to authenticated;
grant insert (id, merchant_id, amount, tip, mode, provider) on public.sales to authenticated;
grant update (status, provider_transaction_id, card_brand, failure_reason) on public.sales to authenticated;

revoke all on function public.is_live_enabled(uuid) from public, anon;
revoke all on function public.my_merchant_ids() from public, anon;
grant execute on function public.is_live_enabled(uuid) to authenticated;
grant execute on function public.my_merchant_ids() to authenticated;
