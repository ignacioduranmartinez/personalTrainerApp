-- Asegurar políticas correctas en exercise_library (INSERT necesita WITH CHECK)
do $$
begin
  -- Si existe, eliminar la política antigua
  execute 'drop policy if exists "Users can manage own exercise_library" on public.exercise_library';
exception when undefined_table then
  -- tabla no existe aún en este proyecto
  return;
end $$;

alter table public.exercise_library enable row level security;

create policy "Users can read own exercise_library"
  on public.exercise_library for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own exercise_library"
  on public.exercise_library for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own exercise_library"
  on public.exercise_library for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own exercise_library"
  on public.exercise_library for delete to authenticated
  using (auth.uid() = user_id);

