import { useState, useEffect } from 'react'
import { useActiveRoutine } from '../hooks/useRoutines'
import { useNextDayIndex, useWorkoutLogForDate, startWorkoutToday, finishWorkoutToday } from '../hooks/useWorkoutLog'
import { getLinearDays, getDayDisplayLabel } from '../lib/routineUtils'
import { ExerciseCard } from '../components/ExerciseCard'
import { DayHistory } from '../components/DayHistory'

export default function Today() {
  const today = new Date().toISOString().slice(0, 10)
  const [refetchKey, setRefetchKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [sessionNotes, setSessionNotes] = useState('')
  const [showFinishForm, setShowFinishForm] = useState(false)
  /** Optimista: mostrar "Finalizar" en cuanto se pulse "Empezar" sin esperar al refetch */
  const [sessionJustStarted, setSessionJustStarted] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  const { activeRoutine, loading: routineLoading, error } = useActiveRoutine(today)
  const linearDays = activeRoutine ? getLinearDays(activeRoutine) : []
  const { nextDayIndex, loading: logLoading } = useNextDayIndex(
    activeRoutine?.id ?? null,
    linearDays.length,
    refetchKey
  )
  const { todayLog, loading: todayLogLoading } = useWorkoutLogForDate(
    activeRoutine?.id ?? null,
    today,
    refetchKey
  )

  const inProgress =
    (todayLog != null && todayLog.finished_at == null) || sessionJustStarted

  useEffect(() => {
    if (todayLog != null) {
      setSessionJustStarted(false)
      setStartError(null)
    }
  }, [todayLog])

  const displayDayIndex =
    inProgress ? (todayLog?.routine_day_index ?? nextDayIndex) : nextDayIndex
  const daySchedule = linearDays[displayDayIndex] ?? null
  const loading = routineLoading || logLoading || todayLogLoading

  async function handleStart() {
    if (!activeRoutine?.id) return
    setStartError(null)
    setSaving(true)
    const { error: err } = await startWorkoutToday(activeRoutine.id, nextDayIndex)
    setSaving(false)
    if (err) {
      setStartError(err)
      return
    }
    setSessionJustStarted(true)
    setRefetchKey((k) => k + 1)
  }

  async function handleFinish(notes?: string) {
    if (!activeRoutine) return
    setSaving(true)
    const { error: err } = await finishWorkoutToday(
      activeRoutine.id!,
      notes ?? (sessionNotes || undefined)
    )
    setSaving(false)
    if (!err) {
      setShowFinishForm(false)
      setSessionNotes('')
      setRefetchKey((k) => k + 1)
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-slate-400">
        Cargando rutina...
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8 text-center text-red-400">
        Error: {error}
      </div>
    )
  }

  if (!activeRoutine) {
    return (
      <div className="py-8">
        <p className="text-slate-400 text-center mb-4">No hay ninguna rutina.</p>
        <p className="text-slate-500 text-sm text-center">
          Crea o importa una en <strong>Rutinas</strong> y asígnala por fechas si quieres que aparezca aquí.
        </p>
      </div>
    )
  }

  if (linearDays.length === 0) {
    return (
      <div className="py-8">
        <h2 className="text-lg font-semibold text-white mb-1">{activeRoutine.name}</h2>
        <p className="text-slate-400 text-sm">Esta rutina no tiene días definidos.</p>
      </div>
    )
  }

  // Si no hay día o no hay ejercicios y no estamos en curso, mostrar solo "Empezar"
  if ((!daySchedule || daySchedule.exercises.length === 0) && !inProgress) {
    return (
      <div className="py-8">
        <h2 className="text-lg font-semibold text-white mb-1">{activeRoutine.name}</h2>
        <p className="text-slate-500 text-sm mb-4">Próximo entreno: {getDayDisplayLabel(displayDayIndex)}</p>
        <p className="text-slate-400 text-sm">No hay ejercicios en este día.</p>
        <button
          type="button"
          onClick={handleStart}
          disabled={saving}
          className="mt-4 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Empezar este entrenamiento'}
        </button>
        {startError && (
          <p className="mt-2 text-red-400 text-sm">Error al empezar: {startError}</p>
        )}
      </div>
    )
  }

  const exercises = daySchedule?.exercises ?? []
  const dayLabel = getDayDisplayLabel(displayDayIndex)

  return (
    <div className="py-4">
      <h2 className="text-lg font-semibold text-white mb-1">{activeRoutine.name}</h2>
      <p className="text-slate-500 text-sm mb-4">
        {inProgress ? (
          <>Entrenamiento en curso: <strong>{dayLabel}</strong></>
        ) : (
          <>Tu próximo entreno: <strong>{dayLabel}</strong></>
        )}
      </p>

      {inProgress ? (
        !showFinishForm ? (
          <button
            type="button"
            onClick={() => setShowFinishForm(true)}
            className="mb-4 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500"
          >
            Entrenamiento finalizado
          </button>
        ) : (
          <div className="mb-4 p-4 rounded-xl bg-slate-800 border border-slate-700">
            <label className="block text-sm text-slate-400 mb-2">Notas de la sesión (opcional)</label>
            <textarea
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Cómo fue el entreno..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm mb-3"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleFinish()}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-500 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar y finalizar'}
              </button>
              <button
                type="button"
                onClick={() => { setShowFinishForm(false); setSessionNotes('') }}
                className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        )
      ) : (
        <>
          <button
            type="button"
            onClick={handleStart}
            disabled={saving}
            className="mb-4 px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Empezar este entrenamiento'}
          </button>
          {startError && (
            <p className="mb-4 text-red-400 text-sm">Error al empezar: {startError}</p>
          )}
        </>
      )}

      <ul className="space-y-3">
        {exercises.length === 0 ? (
          <p className="text-slate-500 text-sm">No hay ejercicios en este día.</p>
        ) : (
          exercises.map((ex) => (
            <li key={ex.id ?? ex.name}>
              <ExerciseCard exercise={ex} forDate={today} routineExerciseId={ex.id ?? undefined} />
            </li>
          ))
        )}
      </ul>

      <DayHistory
        routineId={activeRoutine.id ?? null}
        routineDayIndex={displayDayIndex}
        exercises={exercises}
      />
    </div>
  )
}
