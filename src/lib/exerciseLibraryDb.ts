import { supabase } from './supabase'

export interface LibraryExercise {
  id: string
  user_id: string
  name: string
  category: string | null
  typology: string | null
  equipment: string | null
  notes: string | null
  demo_image_url: string | null
  demo_video_url: string | null
  created_at: string
}

export async function listLibraryExercises(): Promise<{ data: LibraryExercise[]; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'No autenticado' }
  const { data, error } = await supabase
    .from('exercise_library')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })
  return { data: (data as LibraryExercise[]) || [], error: error?.message ?? null }
}

export async function createLibraryExercise(input: {
  name: string
  category?: string
  typology?: string
  equipment?: string
  notes?: string
  demoVideoUrl?: string
  demoImageUrl?: string
}): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const { error } = await supabase.from('exercise_library').insert({
    user_id: user.id,
    name: input.name,
    category: input.category?.trim() || null,
    typology: input.typology?.trim() || null,
    equipment: input.equipment?.trim() || null,
    notes: input.notes?.trim() || null,
    demo_video_url: input.demoVideoUrl?.trim() || null,
    demo_image_url: input.demoImageUrl?.trim() || null
  })
  return { error: error?.message ?? null }
}

