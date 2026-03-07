import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { WorkoutLog, PastSession } from '../types/routine'

/** Último registro de workout_log para una rutina (el de fecha más reciente que esté finalizado, para calcular "próximo día") */
export function useLastWorkoutLog(routineId: string | null, refetchKey?: number) {
  const [lastLog, setLastLog] = useState<WorkoutLog | null>(null)
  const [loading, setLoading] = useState(!!routineId)

  useEffect(() => {
    if (!routineId) {
      setLastLog(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data } = await supabase
        .from('workout_log')
        .select('*')
        .eq('user_id', user.id)
        .eq('routine_id', routineId)
        .not('finished_at', 'is', null)
        .order('for_date', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!cancelled) {
        setLastLog((data as WorkoutLog | null) ?? null)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [routineId, refetchKey])

  return { lastLog, loading }
}

/**
 * Índice del próximo día de la rutina (0-based).
 * Si no hay logs → 0. Si último fue k y hay k+1 días → k+1. Si último fue el último día → 0.
 */
export function useNextDayIndex(routineId: string | null, totalDays: number, refetchKey?: number) {
  const { lastLog, loading } = useLastWorkoutLog(routineId, refetchKey)
  const nextIndex =
    totalDays <= 0
      ? 0
      : !lastLog
        ? 0
        : lastLog.routine_day_index >= totalDays - 1
          ? 0
          : lastLog.routine_day_index + 1
  return { nextDayIndex: nextIndex, lastLog, loading }
}

/** Obtener el registro de workout_log para una fecha concreta */
export function useWorkoutLogForDate(routineId: string | null, forDate: string, refetchKey?: number) {
  const [log, setLog] = useState<WorkoutLog | null>(null)
  const [loading, setLoading] = useState(!!routineId)

  useEffect(() => {
    if (!routineId || !forDate) {
      setLog(null)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data } = await supabase
        .from('workout_log')
        .select('*')
        .eq('user_id', user.id)
        .eq('routine_id', routineId)
        .eq('for_date', forDate)
        .maybeSingle()
      if (!cancelled) {
        setLog((data as WorkoutLog | null) ?? null)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [routineId, forDate, refetchKey])

  return { todayLog: log, loading }
}

/** Empezar este entrenamiento: registra la sesión de hoy (sin finalizar). Las notas por ejercicio se guardan al escribirlas. */
export async function startWorkoutToday(routineId: string, routineDayIndex: number): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const forDate = new Date().toISOString().slice(0, 10)
  const now = new Date().toISOString()
  const row = {
    user_id: user.id,
    routine_id: routineId,
    for_date: forDate,
    routine_day_index: routineDayIndex,
    session_notes: null,
    finished_at: null,
    started_at: now
  }

  const { error: upsertError } = await supabase
    .from('workout_log')
    .upsert(row, { onConflict: 'user_id,routine_id,for_date' })
  if (!upsertError) return { error: null }

  // Si falla el upsert (p. ej. constraint en algunos proyectos), intentar update o insert
  const { data: existing } = await supabase
    .from('workout_log')
    .select('id')
    .eq('user_id', user.id)
    .eq('routine_id', routineId)
    .eq('for_date', forDate)
    .maybeSingle()
  if (existing) {
    const { error: updateErr } = await supabase
      .from('workout_log')
      .update({
        routine_day_index: routineDayIndex,
        session_notes: null,
        finished_at: null,
        started_at: now
      })
      .eq('user_id', user.id)
      .eq('routine_id', routineId)
      .eq('for_date', forDate)
    return { error: updateErr?.message ?? null }
  }
  const { error: insertErr } = await supabase.from('workout_log').insert(row)
  return { error: insertErr?.message ?? null }
}

/** Entrenamiento finalizado: marca la sesión como terminada, guarda notas y duración (desde started_at). */
export async function finishWorkoutToday(routineId: string, sessionNotes?: string): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const forDate = new Date().toISOString().slice(0, 10)
  const now = new Date()

  const { data: row } = await supabase
    .from('workout_log')
    .select('started_at, created_at')
    .eq('user_id', user.id)
    .eq('routine_id', routineId)
    .eq('for_date', forDate)
    .maybeSingle()

  const r = row as { started_at?: string | null; created_at: string } | null
  const startedAt = r?.started_at ?? r?.created_at
  const durationSeconds = startedAt
    ? Math.round((now.getTime() - new Date(startedAt).getTime()) / 1000)
    : null

  const { error } = await supabase
    .from('workout_log')
    .update({
      finished_at: now.toISOString(),
      session_notes: sessionNotes ?? null,
      duration_seconds: durationSeconds
    })
    .eq('user_id', user.id)
    .eq('routine_id', routineId)
    .eq('for_date', forDate)
  return { error: error?.message ?? null }
}

/** @deprecated Usar startWorkoutToday + finishWorkoutToday. Registrar "he hecho hoy el día X" (compatibilidad: marca como finalizado). */
export async function logWorkoutToday(
  routineId: string,
  routineDayIndex: number,
  sessionNotes?: string
): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const forDate = new Date().toISOString().slice(0, 10)
  const { error } = await supabase.from('workout_log').upsert(
    {
      user_id: user.id,
      routine_id: routineId,
      for_date: forDate,
      routine_day_index: routineDayIndex,
      session_notes: sessionNotes ?? null,
      finished_at: new Date().toISOString()
    },
    { onConflict: 'user_id,routine_id,for_date' }
  )
  return { error: error?.message ?? null }
}

/** Histórico de sesiones para un día de la rutina (routine_day_index) */
export function useHistoryForDay(
  routineId: string | null,
  routineDayIndex: number,
  exercises: Array< { id: string | undefined; name: string } >
) {
  const [sessions, setSessions] = useState<PastSession[]>([])
  const [loading, setLoading] = useState(!!routineId)
  const ids = exercises.map((e) => e.id).filter((id): id is string => !!id)

  const load = useCallback(async () => {
    if (!routineId || routineDayIndex < 0) {
      setSessions([])
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSessions([])
      setLoading(false)
      return
    }
    const { data: logs, error: logErr } = await supabase
      .from('workout_log')
      .select('for_date, session_notes, duration_seconds')
      .eq('user_id', user.id)
      .eq('routine_id', routineId)
      .eq('routine_day_index', routineDayIndex)
      .not('finished_at', 'is', null)
      .order('for_date', { ascending: false })

    if (logErr || !logs || logs.length === 0) {
      setSessions([])
      setLoading(false)
      return
    }

    const dates = (logs as { for_date: string; session_notes: string | null; duration_seconds: number | null }[]).map((r) => r.for_date)
    const notesByDate = new Map<string, Map<string, string | null>>()
    if (ids.length > 0) {
      const { data: notes } = await supabase
        .from('exercise_notes')
        .select('routine_exercise_id, for_date, note')
        .eq('user_id', user.id)
        .in('for_date', dates)
        .in('routine_exercise_id', ids)
      for (const n of notes || []) {
        const row = n as { routine_exercise_id: string; for_date: string; note: string | null }
        if (!notesByDate.has(row.for_date)) notesByDate.set(row.for_date, new Map())
        notesByDate.get(row.for_date)!.set(row.routine_exercise_id, row.note)
      }
    }

    const nameById = new Map<string, string>()
    exercises.forEach((e) => { if (e.id) nameById.set(e.id, e.name) })

    const past: PastSession[] = (logs as { for_date: string; session_notes: string | null; duration_seconds: number | null }[]).map((row) => ({
      for_date: row.for_date,
      session_notes: row.session_notes,
      duration_seconds: row.duration_seconds ?? null,
      exerciseNotes: exercises.map((ex) => ({
        exerciseName: ex.name,
        note: ex.id ? notesByDate.get(row.for_date)?.get(ex.id) ?? null : null
      }))
    }))
    setSessions(past)
    setLoading(false)
  }, [routineId, routineDayIndex, ids.join(',')])

  useEffect(() => {
    load()
  }, [load])

  return { sessions, loading, refetch: load }
}

/** Lista de workout_log en un rango de fechas (para calendario). refetchKey: incrementar para recargar. */
export function useWorkoutLogsInRange(
  routineId: string | null,
  startDate: string,
  endDate: string,
  refetchKey?: number
) {
  const [entries, setEntries] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(!!routineId)

  useEffect(() => {
    if (!routineId) {
      setEntries([])
      setLoading(false)
      return
    }
    let cancelled = false
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data } = await supabase
        .from('workout_log')
        .select('*')
        .eq('user_id', user.id)
        .eq('routine_id', routineId)
        .gte('for_date', startDate)
        .lte('for_date', endDate)
        .order('for_date', { ascending: true })
      if (!cancelled) {
        setEntries((data as WorkoutLog[]) || [])
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [routineId, startDate, endDate, refetchKey])

  return { entries, loading }
}

/** Registrar entreno en una fecha concreta (para calendario / corrección). Marca como finalizado para que aparezca en el calendario. */
export async function logWorkoutOnDate(
  routineId: string,
  forDate: string,
  routineDayIndex: number,
  sessionNotes?: string
): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const { error } = await supabase.from('workout_log').upsert(
    {
      user_id: user.id,
      routine_id: routineId,
      for_date: forDate,
      routine_day_index: routineDayIndex,
      session_notes: sessionNotes ?? null,
      finished_at: new Date().toISOString()
    },
    { onConflict: 'user_id,routine_id,for_date' }
  )
  return { error: error?.message ?? null }
}

/** Marcar como finalizado un entreno ya registrado en una fecha (para sesiones que quedaron "sin finalizar"). */
export async function finishWorkoutOnDate(
  routineId: string,
  forDate: string
): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: row } = await supabase
    .from('workout_log')
    .select('started_at, created_at')
    .eq('user_id', user.id)
    .eq('routine_id', routineId)
    .eq('for_date', forDate)
    .maybeSingle()

  const r = row as { started_at?: string | null; created_at: string } | null
  const startedAt = r?.started_at ?? r?.created_at
  const now = new Date()
  const durationSeconds = startedAt
    ? Math.round((now.getTime() - new Date(startedAt).getTime()) / 1000)
    : null

  const { error } = await supabase
    .from('workout_log')
    .update({
      finished_at: now.toISOString(),
      duration_seconds: durationSeconds
    })
    .eq('user_id', user.id)
    .eq('routine_id', routineId)
    .eq('for_date', forDate)
  return { error: error?.message ?? null }
}

/** Borra todo el historial de entrenamientos y notas del usuario (para limpiar datos de prueba). Las rutinas no se tocan. */
export async function deleteAllWorkoutHistory(): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  const { error: errLog } = await supabase
    .from('workout_log')
    .delete()
    .eq('user_id', user.id)
  if (errLog) return { error: errLog.message }
  const { error: errNotes } = await supabase
    .from('exercise_notes')
    .delete()
    .eq('user_id', user.id)
  return { error: errNotes?.message ?? null }
}
