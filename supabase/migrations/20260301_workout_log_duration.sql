-- Duración del entrenamiento: desde que se inicia hasta que se finaliza
alter table public.workout_log
  add column if not exists started_at timestamptz;
alter table public.workout_log
  add column if not exists duration_seconds int;
