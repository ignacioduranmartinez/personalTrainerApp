import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveRoutine } from '../hooks/useRoutines'
import { useNextDayIndex, logWorkoutToday } from '../hooks/useWorkoutLog'
import { getLinearDays, getDayDisplayLabel } from '../lib/routineUtils'
import { ExerciseCard } from '../components/ExerciseCard'
import { DayHistory } from '../components/DayHistory'

const today = new Date().toISOString().slice(0, 10)

export default function RoutineReview() {
  const navigate = useNavigate()
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [logging, setLogging] = useState(false)
  const [refetchKey, setRefetchKey] = useState(0)

  const { activeRoutine, loading: routineLoading, error } = useActiveRoutine(today)
  const linearDays = activeRoutine ? getLinearDays(activeRoutine) : []
  const { loading: logLoading } = useNextDayIndex(
    activeRoutine?.id ?? null,
    linearDays.length,
    refetchKey
  )

  const selectedDay = selectedDayIndex != null ? linearDays[selectedDayIndex] ?? null : null

  async function handleDoThisToday(dayIndex: number) {
    if (!activeRoutine) return
    setLogging(true)
    const { error: err } = await logWorkoutToday(activeRoutine.id!, dayIndex)
    setLogging(false)
    if (!err) {
      setRefetchKey((k) => k + 1)
      navigate('/')
    }
  }

  if (routineLoading || logLoading) {
    return <div className="py-8 text-slate-400">Cargando...</div>
  }
  if (error) return <div className="py-8 text-red-400">Error: {error}</div>
  if (!activeRoutine) {
    return (
      <div className="py-8">
        <p className="text-slate-400">No hay rutina activa. Asigna una en Rutinas.</p>
      </div>
    )
  }
  if (linearDays.length === 0) {
    return <div className="py-8 text-slate-400">Esta rutina no tiene días.</div>
  }

  return (
    <div className="py-4">
      <h1 className="text-xl font-semibold text-white mb-2">{activeRoutine.name}</h1>
      <p className="text-slate-500 text-sm mb-4">Revisar cualquier día de la rutina</p>

      {selectedDayIndex == null ? (
        <ul className="space-y-2">
          {linearDays.map((day, idx) => (
            <li key={idx}>
              <button
                type="button"
                onClick={() => setSelectedDayIndex(idx)}
                className="w-full text-left min-h-[52px] px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 active:bg-slate-700 text-white font-medium touch-manipulation"
              >
                {getDayDisplayLabel(idx)}
                {day.exercises.length > 0 && (
                  <span className="text-slate-500 text-sm ml-2">
                    ({day.exercises.length} ejercicios)
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => setSelectedDayIndex(null)}
            className="min-h-[44px] py-2 text-sky-400 text-sm mb-4 hover:underline touch-manipulation"
          >
            ← Volver a la lista de días
          </button>
          {selectedDay && (
            <>
              <h2 className="text-lg font-semibold text-white mb-4">{getDayDisplayLabel(selectedDayIndex ?? 0)}</h2>
              <button
                type="button"
                onClick={() => handleDoThisToday(selectedDayIndex)}
                disabled={logging}
                className="mb-4 min-h-[48px] px-5 py-3 rounded-xl bg-sky-600 text-white text-base font-medium hover:bg-sky-500 active:bg-sky-500 disabled:opacity-50 touch-manipulation"
              >
                {logging ? 'Guardando...' : 'Hacer este entreno hoy'}
              </button>
              {selectedDay.exercises.length === 0 ? (
                <p className="text-slate-500 text-sm">Sin ejercicios este día.</p>
              ) : (
                <ul className="space-y-3">
                  {selectedDay.exercises.map((ex) => (
                    <li key={ex.id ?? ex.name}>
                      <ExerciseCard
                        exercise={ex}
                        forDate={today}
                        routineExerciseId={ex.id ?? undefined}
                      />
                    </li>
                  ))}
                </ul>
              )}
              <DayHistory
                routineId={activeRoutine.id ?? null}
                routineDayIndex={selectedDayIndex}
                exercises={selectedDay.exercises}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
