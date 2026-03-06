-- Biblioteca de ejercicios (catálogo) por usuario
create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text,
  typology text,
  equipment text,
  notes text,
  demo_image_url text,
  demo_video_url text,
  created_at timestamptz default now(),
  unique(user_id, name)
);

alter table public.exercise_library enable row level security;

create policy "Users can manage own exercise_library"
  on public.exercise_library for all using (auth.uid() = user_id);

