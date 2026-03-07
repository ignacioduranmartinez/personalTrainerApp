import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Routine, WeekSchedule, DaySchedule, Exercise } from '../types/routine'

interface RoutineRow {
  id: string
  name: string
  start_date: string | null
  end_date: string | null
  created_at: string
}

interface DayRow {
  id: string
  routine_id: string
  week_index: number
  day_index: number
  label: string
}

interface ExerciseRow {
  id: string
  routine_day_id: string
  sort_order: number
  name: string
  sets: number | null
  reps: string | null
  intensity: string | null
  rest_seconds: number | null
  notes: string | null
  demo_image_url: string | null
  demo_video_url: string | null
}

function buildRoutineFromRows(
  routine: RoutineRow,
  days: DayRow[],
  exercises: ExerciseRow[]
): Routine {
  const dayMap = new Map<string, { weekIndex: number; dayIndex: number; label: string }>()
  days.forEach((d) => dayMap.set(d.id, { weekIndex: d.week_index, dayIndex: d.day_index, label: d.label }))

  const exercisesByDay = new Map<string, ExerciseRow[]>()
  exercises.forEach((ex) => {
    const list = exercisesByDay.get(ex.routine_day_id) || []
    list.push(ex)
    exercisesByDay.set(ex.routine_day_id, list.sort((a, b) => a.sort_order - b.sort_order))
  })

  const weekMap = new Map<number, Map<number, DaySchedule>>()
  days.forEach((d) => {
    if (!weekMap.has(d.week_index)) weekMap.set(d.week_index, new Map())
    const dayMapInner = weekMap.get(d.week_index)!
    const     exList = (exercisesByDay.get(d.id) || []).map(
      (e): Exercise => ({
        id: e.id,
        name: e.name,
        sets: e.sets ?? undefined,
        reps: e.reps ?? undefined,
        intensity: e.intensity ?? undefined,
        restSeconds: e.rest_seconds ?? undefined,
        notes: e.notes ?? undefined,
        demo:
          e.demo_image_url || e.demo_video_url
            ? { imageUrl: e.demo_image_url ?? undefined, videoUrl: e.demo_video_url ?? undefined }
            : undefined
      })
    )
    dayMapInner.set(d.day_index, { id: d.id, label: d.label, exercises: exList })
  })

  const weeks: WeekSchedule[] = []
  const weekIndices = Array.from(weekMap.keys()).sort((a, b) => a - b)
  weekIndices.forEach((wi) => {
    const dayMapInner = weekMap.get(wi)!
    const dayIndices = Array.from(dayMapInner.keys()).sort((a, b) => a - b)
    weeks.push({
      days: dayIndices.map((di) => dayMapInner.get(di)!)
    })
  })

  return {
    id: routine.id,
    name: routine.name,
    weeks,
    startDate: routine.start_date ?? undefined,
    endDate: routine.end_date ?? undefined,
    createdAt: routine.created_at
  }
}

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const { data: routinesData, error: rErr } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (rErr) {
      setError(rErr.message)
      setLoading(false)
      return
    }
    const routineRows = (routinesData || []) as RoutineRow[]
    if (routineRows.length === 0) {
      setRoutines([])
      setLoading(false)
      return
    }
    const routineIds = routineRows.map((r) => r.id)
    const { data: daysData, error: dErr } = await supabase
      .from('routine_days')
      .select('*')
      .in('routine_id', routineIds)
    if (dErr) {
      setError(dErr.message)
      setLoading(false)
      return
    }
    const days = (daysData || []) as DayRow[]
    const dayIds = days.map((d) => d.id)
    const { data: exData, error: eErr } = await supabase
      .from('routine_exercises')
      .select('*')
      .in('routine_day_id', dayIds)
    if (eErr) {
      setError(eErr.message)
      setLoading(false)
      return
    }
    const exerciseRows = (exData || []) as ExerciseRow[]
    const built = routineRows.map((r) => {
      const rDays = days.filter((d) => d.routine_id === r.id)
      const rEx = exerciseRows.filter((e) => rDays.some((d) => d.id === e.routine_day_id))
      return buildRoutineFromRows(r, rDays, rEx)
    })
    setRoutines(built)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { routines, loading, error, refetch: load }
}

/** Obtiene la rutina activa para una fecha (start_date <= date <= end_date) */
export function useActiveRoutine(forDate: string) {
  const { routines, loading, error, refetch } = useRoutines()
  const active =
    routines.find((r) => {
      const start = r.startDate ? new Date(r.startDate) : null
      const end = r.endDate ? new Date(r.endDate) : null
      const d = new Date(forDate)
      if (start && d < start) return false
      if (end && d > end) return false
      return true
    }) ?? routines[0] ?? null
  return { activeRoutine: active, allRoutines: routines, loading, error, refetch }
}
