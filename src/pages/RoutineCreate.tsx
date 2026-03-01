import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveRoutine } from '../lib/routineDb'
import type { RoutineImportJSON, Exercise, DaySchedule, WeekSchedule } from '../types/routine'

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function emptyDay(label: string): DaySchedule {
  return { label, exercises: [] }
}

function emptyWeek(): WeekSchedule {
  return { days: DAY_NAMES.map(emptyDay) }
}

export default function RoutineCreate() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [weeks, setWeeks] = useState<WeekSchedule[]>([emptyWeek()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addWeek() {
    setWeeks((w) => [...w, emptyWeek()])
  }

  function addExercise(weekIdx: number, dayIdx: number) {
    setWeeks((w) => {
      const next = w.map((week, wi) => {
        if (wi !== weekIdx) return week
        return {
          days: week.days.map((day, di) => {
            if (di !== dayIdx) return day
            return {
              ...day,
              exercises: [...day.exercises, { name: '', sets: 3, reps: '10' }]
            }
          })
        }
      })
      return next
    })
  }

  function updateExercise(
    weekIdx: number,
    dayIdx: number,
    exIdx: number,
    field: keyof Exercise,
    value: string | number | undefined
  ) {
    setWeeks((w) =>
      w.map((week, wi) => {
        if (wi !== weekIdx) return week
        return {
          days: week.days.map((day, di) => {
            if (di !== dayIdx) return day
            return {
              ...day,
              exercises: day.exercises.map((ex, ei) =>
                ei !== exIdx ? ex : { ...ex, [field]: value }
              )
            }
          })
        }
      })
    )
  }

  function removeExercise(weekIdx: number, dayIdx: number, exIdx: number) {
    setWeeks((w) => {
      const next = w.map((week, wi) => {
        if (wi !== weekIdx) return week
        return {
          days: week.days.map((day, di) => {
            if (di !== dayIdx) return day
            return {
              ...day,
              exercises: day.exercises.filter((_, i) => i !== exIdx)
            }
          })
        }
      })
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Nombre obligatorio.')
      return
    }
    const payload: RoutineImportJSON = {
      name: name.trim(),
      weeks: weeks.map((week) => ({
        days: week.days.map((d) => ({
          label: d.label,
          exercises: d.exercises.filter((e) => e.name.trim()).map((e) => ({
            name: e.name.trim(),
            sets: e.sets,
            reps: e.reps,
            intensity: e.intensity,
            notes: e.notes,
            demo: e.demo
          }))
        }))
      }))
    }
    setSaving(true)
    saveRoutine(payload)
      .then((id) => {
        if (id) navigate('/routines')
        else setError('No se pudo guardar.')
      })
      .finally(() => setSaving(false))
  }

  return (
    <div className="py-4">
      <h1 className="text-xl font-semibold text-white mb-4">Nueva rutina</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
            Nombre de la rutina
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white focus:ring-2 focus:ring-sky-500"
            placeholder="Ej. Rutina Marzo"
          />
        </div>

        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="rounded-xl bg-slate-800 border border-slate-700 p-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">Semana {weekIdx + 1}</h3>
            {week.days.map((day, dayIdx) => (
              <div key={dayIdx} className="mb-4 last:mb-0">
                <p className="text-slate-400 text-sm font-medium mb-2">{day.label}</p>
                <ul className="space-y-2">
                  {day.exercises.map((ex, exIdx) => (
                    <li key={exIdx} className="flex flex-wrap items-center gap-2 text-sm">
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) =>
                          updateExercise(weekIdx, dayIdx, exIdx, 'name', e.target.value)
                        }
                        placeholder="Nombre ejercicio"
                        className="flex-1 min-w-[120px] px-3 py-1.5 rounded bg-slate-900 border border-slate-600 text-white"
                      />
                      <input
                        type="number"
                        min={1}
                        value={ex.sets ?? ''}
                        onChange={(e) =>
                          updateExercise(
                            weekIdx,
                            dayIdx,
                            exIdx,
                            'sets',
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        placeholder="Series"
                        className="w-16 px-2 py-1.5 rounded bg-slate-900 border border-slate-600 text-white"
                      />
                      <input
                        type="text"
                        value={ex.reps ?? ''}
                        onChange={(e) =>
                          updateExercise(weekIdx, dayIdx, exIdx, 'reps', e.target.value)
                        }
                        placeholder="Reps"
                        className="w-16 px-2 py-1.5 rounded bg-slate-900 border border-slate-600 text-white"
                      />
                      <input
                        type="text"
                        value={ex.intensity ?? ''}
                        onChange={(e) =>
                          updateExercise(weekIdx, dayIdx, exIdx, 'intensity', e.target.value)
                        }
                        placeholder="% RM"
                        className="w-20 px-2 py-1.5 rounded bg-slate-900 border border-slate-600 text-white"
                        title="% RM / Intensidad"
                      />
                      <button
                        type="button"
                        onClick={() => removeExercise(weekIdx, dayIdx, exIdx)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={() => addExercise(weekIdx, dayIdx)}
                      className="text-sky-400 text-sm hover:underline"
                    >
                      + Añadir ejercicio
                    </button>
                  </li>
                </ul>
              </div>
            ))}
          </div>
        ))}

        <button
          type="button"
          onClick={addWeek}
          className="text-sky-400 text-sm hover:underline"
        >
          + Añadir semana
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-500 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Crear rutina'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/routines')}
            className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
