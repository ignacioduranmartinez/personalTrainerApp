-- Override del próximo día de la rutina (entrenador indica "el próximo entreno será Día X")
create table if not exists public.user_routine_next_override (
  user_id uuid references auth.users(id) on delete cascade not null,
  routine_id uuid references public.routines(id) on delete cascade not null,
  next_day_index int not null,
  updated_at timestamptz default now(),
  primary key (user_id, routine_id)
);

alter table public.user_routine_next_override enable row level security;

create policy "Users can manage own next override"
  on public.user_routine_next_override for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.user_routine_next_override is 'Si está definido, Hoy usa este día como "siguiente" en lugar de last_log+1';
