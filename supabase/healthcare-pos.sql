-- Bakhsh POS healthcare extension.
-- Use case:
-- 1. Adds healthcare tables used by the Doctor workspace.
-- 2. Adds return/procurement/audit tables for traditional POS operations.
-- 3. Adds atomic checkout and return functions so stock and transactions stay consistent.
--
-- Run this file once in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Keep database role validation aligned with the app.
-- Older installs may only allow admin/pharmacist, which blocks doctor users.
alter table if exists public.profiles
    drop constraint if exists profiles_role_check;

alter table if exists public.profiles
    add constraint profiles_role_check
    check (role in ('admin', 'pharmacist', 'doctor'));

create table if not exists public.patients (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    phone text not null,
    age integer,
    gender text,
    address text,
    allergies text,
    notes text,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists patients_phone_idx on public.patients(phone);
create index if not exists patients_created_at_idx on public.patients(created_at desc);

create table if not exists public.prescriptions (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references public.patients(id) on delete cascade,
    diagnosis text,
    medicines jsonb not null default '[]'::jsonb,
    instructions text,
    status text not null default 'issued',
    created_by uuid references auth.users(id) on delete set null,
    dispensed_by uuid references auth.users(id) on delete set null,
    dispensed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint prescriptions_status_check check (status in ('issued', 'partially_dispensed', 'dispensed', 'cancelled'))
);

create index if not exists prescriptions_patient_id_idx on public.prescriptions(patient_id);
create index if not exists prescriptions_status_idx on public.prescriptions(status);
create index if not exists prescriptions_created_at_idx on public.prescriptions(created_at desc);

create table if not exists public.appointments (
    id uuid primary key default gen_random_uuid(),
    patient_id uuid not null references public.patients(id) on delete cascade,
    scheduled_at timestamptz not null,
    reason text,
    status text not null default 'scheduled',
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint appointments_status_check check (status in ('scheduled', 'completed', 'cancelled', 'no_show'))
);

create index if not exists appointments_patient_id_idx on public.appointments(patient_id);
create index if not exists appointments_scheduled_at_idx on public.appointments(scheduled_at);

create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid references auth.users(id) on delete set null,
    action text not null,
    entity_type text not null,
    entity_id uuid,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);

create table if not exists public.suppliers (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    phone text,
    email text,
    address text,
    contact_person text,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
    id uuid primary key default gen_random_uuid(),
    supplier_id uuid references public.suppliers(id) on delete set null,
    status text not null default 'draft',
    expected_at date,
    notes text,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint purchase_orders_status_check check (status in ('draft', 'ordered', 'received', 'cancelled'))
);

create table if not exists public.purchase_order_items (
    id uuid primary key default gen_random_uuid(),
    purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
    product_id uuid references public.products(id) on delete set null,
    product_name text not null,
    quantity integer not null check (quantity > 0),
    unit_cost numeric(12, 2),
    batch_number text,
    expiry_date date,
    created_at timestamptz not null default now()
);

create table if not exists public.stock_adjustments (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references public.products(id) on delete cascade,
    quantity_delta integer not null,
    reason text not null,
    notes text,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now()
);

create table if not exists public.returns (
    id uuid primary key default gen_random_uuid(),
    transaction_id uuid references public.transactions(id) on delete set null,
    product_id uuid references public.products(id) on delete set null,
    quantity integer not null check (quantity > 0),
    amount numeric(12, 2) not null default 0,
    reason text not null,
    status text not null default 'completed',
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    constraint returns_status_check check (status in ('pending', 'completed', 'rejected'))
);

create unique index if not exists returns_transaction_id_once_idx
    on public.returns(transaction_id)
    where transaction_id is not null and status = 'completed';

create index if not exists returns_created_at_idx on public.returns(created_at desc);

