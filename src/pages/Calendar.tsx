import { useState, useMemo } from 'react'
import { useActiveRoutine } from '../hooks/useRoutines'
import { useWorkoutLogsInRange, logWorkoutOnDate } from '../hooks/useWorkoutLog'
import { getLinearDays, getDayDisplayLabel } from '../lib/routineUtils'
import { formatDuration } from '../lib/restTimer'
import { useSessionExerciseNotes } from '../hooks/useSessionExerciseNotes'

function getMonthStartEnd(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  }
}

function getCalendarDays(year: number, month: number): (number | null)[] {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  const startPad = (first.getDay() + 6) % 7
  const days: (number | null)[] = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(d)
  return days
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function Calendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loggingDayIndex, setLoggingDayIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const { activeRoutine, loading: routineLoading } = useActiveRoutine(
    new Date(year, month - 1, 1).toISOString().slice(0, 10)
  )
  const { start, end } = useMemo(
    () => getMonthStartEnd(year, month),
    [year, month]
  )
  const { entries, loading: logLoading } = useWorkoutLogsInRange(
    activeRoutine?.id ?? null,
    start,
    end
  )
  const linearDays = activeRoutine ? getLinearDays(activeRoutine) : []
  const entriesByDate = useMemo(() => {
    const m = new Map<string, { routine_day_index: number; session_notes: string | null; duration_seconds: number | null }>()
    for (const e of entries) {
      if (e.finished_at != null) {
        m.set(e.for_date, {
          routine_day_index: e.routine_day_index,
          session_notes: e.session_notes,
          duration_seconds: e.duration_seconds ?? null
        })
      }
    }
    return m
  }, [entries])

  const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month])
  const loading = routineLoading || logLoading

  function prevMonth() {
    if (month === 1) {
      setMonth(12)
      setYear((y) => y - 1)
    } else setMonth((m) => m - 1)
  }
  function nextMonth() {
    if (month === 12) {
      setMonth(1)
      setYear((y) => y + 1)
    } else setMonth((m) => m + 1)
  }

  const selectedEntry = selectedDate ? entriesByDate.get(selectedDate) : null
  const selectedLabel =
    selectedEntry != null ? getDayDisplayLabel(selectedEntry.routine_day_index) : null
  const selectedExercises =
    selectedEntry != null && linearDays[selectedEntry.routine_day_index]
      ? linearDays[selectedEntry.routine_day_index].exercises
      : []

  const { notes: sessionExerciseNotes, loading: sessionNotesLoading } = useSessionExerciseNotes(
    activeRoutine?.id ?? null,
    selectedDate,
    selectedExercises.map((e) => ({ id: e.id, name: e.name }))
  )

  async function handleLogForDate() {
    if (!activeRoutine || selectedDate == null || loggingDayIndex == null) return
    setSaving(true)
    const { error } = await logWorkoutOnDate(
      activeRoutine.id!,
      selectedDate,
      loggingDayIndex
    )
    setSaving(false)
    if (!error) {
      setSelectedDate(null)
      setLoggingDayIndex(null)
    }
  }

  if (loading && entries.length === 0) {
    return <div className="py-8 text-slate-400">Cargando...</div>
  }

  return (
    <div className="py-4">
      <h1 className="text-xl font-semibold text-white mb-4">Calendario</h1>
      {!activeRoutine ? (
        <p className="text-slate-400 text-sm">No hay rutina activa. Asígnala en Rutinas.</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800"
            >
              ←
            </button>
            <span className="text-white font-medium">
              {MONTHS[month - 1]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs text-slate-500">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((d, i) => {
              if (d == null) return <div key={i} />
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
              const entry = entriesByDate.get(dateStr)
              const label = entry != null ? getDayDisplayLabel(entry.routine_day_index) : null
              const isSelected = selectedDate === dateStr
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[44px] rounded-lg text-sm ${
                    isSelected
                      ? 'bg-sky-600 text-white'
                      : entry
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {d}
                  {label && <span className="block text-xs truncate">{label}</span>}
                </button>
              )
            })}
          </div>

          {selectedDate && (
            <div className="mt-6 p-4 rounded-xl bg-slate-800 border border-slate-700">
              <p className="text-white font-medium mb-2">
                {new Date(selectedDate + 'Z').toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              {selectedEntry != null ? (
                <>
                  <p className="text-slate-400 text-sm">
                    Entreno: <strong>{selectedLabel}</strong>
                  </p>
                  {selectedEntry.duration_seconds != null && selectedEntry.duration_seconds > 0 && (
                    <p className="text-amber-400/90 text-sm mt-1">
                      Duración: {formatDuration(selectedEntry.duration_seconds)}
                    </p>
                  )}
                  {selectedEntry.session_notes && (
                    <p className="text-slate-300 text-sm mt-2">{selectedEntry.session_notes}</p>
                  )}
                  {selectedExercises.length > 0 && !sessionNotesLoading && (
                    <div className="mt-3">
                      <p className="text-slate-400 text-xs mb-1">Notas por ejercicio:</p>
                      <ul className="space-y-1 text-sm">
                        {sessionExerciseNotes.some((n) => n.note) ? (
                          sessionExerciseNotes
                            .filter((n) => n.note)
                            .map((n) => (
                              <li key={n.exerciseName} className="text-slate-300">
                                <span className="font-medium">{n.exerciseName}:</span>{' '}
                                {n.note}
                              </li>
                            ))
                        ) : (
                          <li className="text-slate-500">Sin notas por ejercicio.</li>
                        )}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-slate-500 text-sm mb-3">Sin entreno registrado.</p>
              )}
              {loggingDayIndex == null ? (
                <div className="mt-3">
                  <p className="text-slate-400 text-xs mb-2">Registrar entreno en esta fecha:</p>
                  <div className="flex flex-wrap gap-2">
                    {linearDays.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLoggingDayIndex(idx)}
                        className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-sm hover:bg-slate-600"
                      >
                        {getDayDisplayLabel(idx)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-slate-400 text-sm">
                    Registrar como: <strong>{loggingDayIndex != null ? getDayDisplayLabel(loggingDayIndex) : ''}</strong>
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handleLogForDate}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm disabled:opacity-50"
                    >
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoggingDayIndex(null)}
                      className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
