-- =============================================================================
-- Pruebas de seguridad de la base de datos (RLS, permisos y transiciones).
-- Se corren con supabase/tests/run-local.sh sobre un Postgres local.
-- Cualquier fallo detiene el script con un error.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Ayudas para las pruebas
-- ---------------------------------------------------------------------------
create schema tests;
grant usage on schema tests to anon, authenticated, service_role;

-- Ejecuta SQL y exige que falle.
create function tests.expect_error(p_sql text, p_label text) returns void
language plpgsql as $$
begin
  begin
    execute p_sql;
  exception when others then
    raise notice '  ✔ % (rechazado: %)', p_label, sqlerrm;
    return;
  end;
  raise exception '✘ FALLO: se esperaba un error en: %', p_label;
end;
$$;

-- Ejecuta SQL y exige que afecte exactamente N filas.
create function tests.expect_rows(p_sql text, p_expected int, p_label text) returns void
language plpgsql as $$
declare
  n int;
begin
  execute p_sql;
  get diagnostics n = row_count;
  if n <> p_expected then
    raise exception '✘ FALLO: % (filas: %, esperadas: %)', p_label, n, p_expected;
  end if;
  raise notice '  ✔ %', p_label;
end;
$$;

-- Exige que una condición sea verdadera.
create function tests.check(p_ok boolean, p_label text) returns void
language plpgsql as $$
begin
  if p_ok is not true then
    raise exception '✘ FALLO: %', p_label;
  end if;
  raise notice '  ✔ %', p_label;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated, service_role;

-- Dos dueños de tienda: A y B.
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a@tienda.co'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b@tienda.co');

-- ---------------------------------------------------------------------------
\warn '— Comercios'
-- ---------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', false);

select tests.expect_rows(
  $$insert into public.merchants (business_name, business_type) values ('Tienda Doña Rosa', 'tienda')$$,
  1, 'A crea su comercio');

select tests.check(
  (select owner_id from public.merchants) = 'aaaaaaaa-0000-4000-8000-000000000001',
  'el comercio queda a nombre de A automáticamente');

select tests.expect_error(
  $$insert into public.merchants (business_name, business_type) values ('Otra tienda', 'tienda')$$,
  'A no puede tener dos comercios');

select tests.expect_error(
  $$insert into public.merchants (owner_id, business_name, business_type)
    values ('bbbbbbbb-0000-4000-8000-000000000002', 'Suplantación', 'tienda')$$,
  'nadie puede crear un comercio a nombre de otro');

select tests.expect_error(
  $$insert into public.merchants (business_name, business_type) values (' ', 'tienda')$$,
  'el nombre del negocio no puede estar vacío');

select tests.expect_error(
  $$insert into public.merchants (business_name, business_type) values ('Casino', 'casino')$$,
  'el tipo de negocio debe ser uno de la lista');

select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-000000000002', false);
select tests.expect_rows(
  $$insert into public.merchants (business_name, business_type, legal_type)
    values ('Ferretería El Tornillo SAS', 'ferreteria', 'empresa')$$,
  1, 'B crea su comercio (empresa)');

select tests.check((select count(*) from public.merchants) = 1, 'B solo ve su propio comercio');

select tests.expect_rows(
  $$update public.merchants set business_name = 'Hackeado' where business_name = 'Tienda Doña Rosa'$$,
  0, 'B no puede editar el comercio de A');

select tests.expect_error(
  $$update public.merchants set owner_id = 'aaaaaaaa-0000-4000-8000-000000000001'$$,
  'nadie puede cambiar el dueño de un comercio');

-- ---------------------------------------------------------------------------
\warn '— Ventas: registrar'
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', false);

select tests.expect_rows(
  $$insert into public.sales (id, merchant_id, amount, tip, mode, provider)
    select '11111111-0000-4000-8000-000000000001', id, 12500, 1250, 'test', 'mock'
    from public.merchants$$,
  1, 'A registra una venta de prueba');

select tests.check(
  (select status = 'pending' and total = 13750 and currency = 'COP' and completed_at is null
   from public.sales where id = '11111111-0000-4000-8000-000000000001'),
  'la venta nace pendiente, en COP y con total = venta + propina');

select tests.expect_error(
  $$insert into public.sales (id, merchant_id, amount, tip, mode, provider, status)
    select gen_random_uuid(), id, 5000, 0, 'test', 'mock', 'approved' from public.merchants$$,
  'no se puede registrar una venta ya "aprobada"');

select tests.expect_error(
  $$insert into public.sales (id, merchant_id, amount, tip, mode, provider)
    select gen_random_uuid(), id, 5000, 0, 'live', 'sumup' from public.merchants$$,
  'el modo Real está bloqueado sin verificación de identidad');

select tests.expect_error(
  $$insert into public.sales (id, merchant_id, amount, tip, mode, provider)
    select gen_random_uuid(), id, 5000, 0, 'test', 'sumup' from public.merchants$$,
  'en modo Prueba solo se permite el proveedor simulado');

