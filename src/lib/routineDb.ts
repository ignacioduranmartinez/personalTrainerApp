import { supabase } from './supabase'
import type { Routine, RoutineImportJSON } from '../types/routine'

export async function saveRoutine(routine: Routine | RoutineImportJSON): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const startDate = 'startDate' in routine ? routine.startDate : undefined
  const endDate = 'endDate' in routine ? routine.endDate : undefined

  const { data: routineRow, error: rErr } = await supabase
    .from('routines')
    .insert({
      user_id: user.id,
      name: routine.name,
      start_date: startDate || null,
      end_date: endDate || null
    })
    .select('id')
    .single()

  if (rErr || !routineRow) return null

  const routineId = routineRow.id

  for (let weekIndex = 0; weekIndex < routine.weeks.length; weekIndex++) {
    const week = routine.weeks[weekIndex]
    for (let dayIndex = 0; dayIndex < week.days.length; dayIndex++) {
      const day = week.days[dayIndex]
      const { data: dayRow, error: dErr } = await supabase
        .from('routine_days')
        .insert({
          routine_id: routineId,
          week_index: weekIndex,
          day_index: dayIndex,
          label: day.label
        })
        .select('id')
        .single()

      if (dErr || !dayRow) continue

      for (let i = 0; i < day.exercises.length; i++) {
        const ex = day.exercises[i]
        await supabase.from('routine_exercises').insert({
          routine_day_id: dayRow.id,
          sort_order: i,
          name: ex.name,
          sets: ex.sets ?? null,
          reps: ex.reps ?? null,
          intensity: ex.intensity ?? null,
          rest_seconds: ex.restSeconds ?? null,
          notes: ex.notes ?? null,
          demo_image_url: ex.demo?.imageUrl ?? null,
          demo_video_url: ex.demo?.videoUrl ?? null
        })
      }
    }
  }

  return routineId
}

export async function deleteRoutine(id: string): Promise<boolean> {
  const { error } = await supabase.from('routines').delete().eq('id', id)
  return !error
}

export async function updateRoutineDates(
  id: string,
  startDate: string | null,
  endDate: string | null
): Promise<boolean> {
  const { error } = await supabase
    .from('routines')
    .update({ start_date: startDate, end_date: endDate })
    .eq('id', id)
  return !error
}

export async function updateRoutineName(routineId: string, name: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const { error } = await supabase
    .from('routines')
    .update({ name: name.trim() })
    .eq('id', routineId)
    .eq('user_id', user.id)
  return { error: error?.message ?? null }
}

export async function updateRoutineDayLabel(dayId: string, label: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const { data, error } = await supabase
    .from('routine_days')
    .update({ label: label.trim() })
    .eq('id', dayId)
    .select('id')
    .maybeSingle()
  if (error) return { error: error.message }
  if (!data) return { error: 'No se pudo actualizar el día (¿permisos o rutina de otro usuario?)' }
  return { error: null }
}

/** Añade un día al final de la rutina (sin ejercicios). */
export async function addRoutineDay(routineId: string): Promise<{ error: string | null; dayId?: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const { data: days } = await supabase
    .from('routine_days')
    .select('id, week_index, day_index')
    .eq('routine_id', routineId)
    .order('week_index', { ascending: true })
    .order('day_index', { ascending: true })
  const list = (days || []) as { id: string; week_index: number; day_index: number }[]
  let weekIndex = 0
  let dayIndex = 0
  if (list.length > 0) {
    const last = list[list.length - 1]
    weekIndex = last.week_index
    dayIndex = last.day_index + 1
  }
  const label = `Día ${list.length + 1}`
  const { data: newDay, error } = await supabase
    .from('routine_days')
    .insert({ routine_id: routineId, week_index: weekIndex, day_index: dayIndex, label })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { error: null, dayId: (newDay as { id: string }).id }
}

/** Elimina un día de la rutina (y sus ejercicios por cascade). */
export async function deleteRoutineDay(dayId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('routine_days').delete().eq('id', dayId)
  return { error: error?.message ?? null }
}

/** Datos mínimos para añadir un ejercicio a un día de la rutina */
export interface AddExerciseInput {
  name: string
  sets?: number | null
  reps?: string | null
  intensity?: string | null
  rest_seconds?: number | null
  notes?: string | null
  demo_image_url?: string | null
  demo_video_url?: string | null
}

