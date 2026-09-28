create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null,
  services text[] not null,
  responsible text not null,
  status text not null default 'Novo',
  notes text,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leads_name_check
    check (char_length(btrim(name)) between 2 and 100),
  constraint leads_whatsapp_check
    check (whatsapp ~ '^[0-9]{10,13}$'),
  constraint leads_services_check
    check (
      cardinality(services) between 1 and 6
      and services <@ array[
        'criacao-de-sites',
        'seo',
        'criacao-de-marca',
        'branding',
        'trafego-pago',
        'estrategia-de-marketing'
      ]::text[]
    ),
  constraint leads_responsible_check
    check (responsible in ('Eudes', 'Wallyson', 'Ambos')),
  constraint leads_status_check
    check (status in ('Novo', 'Em atendimento', 'Atendido', 'Não convertido')),
  constraint leads_source_url_check
    check (source_url is null or char_length(source_url) <= 2048)
);

comment on table public.leads is
  'Leads captados pelo formulário do site institucional da Oriz.';

alter table public.leads enable row level security;

revoke all on table public.leads from anon;
revoke all on table public.leads from authenticated;
