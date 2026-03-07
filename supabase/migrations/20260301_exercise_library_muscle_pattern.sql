-- Añadir músculo y patrón de movimiento a la biblioteca de ejercicios
alter table public.exercise_library
  add column if not exists muscle text,
  add column if not exists movement_pattern text;

comment on column public.exercise_library.muscle is 'Pecho, Hombro, Espalda, Biceps, Triceps, Pierna';
comment on column public.exercise_library.movement_pattern is 'Push, Pull, Legs';
