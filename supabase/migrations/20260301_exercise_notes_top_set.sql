-- Serie máxima por ejercicio y día (peso x repeticiones)
alter table public.exercise_notes
  add column if not exists top_weight numeric,
  add column if not exists top_reps int;

