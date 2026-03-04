import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface ExerciseRef {
  id?: string
  name: string
}

interface SessionExerciseNote {
  exerciseName: string
  note: string | null
}

/** Notas por ejercicio para una sesión concreta (fecha) de la rutina activa. */
export function useSessionExerciseNotes(
  routineId: string | null,
  forDate: string | null,
  exercises: ExerciseRef[]
) {
  const [notes, setNotes] = useState<SessionExerciseNote[]>([])
  const [loading, setLoading] = useState(!!(routineId && forDate))

  const load = useCallback(async () => {
    if (!routineId || !forDate) {
      setNotes([])
      setLoading(false)
      return
    }
    const ids = exercises.map((e) => e.id).filter((id): id is string => !!id)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setNotes([])
      setLoading(false)
      return
    }
    if (ids.length === 0) {
      setNotes(exercises.map((e) => ({ exerciseName: e.name, note: null })))
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('exercise_notes')
      .select('routine_exercise_id, note')
      .eq('user_id', user.id)
      .eq('for_date', forDate)
      .in('routine_exercise_id', ids)

    const notesById = new Map<string, string | null>()
    for (const row of data || []) {
      const r = row as { routine_exercise_id: string; note: string | null }
      notesById.set(r.routine_exercise_id, r.note)
    }

    setNotes(
      exercises.map((e) => ({
        exerciseName: e.name,
        note: e.id ? notesById.get(e.id) ?? null : null
      }))
    )
    setLoading(false)
  }, [routineId, forDate, exercises.map((e) => e.id).join(',')])

  useEffect(() => {
    load()
  }, [load])

  return { notes, loading, refetch: load }
}

