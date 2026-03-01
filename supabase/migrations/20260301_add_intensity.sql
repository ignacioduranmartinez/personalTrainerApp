-- Añadir columna intensity (% RM / Intensidad) a routine_exercises
alter table public.routine_exercises
  add column if not exists intensity text;
