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

/** Importa ejercicios desde rutinas existentes del usuario (deduplicando por nombre exacto). */
export async function importLibraryFromRoutines(): Promise<{ imported: number; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { imported: 0, error: 'No autenticado' }

  const { data: routines, error: rErr } = await supabase
    .from('routines')
    .select('id')
    .eq('user_id', user.id)
  if (rErr) return { imported: 0, error: rErr.message }
  const routineIds = (routines || []).map((r) => (r as { id: string }).id)
  if (routineIds.length === 0) return { imported: 0, error: null }

  const { data: days, error: dErr } = await supabase
    .from('routine_days')
    .select('id')
    .in('routine_id', routineIds)
  if (dErr) return { imported: 0, error: dErr.message }
  const dayIds = (days || []).map((d) => (d as { id: string }).id)
  if (dayIds.length === 0) return { imported: 0, error: null }

  const { data: ex, error: eErr } = await supabase
    .from('routine_exercises')
    .select('name, notes, demo_image_url, demo_video_url')
    .in('routine_day_id', dayIds)
  if (eErr) return { imported: 0, error: eErr.message }

  const seen = new Set<string>()
  const payload: Array<{
    user_id: string
    name: string
    category: string | null
    typology: string | null
    equipment: string | null
    notes: string | null
    demo_image_url: string | null
    demo_video_url: string | null
  }> = []

  for (const row of ex || []) {
    const r = row as { name: string; notes: string | null; demo_image_url: string | null; demo_video_url: string | null }
    const n = (r.name || '').trim()
    if (!n) continue
    if (seen.has(n)) continue
    seen.add(n)
    payload.push({
      user_id: user.id,
      name: n,
      category: null,
      typology: null,
      equipment: null,
      notes: r.notes ?? null,
      demo_image_url: r.demo_image_url ?? null,
      demo_video_url: r.demo_video_url ?? null
    })
  }

  if (payload.length === 0) return { imported: 0, error: null }

  const { error: upErr } = await supabase
    .from('exercise_library')
    .upsert(payload, { onConflict: 'user_id,name' })

  return { imported: payload.length, error: upErr?.message ?? null }
}

