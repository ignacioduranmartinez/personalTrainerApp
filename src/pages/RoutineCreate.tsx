import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveRoutine } from '../lib/routineDb'
import type { RoutineImportJSON } from '../types/routine'
import { listLibraryExercises, MUSCLE_OPTIONS, type LibraryExercise } from '../lib/exerciseLibraryDb'

const NUM_DAYS_OPTIONS = [3, 4, 5, 6, 7] as const

interface DayExercise {
  libraryId: string
  name: string
  demoImageUrl: string | null
  demoVideoUrl: string | null
  sets: number
  reps: string
  notes: string
}

interface DayPlan {
  label: string
  exercises: DayExercise[]
}

function fold(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export default function RoutineCreate() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [name, setName] = useState('')
  const [numDays, setNumDays] = useState<number>(4)
  const [dayLabels, setDayLabels] = useState<string[]>(['Día 1', 'Día 2', 'Día 3', 'Día 4'])
  const [days, setDays] = useState<DayPlan[]>([
    { label: 'Día 1', exercises: [] },
    { label: 'Día 2', exercises: [] },
    { label: 'Día 3', exercises: [] },
    { label: 'Día 4', exercises: [] }
  ])
  const [library, setLibrary] = useState<LibraryExercise[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryQuery, setLibraryQuery] = useState('')
  const [libraryMuscleFilter, setLibraryMuscleFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dragOverDayIdx, setDragOverDayIdx] = useState<number | null>(null)
  const [addToDayFor, setAddToDayFor] = useState<LibraryExercise | null>(null)

  useEffect(() => {
    if (numDays >= 3 && numDays <= 7) {
      setDayLabels((prev) => {
        const next = [...prev]
        while (next.length < numDays) next.push(`Día ${next.length + 1}`)
        return next.slice(0, numDays)
      })
      setDays((prev) => {
        const next = prev.slice(0, numDays)
        while (next.length < numDays) next.push({ label: `Día ${next.length + 1}`, exercises: [] })
        return next.slice(0, numDays)
      })
    }
  }, [numDays])

  useEffect(() => {
    if (dayLabels.length !== days.length) return
    setDays((d) => d.map((day, i) => ({ ...day, label: dayLabels[i] ?? day.label })))
  }, [dayLabels])

  useEffect(() => {
    if (step < 3) return
    setLibraryLoading(true)
    listLibraryExercises().then(({ data }) => {
      setLibrary(data)
      setLibraryLoading(false)
    })
  }, [step])

  const filteredLibrary = useMemo(() => {
    let list = library
    if (libraryMuscleFilter) list = list.filter((i) => (i.muscle ?? '') === libraryMuscleFilter)
    const q = fold(libraryQuery.trim())
    if (!q) return list
    return list.filter(
      (i) =>
        fold(i.name).includes(q) ||
        fold(i.muscle ?? '').includes(q) ||
        fold(i.movement_pattern ?? '').includes(q)
    )
  }, [library, libraryQuery, libraryMuscleFilter])

  function addExerciseToDay(dayIdx: number, lib: LibraryExercise) {
    const ex: DayExercise = {
      libraryId: lib.id,
      name: lib.name,
      demoImageUrl: lib.demo_image_url ?? null,
      demoVideoUrl: lib.demo_video_url ?? null,
      sets: 3,
      reps: '10',
      notes: lib.notes ?? ''
    }
    setDays((d) =>
      d.map((day, i) =>
        i === dayIdx ? { ...day, exercises: [...day.exercises, ex] } : day
      )
    )
    setAddToDayFor(null)
  }

  function updateDayExercise(
    dayIdx: number,
    exIdx: number,
    field: keyof DayExercise,
    value: string | number
  ) {
    setDays((d) =>
      d.map((day, i) =>
        i !== dayIdx
          ? day
          : {
              ...day,
              exercises: day.exercises.map((ex, ei) =>
                ei !== exIdx ? ex : { ...ex, [field]: value }
              )
            }
      )
    )
  }

  function removeDayExercise(dayIdx: number, exIdx: number) {
    setDays((d) =>
      d.map((day, i) =>
        i === dayIdx
          ? { ...day, exercises: day.exercises.filter((_, ei) => ei !== exIdx) }
          : day
      )
    )
  }

  function handleDragStart(e: React.DragEvent, lib: LibraryExercise) {
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: lib.id,
      name: lib.name,
      demo_image_url: lib.demo_image_url,
      demo_video_url: lib.demo_video_url,
      notes: lib.notes
    }))
    e.dataTransfer.effectAllowed = 'copy'
  }

  function handleDrop(dayIdx: number, e: React.DragEvent) {
    e.preventDefault()
    setDragOverDayIdx(null)
    try {
      const raw = e.dataTransfer.getData('application/json')
      if (!raw) return
      const lib = JSON.parse(raw) as {
        id: string
        name: string
        demo_image_url?: string | null
        demo_video_url?: string | null
        notes?: string | null
      }
      const ex: DayExercise = {
        libraryId: lib.id,
        name: lib.name,
        demoImageUrl: lib.demo_image_url ?? null,
        demoVideoUrl: lib.demo_video_url ?? null,
        sets: 3,
        reps: '10',
        notes: lib.notes ?? ''
      }
      setDays((d) =>
        d.map((day, i) =>
          i === dayIdx ? { ...day, exercises: [...day.exercises, ex] } : day
        )
      )
    } catch (_) {}
  }

  function handleSubmitStep1(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Escribe un nombre para la rutina.')
      return
    }
    setError('')
    setStep(2)
  }

  function handleSubmitStep2(e: React.FormEvent) {
    e.preventDefault()
    setDays((d) => d.map((day, i) => ({ ...day, label: dayLabels[i] ?? day.label })))
    setError('')
    setStep(3)
  }

  function handleCreateRoutine(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const payload: RoutineImportJSON = {
      name: name.trim(),
      weeks: [
        {
          days: days.map((day) => ({
            label: day.label,
            exercises: day.exercises.map((ex) => ({
              name: ex.name,
              sets: ex.sets,
              reps: ex.reps,
              notes: ex.notes || undefined,
              demo:
                ex.demoImageUrl || ex.demoVideoUrl
                  ? { imageUrl: ex.demoImageUrl ?? undefined, videoUrl: ex.demoVideoUrl ?? undefined }
                  : undefined
            }))
          }))
        }
      ]
    }
    setSaving(true)
    saveRoutine(payload)
      .then((id) => {
        if (id) navigate('/routines')
        else setError('No se pudo guardar la rutina.')
      })
      .finally(() => setSaving(false))
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-white">Nueva rutina</h1>
        <button
          type="button"
          onClick={() => navigate('/routines')}
          className="text-slate-400 hover:text-white text-sm"
        >
          Cancelar
        </button>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-2 mb-6">
        {([1, 2, 3] as const).map((s) => (
          <span
            key={s}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              step === s ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-400'
            }`}
          >
            {s === 1 ? 'Nombre y días' : s === 2 ? 'Nombres de días' : 'Ejercicios'}
          </span>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* Step 1: name + num days */}
      {step === 1 && (
        <form onSubmit={handleSubmitStep1} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
              Nombre de la rutina
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Rutina fuerza 4 días"
              className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white"
            />
          </div>
          <div>
            <label htmlFor="numDays" className="block text-sm font-medium text-slate-300 mb-1">
              Días de entreno por semana
            </label>
            <select
              id="numDays"
              value={numDays}
              onChange={(e) => setNumDays(Number(e.target.value))}
              className="min-h-[48px] px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white"
            >
              {NUM_DAYS_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} días
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="min-h-[48px] px-5 py-3 rounded-xl bg-sky-600 text-white font-medium hover:bg-sky-500 touch-manipulation"
          >
            Siguiente
          </button>
        </form>
      )}

      {/* Step 2: label per day */}
      {step === 2 && (
        <form onSubmit={handleSubmitStep2} className="space-y-4">
          <p className="text-slate-500 text-sm mb-4">
            Asigna un nombre a cada día (ej. &quot;Día A - Pecho&quot;, &quot;Pierna&quot;).
          </p>
          {dayLabels.slice(0, numDays).map((label, i) => (
            <div key={i}>
              <label htmlFor={`day-${i}`} className="block text-xs text-slate-500 mb-1">
                Día {i + 1}
              </label>
              <input
                id={`day-${i}`}
                type="text"
                value={label}
                onChange={(e) => {
                  const next = [...dayLabels]
                  next[i] = e.target.value
                  setDayLabels(next)
                }}
                placeholder={`Día ${i + 1}`}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 text-white"
              />
            </div>
          ))}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="min-h-[48px] px-5 py-3 rounded-xl bg-slate-700 text-slate-200 touch-manipulation"
            >
              Atrás
            </button>
            <button
              type="submit"
              className="min-h-[48px] px-5 py-3 rounded-xl bg-sky-600 text-white font-medium hover:bg-sky-500 touch-manipulation"
            >
              Siguiente
            </button>
          </div>
        </form>
      )}

      {/* Step 3: drag & drop */}
      {step === 3 && (
        <form onSubmit={handleCreateRoutine} className="space-y-6">
          <p className="text-slate-500 text-sm">
            Arrastra ejercicios desde la biblioteca a cada día. Las imágenes y vídeos se usan de la biblioteca.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Library */}
            <div className="lg:col-span-1 rounded-xl bg-slate-800 border border-slate-700 p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Biblioteca</h3>
              <input
                value={libraryQuery}
                onChange={(e) => setLibraryQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm mb-2"
              />
              <select
                value={libraryMuscleFilter}
                onChange={(e) => setLibraryMuscleFilter(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm mb-3"
              >
                <option value="">Todos los músculos</option>
                {MUSCLE_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {libraryLoading ? (
                <p className="text-slate-500 text-sm">Cargando...</p>
              ) : (
                <>
                  <ul className="space-y-1.5 max-h-[60vh] overflow-auto">
                    {filteredLibrary.map((lib) => (
                      <li
                        key={lib.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lib)}
                        onClick={() => setAddToDayFor(lib)}
                        className="cursor-grab active:cursor-grabbing rounded-lg bg-slate-700/80 border border-slate-600 px-3 py-2 text-sm text-white hover:border-slate-500 touch-manipulation"
                      >
                        {lib.name}
                        {(lib.muscle || lib.movement_pattern) && (
                          <span className="block text-xs text-slate-500 truncate">
                            {[lib.muscle, lib.movement_pattern].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {addToDayFor && (
                    <div className="mt-3 p-3 rounded-lg bg-slate-700 border border-slate-600">
                      <p className="text-xs text-slate-400 mb-2">Añadir &quot;{addToDayFor.name}&quot; a:</p>
                      <div className="flex flex-wrap gap-2">
                        {days.map((day, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => addExerciseToDay(i, addToDayFor)}
                            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-600 text-white text-xs font-medium hover:bg-slate-500 touch-manipulation"
                          >
                            {day.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setAddToDayFor(null)}
                          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Day columns */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              {days.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'copy'
                    setDragOverDayIdx(dayIdx)
                  }}
                  onDragLeave={() => setDragOverDayIdx(null)}
                  onDrop={(e) => handleDrop(dayIdx, e)}
                  className={`rounded-xl border-2 border-dashed p-4 min-h-[120px] transition-colors ${
                    dragOverDayIdx === dayIdx
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-slate-600 bg-slate-800/50'
                  }`}
                >
                  <h3 className="text-sm font-medium text-slate-300 mb-3">{day.label}</h3>
                  <ul className="space-y-3">
                    {day.exercises.map((ex, exIdx) => (
                      <li
                        key={`${dayIdx}-${exIdx}-${ex.libraryId}`}
                        className="rounded-lg bg-slate-800 border border-slate-700 p-3 space-y-2"
                      >
                        <p className="text-white font-medium text-sm">{ex.name}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={ex.sets}
                            onChange={(e) =>
                              updateDayExercise(dayIdx, exIdx, 'sets', Number(e.target.value) || 3)
                            }
                            className="w-14 min-h-[40px] px-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
                            placeholder="Series"
                          />
                          <span className="text-slate-500 text-sm">×</span>
                          <input
                            type="text"
                            value={ex.reps}
                            onChange={(e) => updateDayExercise(dayIdx, exIdx, 'reps', e.target.value)}
                            placeholder="Reps"
                            className="w-16 min-h-[40px] px-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
                          />
                          <input
                            type="text"
                            value={ex.notes}
                            onChange={(e) => updateDayExercise(dayIdx, exIdx, 'notes', e.target.value)}
                            placeholder="Notas"
                            className="flex-1 min-w-[100px] min-h-[40px] px-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeDayExercise(dayIdx, exIdx)}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Quitar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {day.exercises.length === 0 && (
                    <p className="text-slate-500 text-sm">Arrastra aquí ejercicios de la biblioteca</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-[48px] px-5 py-3 rounded-xl bg-slate-700 text-slate-200 touch-manipulation"
            >
              Atrás
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[48px] px-5 py-3 rounded-xl bg-sky-600 text-white font-medium hover:bg-sky-500 disabled:opacity-50 touch-manipulation"
            >
              {saving ? 'Guardando...' : 'Crear rutina'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
