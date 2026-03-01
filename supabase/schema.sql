-- Ejecutar en el SQL Editor de tu proyecto Supabase (Dashboard → SQL Editor)

-- Rutinas (cabecera)
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- Días de la rutina (agrupación por semana/día)
create table if not exists public.routine_days (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid references public.routines(id) on delete cascade not null,
  week_index int not null,
  day_index int not null,
  label text not null
);

-- Ejercicios de cada día
create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_day_id uuid references public.routine_days(id) on delete cascade not null,
  sort_order int not null default 0,
  name text not null,
  sets int,
  reps text,
  intensity text,
  rest_seconds int,
  notes text,
  demo_image_url text,
  demo_video_url text
);

-- Notas del usuario por ejercicio (por día de ejecución)
create table if not exists public.exercise_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  routine_exercise_id uuid references public.routine_exercises(id) on delete cascade not null,
  for_date date not null,
  note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, routine_exercise_id, for_date)
);

-- Completado por día (opcional: marcar día/ejercicio como hecho)
create table if not exists public.exercise_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  routine_exercise_id uuid references public.routine_exercises(id) on delete cascade not null,
  for_date date not null,
  completed boolean default true,
  created_at timestamptz default now(),
  unique(user_id, routine_exercise_id, for_date)
);

-- Registro en calendario: qué día de la rutina se hizo en cada fecha (rutina lineal)
create table if not exists public.workout_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  routine_id uuid references public.routines(id) on delete cascade not null,
  for_date date not null,
  routine_day_index int not null,
  session_notes text,
  created_at timestamptz default now(),
  finished_at timestamptz,
  started_at timestamptz,
  duration_seconds int,
  unique(user_id, routine_id, for_date)
);

-- RLS
alter table public.routines enable row level security;
alter table public.routine_days enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.exercise_notes enable row level security;
alter table public.exercise_completions enable row level security;
alter table public.workout_log enable row level security;

create policy "Users can manage own routines"
  on public.routines for all using (auth.uid() = user_id);

create policy "Users can manage routine_days of own routines"
  on public.routine_days for all
  using (exists (select 1 from public.routines r where r.id = routine_days.routine_id and r.user_id = auth.uid()));

create policy "Users can manage routine_exercises of own routines"
  on public.routine_exercises for all
  using (exists (
    select 1 from public.routine_days rd
    join public.routines r on r.id = rd.routine_id
    where rd.id = routine_exercises.routine_day_id and r.user_id = auth.uid()
  ));

create policy "Users can manage own exercise_notes"
  on public.exercise_notes for all using (auth.uid() = user_id);

create policy "Users can manage own exercise_completions"
  on public.exercise_completions for all using (auth.uid() = user_id);

create policy "Users can manage own workout_log"
  on public.workout_log for all using (auth.uid() = user_id);

-- Lectura de rutinas: permitir a cualquier usuario autenticado leer (para compartir rutina con la usuaria)
-- Si solo la creador y la usuaria usan la app, puedes restringir más. Aquí permitimos leer todas las rutinas propias.
-- Para "compartir" con otro usuario podrías añadir una tabla routine_shared_with más adelante.