create or replace function public.process_pos_sale(
    sale_items jsonb,
    sale_customer_id uuid default null,
    sale_customer_name text default null,
    sale_payment_method text default 'cash',
    sale_notes text default null,
    sale_created_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    item jsonb;
    product_record products%rowtype;
    product_id uuid;
    requested_quantity integer;
    line_discount numeric;
    unit_price numeric;
    line_total numeric;
    created_transaction transactions%rowtype;
    created_transactions jsonb := '[]'::jsonb;
begin
    if sale_items is null or jsonb_typeof(sale_items) <> 'array' or jsonb_array_length(sale_items) = 0 then
        raise exception 'At least one sale item is required.';
    end if;

    for item in select * from jsonb_array_elements(sale_items)
    loop
        product_id := (item ->> 'productId')::uuid;
        requested_quantity := (item ->> 'quantity')::integer;
        line_discount := coalesce((item ->> 'discount')::numeric, 0);

        if requested_quantity is null or requested_quantity <= 0 then
            raise exception 'Quantity must be a positive integer.';
        end if;

        if line_discount < 0 then
            raise exception 'Discount must be zero or greater.';
        end if;

        select *
        into product_record
        from products
        where id = product_id
        for update;

        if not found then
            raise exception 'Product not found.';
        end if;

        if product_record.is_active is not true then
            raise exception '% is inactive.', product_record.name;
        end if;

        if requested_quantity > product_record.stock then
            raise exception 'Only % % available for %.', product_record.stock, product_record.unit, product_record.name;
        end if;

        unit_price := product_record.price;
        line_total := greatest((unit_price * requested_quantity) - line_discount, 0);

        insert into transactions (
            product_id,
            customer_id,
            customer_name,
            quantity,
            unit_price,
            discount,
            total,
            payment_method,
            notes,
            created_by
        )
        values (
            product_id,
            sale_customer_id,
            nullif(trim(coalesce(sale_customer_name, '')), ''),
            requested_quantity,
            unit_price,
            line_discount,
            line_total,
            lower(coalesce(sale_payment_method, 'cash')),
            nullif(trim(coalesce(sale_notes, '')), ''),
            sale_created_by
        )
        returning * into created_transaction;

        update products
        set stock = stock - requested_quantity
        where id = product_id;

        insert into audit_logs(actor_id, action, entity_type, entity_id, metadata)
        values (
            sale_created_by,
            'sale_created',
            'transaction',
            created_transaction.id,
            jsonb_build_object('product_id', product_id, 'quantity', requested_quantity, 'total', line_total)
        );

        created_transactions := created_transactions || jsonb_build_array(
            jsonb_build_object(
                'id', created_transaction.id,
                'product_id', created_transaction.product_id,
                'customer_id', created_transaction.customer_id,
                'customer_name', created_transaction.customer_name,
                'quantity', created_transaction.quantity,
                'unit_price', created_transaction.unit_price,
                'discount', created_transaction.discount,
                'total', created_transaction.total,
                'payment_method', created_transaction.payment_method,
                'notes', created_transaction.notes,
                'created_at', created_transaction.created_at,
                'product_name', product_record.name,
                'product_unit', product_record.unit
            )
        );
    end loop;

    return created_transactions;
end;
$$;

create or replace function public.process_pos_return(
    return_transaction_id uuid,
    return_reason text,
    return_created_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    transaction_record transactions%rowtype;
    created_return returns%rowtype;
begin
    if return_reason is null or length(trim(return_reason)) = 0 then
        raise exception 'Return reason is required.';
    end if;

    select *
    into transaction_record
    from transactions
    where id = return_transaction_id
    for update;

    if not found then
        raise exception 'Transaction not found.';
    end if;

    if exists (
        select 1
        from returns
        where transaction_id = return_transaction_id
          and status = 'completed'
    ) then
        raise exception 'This transaction has already been returned.';
    end if;

    insert into returns (
        transaction_id,
        product_id,
        quantity,
        amount,
        reason,
        status,
        created_by
    )
    values (
        transaction_record.id,
        transaction_record.product_id,
        transaction_record.quantity,
        transaction_record.total,
        trim(return_reason),
        'completed',
        return_created_by
    )
    returning * into created_return;

    update products
    set stock = stock + transaction_record.quantity
    where id = transaction_record.product_id;

    insert into audit_logs(actor_id, action, entity_type, entity_id, metadata)
    values (
        return_created_by,
        'sale_returned',
        'return',
        created_return.id,
        jsonb_build_object('transaction_id', transaction_record.id, 'amount', created_return.amount)
    );

    return to_jsonb(created_return);
end;
$$;
