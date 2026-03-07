import { supabase } from './supabase'

/** Opciones de músculo en la biblioteca */
export const MUSCLE_OPTIONS = ['Pecho', 'Hombro', 'Espalda', 'Biceps', 'Triceps', 'Pierna', 'Core', 'Cardio'] as const
/** Opciones de patrón de movimiento */
export const MOVEMENT_PATTERN_OPTIONS = ['Push', 'Pull', 'Legs', 'Core', 'Cardio'] as const

export type MuscleOption = (typeof MUSCLE_OPTIONS)[number]
export type MovementPatternOption = (typeof MOVEMENT_PATTERN_OPTIONS)[number]

export interface LibraryExercise {
  id: string
  user_id: string
  name: string
  category: string | null
  typology: string | null
  equipment: string | null
  muscle: string | null
  movement_pattern: string | null
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
  muscle?: string
  movementPattern?: string
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
    muscle: input.muscle?.trim() || null,
    movement_pattern: input.movementPattern?.trim() || null,
    notes: input.notes?.trim() || null,
    demo_video_url: input.demoVideoUrl?.trim() || null,
    demo_image_url: input.demoImageUrl?.trim() || null
  })
  return { error: error?.message ?? null }
}

export async function updateLibraryExercise(
  id: string,
  updates: {
    name?: string
    category?: string
    typology?: string
    equipment?: string
    muscle?: string | null
    movementPattern?: string | null
    notes?: string | null
    demoVideoUrl?: string | null
    demoImageUrl?: string | null
  }
): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const payload: Record<string, unknown> = {}
  if (updates.name !== undefined) payload.name = updates.name.trim()
  if (updates.category !== undefined) payload.category = updates.category?.trim() || null
  if (updates.typology !== undefined) payload.typology = updates.typology?.trim() || null
  if (updates.equipment !== undefined) payload.equipment = updates.equipment?.trim() || null
  if (updates.muscle !== undefined) payload.muscle = updates.muscle?.trim() || null
  if (updates.movementPattern !== undefined) payload.movement_pattern = updates.movementPattern?.trim() || null
  if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null
  if (updates.demoVideoUrl !== undefined) payload.demo_video_url = updates.demoVideoUrl?.trim() || null
  if (updates.demoImageUrl !== undefined) payload.demo_image_url = updates.demoImageUrl?.trim() || null
  const { error } = await supabase
    .from('exercise_library')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)
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
    muscle: string | null
    movement_pattern: string | null
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
      muscle: null,
      movement_pattern: null,
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