select tests.expect_error(
  $$insert into public.sales (id, merchant_id, amount, tip, mode, provider)
    select gen_random_uuid(), id, 0, 0, 'test', 'mock' from public.merchants$$,
  'el monto debe ser mayor que cero');

select tests.expect_error(
  $$insert into public.sales (id, merchant_id, amount, tip, mode, provider)
    select gen_random_uuid(), id, 5000, -1, 'test', 'mock' from public.merchants$$,
  'la propina no puede ser negativa');

-- A intenta registrar una venta en el comercio de B (id obtenido como superusuario).
reset role;
select set_config('tests.merchant_b', (select id::text from public.merchants where business_type = 'ferreteria'), false);
set role authenticated;
select tests.expect_error(
  format(
    $$insert into public.sales (id, merchant_id, amount, tip, mode, provider)
      values (gen_random_uuid(), %L, 5000, 0, 'test', 'mock')$$,
    current_setting('tests.merchant_b')),
  'A no puede registrar ventas en el comercio de B');

-- ---------------------------------------------------------------------------
\warn '— Ventas: cerrar el cobro'
-- ---------------------------------------------------------------------------
select tests.expect_rows(
  $$update public.sales set status = 'approved', card_brand = 'Visa', provider_transaction_id = 'mock_abc'
    where id = '11111111-0000-4000-8000-000000000001'$$,
  1, 'A cierra la venta como aprobada');

select tests.check(
  (select completed_at is not null from public.sales where id = '11111111-0000-4000-8000-000000000001'),
  'al cerrarla se registra la hora');

select tests.expect_error(
  $$update public.sales set status = 'declined' where id = '11111111-0000-4000-8000-000000000001'$$,
  'una venta aprobada no puede pasar a rechazada');

select tests.expect_error(
  $$update public.sales set status = 'approved' where id = '11111111-0000-4000-8000-000000000001'$$,
  'no se puede "cerrar" dos veces');

select tests.expect_error(
  $$update public.sales set amount = 1 where id = '11111111-0000-4000-8000-000000000001'$$,
  'el monto no se puede cambiar');

select tests.expect_error(
  $$update public.sales set mode = 'live' where id = '11111111-0000-4000-8000-000000000001'$$,
  'el modo no se puede cambiar');

select tests.expect_error(
  $$update public.sales set status = 'refunded' where id = '11111111-0000-4000-8000-000000000001'$$,
  'la app no puede marcar reembolsos (solo el servidor)');

select tests.expect_rows(
  $$insert into public.sales (id, merchant_id, amount, tip, mode, provider)
    select '11111111-0000-4000-8000-000000000002', id, 5013, 0, 'test', 'mock' from public.merchants$$,
  1, 'A registra otra venta');

select tests.expect_error(
  $$update public.sales set status = 'declined', card_brand = '4111111111111111'
    where id = '11111111-0000-4000-8000-000000000002'$$,
  'no se puede guardar un número de tarjeta en card_brand');

select tests.expect_error(
  $$update public.sales set status = 'refunded' where id = '11111111-0000-4000-8000-000000000002'$$,
  'una venta pendiente no puede pasar a reembolsada');

select tests.expect_rows(
  $$update public.sales set status = 'declined', failure_reason = 'Fondos insuficientes.'
    where id = '11111111-0000-4000-8000-000000000002'$$,
  1, 'A cierra una venta como rechazada');

-- ---------------------------------------------------------------------------
\warn '— Aislamiento entre comercios'
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-000000000002', false);

select tests.check((select count(*) from public.sales) = 0, 'B no ve las ventas de A');

select tests.expect_rows(
  $$update public.sales set status = 'failed' where id = '11111111-0000-4000-8000-000000000001'$$,
  0, 'B no puede tocar las ventas de A');

select tests.expect_error($$delete from public.sales$$, 'nadie puede borrar ventas desde la app');
select tests.expect_error($$delete from public.merchants$$, 'nadie puede borrar comercios desde la app');

-- ---------------------------------------------------------------------------
\warn '— Visitantes sin sesión (anon)'
-- ---------------------------------------------------------------------------
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select tests.expect_error($$select * from public.merchants$$, 'anon no puede leer comercios');
select tests.expect_error($$select * from public.sales$$, 'anon no puede leer ventas');

-- ---------------------------------------------------------------------------
\warn '— Servidor (service_role)'
-- ---------------------------------------------------------------------------
reset role;
set role service_role;
select tests.expect_rows(
  $$update public.sales set status = 'refunded' where id = '11111111-0000-4000-8000-000000000001'$$,
  1, 'el servidor sí puede registrar un reembolso');
select tests.check(
  (select refunded_at is not null and card_brand = 'Visa'
   from public.sales where id = '11111111-0000-4000-8000-000000000001'),
  'el reembolso guarda la hora y conserva los datos del cobro');

reset role;
\warn '✔ Todas las pruebas de base de datos pasaron'
