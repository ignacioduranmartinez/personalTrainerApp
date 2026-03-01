-- Añadir tabla workout_log (registro lineal por fecha)
-- Ejecutar en SQL Editor de Supabase si ya tenías el schema anterior

create table if not exists public.workout_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  routine_id uuid references public.routines(id) on delete cascade not null,
  for_date date not null,
  routine_day_index int not null,
  session_notes text,
  created_at timestamptz default now(),
  unique(user_id, routine_id, for_date)
);

alter table public.workout_log enable row level security;

create policy "Users can manage own workout_log"
  on public.workout_log for all using (auth.uid() = user_id);