/** Añade un ejercicio al final de un día de la rutina. */
export async function addExerciseToDay(dayId: string, input: AddExerciseInput): Promise<{ error: string | null; id?: string }> {
  const { data: existing } = await supabase
    .from('routine_exercises')
    .select('sort_order')
    .eq('routine_day_id', dayId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextOrder = existing != null ? ((existing as { sort_order: number }).sort_order + 1) : 0
  const { data: row, error } = await supabase
    .from('routine_exercises')
    .insert({
      routine_day_id: dayId,
      sort_order: nextOrder,
      name: input.name.trim(),
      sets: input.sets ?? null,
      reps: input.reps ?? null,
      intensity: input.intensity ?? null,
      rest_seconds: input.rest_seconds ?? null,
      notes: input.notes ?? null,
      demo_image_url: input.demo_image_url ?? null,
      demo_video_url: input.demo_video_url ?? null
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { error: null, id: (row as { id: string }).id }
}

/** Elimina un ejercicio de la rutina. */
export async function deleteRoutineExercise(exerciseId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('routine_exercises').delete().eq('id', exerciseId)
  return { error: error?.message ?? null }
}

/** Reordena los ejercicios de un día: orderedIds es el array de id de routine_exercises en el orden deseado. */
export async function reorderRoutineExercises(dayId: string, orderedIds: string[]): Promise<{ error: string | null }> {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('routine_exercises')
      .update({ sort_order: i })
      .eq('id', orderedIds[i])
      .eq('routine_day_id', dayId)
    if (error) return { error: error.message }
  }
  return { error: null }
}

/** Override del próximo día: el entrenador puede fijar "el próximo entreno será Día X". */
export async function setNextDayOverride(routineId: string, nextDayIndex: number): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const { error } = await supabase
    .from('user_routine_next_override')
    .upsert(
      { user_id: user.id, routine_id: routineId, next_day_index: nextDayIndex, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,routine_id' }
    )
  return { error: error?.message ?? null }
}

export async function getNextDayOverride(routineId: string): Promise<number | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('user_routine_next_override')
    .select('next_day_index')
    .eq('user_id', user.id)
    .eq('routine_id', routineId)
    .maybeSingle()
  return data != null ? (data as { next_day_index: number }).next_day_index : null
}

export async function clearNextDayOverride(routineId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('user_routine_next_override')
    .delete()
    .eq('user_id', user.id)
    .eq('routine_id', routineId)
}

/** Activa esta rutina desde hoy: pone start_date=hoy y end_date=null, y pone end_date=ayer en cualquier otra que estuviera activa hoy. */
export async function setRoutineActive(routineId: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10)

  const { data: routines } = await supabase
    .from('routines')
    .select('id, start_date, end_date')
    .eq('user_id', user.id)

  const others = (routines || []).filter(
    (r: { id: string; start_date: string | null; end_date: string | null }) =>
      r.id !== routineId &&
      (!r.start_date || r.start_date <= today) &&
      (!r.end_date || r.end_date >= today)
  )

  for (const r of others) {
    await supabase
      .from('routines')
      .update({ end_date: yesterday })
      .eq('id', r.id)
  }

  const { error } = await supabase
    .from('routines')
    .update({ start_date: today, end_date: null })
    .eq('id', routineId)
    .eq('user_id', user.id)

  return { error: error?.message ?? null }
}

export async function updateExerciseDemo(
  exerciseId: string,
  demo: { videoUrl?: string | null; imageUrl?: string | null }
): Promise<{ error: string | null }> {
  const updates: { demo_video_url?: string | null; demo_image_url?: string | null } = {}
  if (demo.videoUrl !== undefined) updates.demo_video_url = demo.videoUrl ?? null
  if (demo.imageUrl !== undefined) updates.demo_image_url = demo.imageUrl ?? null
  if (Object.keys(updates).length === 0) return { error: null }
  const { error } = await supabase
    .from('routine_exercises')
    .update(updates)
    .eq('id', exerciseId)
  return { error: error?.message ?? null }
}

export async function updateExerciseRest(
  exerciseId: string,
  restSeconds: number | null
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('routine_exercises')
    .update({ rest_seconds: restSeconds })
    .eq('id', exerciseId)
  return { error: error?.message ?? null }
}

export interface ExerciseRow {
  id: string
  name: string
  sets: number | null
  reps: string | null
  intensity: string | null
  rest_seconds: number | null
  notes: string | null
  demo_image_url: string | null
  demo_video_url: string | null
}

/** Obtiene un ejercicio por id (para la ficha). RLS: solo si pertenece a una rutina del usuario. */
export async function getExerciseById(exerciseId: string): Promise<ExerciseRow | null> {
  const { data, error } = await supabase
    .from('routine_exercises')
    .select('id, name, sets, reps, intensity, rest_seconds, notes, demo_image_url, demo_video_url')
    .eq('id', exerciseId)
    .maybeSingle()
  if (error || !data) return null
  return data as ExerciseRow
}
