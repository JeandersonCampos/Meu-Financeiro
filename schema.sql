-- Cole este arquivo inteiro em Supabase > SQL Editor > Run (uma única vez)
create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nome text not null,
  tipo text not null check (tipo in ('entrada','saida')),
  created_at timestamptz not null default now()
);

create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  tipo text not null check (tipo in ('entrada','saida')),
  data date not null,
  valor_centavos bigint not null check (valor_centavos > 0),
  categoria_id uuid references public.categorias(id) on delete set null,
  descricao text,
  created_at timestamptz not null default now()
);
create index on public.lancamentos (user_id, data);

alter table public.categorias enable row level security;
alter table public.lancamentos enable row level security;

create policy "so o dono" on public.categorias for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "so o dono" on public.lancamentos for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- tempo real entre PC e celular
alter publication supabase_realtime add table public.categorias, public.lancamentos;
