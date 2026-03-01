-- Añadir finished_at a workout_log (sesión empezada vs finalizada)
alter table public.workout_log
  add column if not exists finished_at timestamptz;
