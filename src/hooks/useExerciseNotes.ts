import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useExerciseNotes(routineExerciseId: string | null, forDate: string) {
  const [note, setNoteState] = useState('')
  const [loading, setLoading] = useState(!!routineExerciseId)
  const [saving, setSaving] = useState(false)

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
        .select('note')
        .eq('user_id', user.id)
        .eq('routine_exercise_id', routineExerciseId)
        .eq('for_date', forDate)
        .maybeSingle()
      if (!cancelled) setNoteState((data?.note as string) || '')
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
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,routine_exercise_id,for_date'
        }
      )
      setNoteState(text)
      setSaving(false)
    },
    [routineExerciseId, forDate]
  )

  return { note, setNote: setNoteState, saveNote, loading, saving }
}
