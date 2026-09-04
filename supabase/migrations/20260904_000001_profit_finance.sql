-- SellerOS AI
-- Profit & Finance tables

-- =========================================================
-- PRODUCT COSTS
-- =========================================================

create table public.etsy_product_costs (
  id uuid not null default gen_random_uuid(),

  user_id uuid not null,

  etsy_shop_id bigint not null,
  etsy_listing_id bigint not null,

  listing_title text,

  material_cost numeric(12, 2) not null default 0,
  packaging_cost numeric(12, 2) not null default 0,
  labor_cost numeric(12, 2) not null default 0,
  other_unit_cost numeric(12, 2) not null default 0,

  currency text not null default 'USD',

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint etsy_product_costs_pkey
    primary key (id),

  constraint etsy_product_costs_user_id_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade,

  constraint etsy_product_costs_user_listing_unique
    unique (
      user_id,
      etsy_shop_id,
      etsy_listing_id
    ),

  constraint etsy_product_costs_material_cost_check
    check (material_cost >= 0),

  constraint etsy_product_costs_packaging_cost_check
    check (packaging_cost >= 0),

  constraint etsy_product_costs_labor_cost_check
    check (labor_cost >= 0),

  constraint etsy_product_costs_other_unit_cost_check
    check (other_unit_cost >= 0)
);

-- =========================================================
-- MANUAL BUSINESS EXPENSES
-- =========================================================

create table public.etsy_business_expenses (
  id uuid not null default gen_random_uuid(),

  user_id uuid not null,

  etsy_shop_id bigint,

  expense_date date not null,

  category text not null,

  description text,

  amount numeric(12, 2) not null,

  currency text not null default 'USD',

  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint etsy_business_expenses_pkey
    primary key (id),

  constraint etsy_business_expenses_user_id_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade,

  constraint etsy_business_expenses_amount_check
    check (amount > 0),

  constraint etsy_business_expenses_category_check
    check (
      category = any (
        array[
          'supplies'::text,
          'packaging'::text,
          'postage'::text,
          'advertising'::text,
          'software'::text,
          'equipment'::text,
          'professional_services'::text,
          'other'::text
        ]
      )
    )
);

-- =========================================================
-- UPDATED-AT TRIGGERS
-- =========================================================

create trigger set_etsy_product_costs_updated_at
before update on public.etsy_product_costs
for each row
execute function public.set_updated_at();

create trigger set_etsy_business_expenses_updated_at
before update on public.etsy_business_expenses
for each row
execute function public.set_updated_at();

-- =========================================================
-- INDEXES
-- =========================================================

create index etsy_product_costs_user_idx
  on public.etsy_product_costs using btree (
    user_id
  );

create index etsy_product_costs_listing_idx
  on public.etsy_product_costs using btree (
    etsy_listing_id
  );

create index etsy_business_expenses_user_date_idx
  on public.etsy_business_expenses using btree (
    user_id,
    expense_date desc
  );

create index etsy_business_expenses_shop_date_idx
  on public.etsy_business_expenses using btree (
    etsy_shop_id,
    expense_date desc
  );

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.etsy_product_costs
  enable row level security;

alter table public.etsy_business_expenses
  enable row level security;