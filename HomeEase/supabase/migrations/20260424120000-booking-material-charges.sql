-- Material / extra charges on bookings (provider adds during service)

alter table public.bookings
  add column if not exists base_service_amount numeric(10,2),
  add column if not exists payment_acknowledged_at timestamptz;

update public.bookings
set base_service_amount = total_amount
where base_service_amount is null;

create table if not exists public.booking_material_charges (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  item_name text not null,
  amount numeric(10,2) not null check (amount > 0),
  created_at timestamptz default now()
);

create index if not exists idx_booking_material_charges_booking_id
  on public.booking_material_charges(booking_id);

alter table public.booking_material_charges enable row level security;

drop policy if exists "providers manage booking material charges" on public.booking_material_charges;
create policy "providers manage booking material charges"
  on public.booking_material_charges
  for all
  to authenticated
  using (
    booking_id in (
      select b.id from public.bookings b
      join public.service_providers sp on b.service_provider_id = sp.id
      where sp.user_id = auth.uid()
    )
  )
  with check (
    booking_id in (
      select b.id from public.bookings b
      join public.service_providers sp on b.service_provider_id = sp.id
      where sp.user_id = auth.uid()
    )
  );

drop policy if exists "customers view booking material charges" on public.booking_material_charges;
create policy "customers view booking material charges"
  on public.booking_material_charges
  for select
  to authenticated
  using (
    booking_id in (
      select id from public.bookings where customer_id = auth.uid()
    )
  );

grant select, insert, update, delete on public.booking_material_charges to authenticated;
