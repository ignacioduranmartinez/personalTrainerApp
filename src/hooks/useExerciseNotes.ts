import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useExerciseNotes(routineExerciseId: string | null, forDate: string) {
  const [note, setNoteState] = useState('')
  const [topWeight, setTopWeightState] = useState<number | null>(null)
  const [topReps, setTopRepsState] = useState<number | null>(null)
  const [loading, setLoading] = useState(!!routineExerciseId)
  const [saving, setSaving] = useState(false)
  const [savingTop, setSavingTop] = useState(false)

  useEffect(() => {
    if (!routineExerciseId) {
      setNoteState('')
      setLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data } = await supabase
        .from('exercise_notes')
        .select('note, top_weight, top_reps')
        .eq('user_id', user.id)
        .eq('routine_exercise_id', routineExerciseId)
        .eq('for_date', forDate)
        .maybeSingle()
      if (!cancelled) {
        setNoteState((data?.note as string) || '')
        setTopWeightState(
          data && (data as { top_weight: number | null }).top_weight != null
            ? Number((data as { top_weight: number | null }).top_weight)
            : null
        )
        setTopRepsState(
          data && (data as { top_reps: number | null }).top_reps != null
            ? Number((data as { top_reps: number | null }).top_reps)
            : null
        )
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [routineExerciseId, forDate])

  const saveNote = useCallback(
    async (text: string) => {
      if (!routineExerciseId) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setSaving(true)
      await supabase.from('exercise_notes').upsert(
        {
          user_id: user.id,
          routine_exercise_id: routineExerciseId,
          for_date: forDate,
          note: text,
          top_weight: topWeight,
          top_reps: topReps,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,routine_exercise_id,for_date'
        }
      )
      setNoteState(text)
      setSaving(false)
    },
    [routineExerciseId, forDate, topWeight, topReps]
  )

  const saveTopSet = useCallback(
    async (weight: number | null, reps: number | null) => {
      if (!routineExerciseId) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setSavingTop(true)
      await supabase.from('exercise_notes').upsert(
        {
          user_id: user.id,
          routine_exercise_id: routineExerciseId,
          for_date: forDate,
          note,
          top_weight: weight,
          top_reps: reps,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,routine_exercise_id,for_date'
        }
      )
      setTopWeightState(weight)
      setTopRepsState(reps)
      setSavingTop(false)
    },
    [routineExerciseId, forDate, note]
  )

  return {
    note,
    setNote: setNoteState,
    saveNote,
    topWeight,
    setTopWeight: setTopWeightState,
    topReps,
    setTopReps: setTopRepsState,
    saveTopSet,
    loading,
    saving,
    savingTop
  }
}
