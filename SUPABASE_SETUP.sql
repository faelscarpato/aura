-- Tabela para armazenar memórias da AURA
create table public.aura_memories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  summary text not null,
  payload jsonb not null,         -- estado relevante da Aura
  source text not null default 'aura',
  session_id text null
);

-- Índices para performance (opcional)
create index aura_memories_created_at_idx on public.aura_memories (created_at desc);
create index aura_memories_session_id_idx on public.aura_memories (session_id);

-- Comentário:
-- A coluna `payload` armazena um JSON com:
--  * últimos N turnos da conversa,
--  * contexto do usuário (nome, perfil),
--  * estado de listas, tarefas, etc.
