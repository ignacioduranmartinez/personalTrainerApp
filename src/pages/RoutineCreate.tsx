import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveRoutine } from '../lib/routineDb'
import type { RoutineImportJSON, Exercise, DaySchedule, WeekSchedule } from '../types/routine'
import { listLibraryExercises, type LibraryExercise } from '../lib/exerciseLibraryDb'

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
  const [showPicker, setShowPicker] = useState<null | { weekIdx: number; dayIdx: number }>(null)
  const [library, setLibrary] = useState<LibraryExercise[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState<string | null>(null)
  const [libraryQuery, setLibraryQuery] = useState('')

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

  async function ensureLibraryLoaded() {
    if (libraryLoading) return
    if (library.length > 0) return
    setLibraryLoading(true)
    const { data, error } = await listLibraryExercises()
    setLibraryError(error)
    setLibrary(data)
    setLibraryLoading(false)
  }

  function fold(text: string) {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  }

  const filteredLibrary = useMemo(() => {
    const q = fold(libraryQuery.trim())
    if (!q) return library
    return library.filter((i) => {
      return (
        fold(i.name).includes(q) ||
        fold(i.category ?? '').includes(q) ||
        fold(i.typology ?? '').includes(q) ||
        fold(i.equipment ?? '').includes(q)
      )
    })
  }, [library, libraryQuery])

  function addFromLibrary(weekIdx: number, dayIdx: number, item: LibraryExercise) {
    setWeeks((w) => {
      const next = w.map((week, wi) => {
        if (wi !== weekIdx) return week
        return {
          days: week.days.map((day, di) => {
            if (di !== dayIdx) return day
            const ex: Exercise = {
              name: item.name,
              sets: 3,
              reps: '10',
              notes: item.notes ?? undefined,
              demo:
                item.demo_image_url || item.demo_video_url
                  ? { imageUrl: item.demo_image_url ?? undefined, videoUrl: item.demo_video_url ?? undefined }
                  : undefined
            }
            return { ...day, exercises: [...day.exercises, ex] }
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
                    <button
                      type="button"
                      onClick={async () => {
                        await ensureLibraryLoaded()
                        setLibraryQuery('')
                        setShowPicker({ weekIdx, dayIdx })
                      }}
                      className="ml-4 text-slate-400 text-sm hover:text-white hover:underline"
                    >
                      + Añadir desde biblioteca
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

      {showPicker && (
        <div className="fixed inset-0 z-20 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <p className="text-white font-medium">Añadir ejercicio desde biblioteca</p>
              <button
                type="button"
                onClick={() => setShowPicker(null)}
                className="text-slate-400 hover:text-white"
              >
                Cerrar
              </button>
            </div>
            <div className="p-4">
              {libraryError && (
                <p className="text-red-400 text-sm mb-3">Error: {libraryError}</p>
              )}
              <input
                value={libraryQuery}
                onChange={(e) => setLibraryQuery(e.target.value)}
                placeholder="Buscar por nombre, categoría, tipología o material..."
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm placeholder-slate-500 mb-3"
              />
              {libraryLoading ? (
                <p className="text-slate-400 text-sm">Cargando biblioteca...</p>
              ) : filteredLibrary.length === 0 ? (
                <p className="text-slate-500 text-sm">No hay resultados.</p>
              ) : (
                <ul className="max-h-[50vh] overflow-auto space-y-2">
                  {filteredLibrary.map((i) => (
                    <li key={i.id}>
                      <button
                        type="button"
                        onClick={() => {
                          addFromLibrary(showPicker.weekIdx, showPicker.dayIdx, i)
                          setShowPicker(null)
                        }}
                        className="w-full text-left rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 p-3"
                      >
                        <p className="text-white font-medium">{i.name}</p>
                        {(i.category || i.typology || i.equipment) && (
                          <p className="text-slate-500 text-sm mt-0.5">
                            {[i.category, i.typology, i.equipment].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-slate-500 text-xs mt-3">
                Si no encuentras un ejercicio, añádelo en Gestionar → Biblioteca de ejercicios.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
