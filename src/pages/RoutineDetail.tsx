import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  updateRoutineDates,
  deleteRoutine,
  setRoutineActive,
  updateRoutineName,
  updateRoutineDayLabel,
  setNextDayOverride,
  getNextDayOverride,
  clearNextDayOverride,
  addRoutineDay,
  deleteRoutineDay,
  addExerciseToDay,
  deleteRoutineExercise,
  reorderRoutineExercises,
  updateRoutineExerciseSetsReps
} from '../lib/routineDb'
import { useRoutines, useActiveRoutine } from '../hooks/useRoutines'
import { getLinearDays, getDayLabel } from '../lib/routineUtils'
import { listLibraryExercises } from '../lib/exerciseLibraryDb'
import type { LibraryExercise } from '../lib/exerciseLibraryDb'

const today = new Date().toISOString().slice(0, 10)

export default function RoutineDetail() {
  const { id } = useParams<{ id: string }>()
  const { routines, loading, refetch } = useRoutines()
  const { activeRoutine } = useActiveRoutine(today)
  const routine = routines.find((r) => r.id === id)
  const linearDays = routine ? getLinearDays(routine) : []

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activating, setActivating] = useState(false)
  const [editingName, setEditingName] = useState(routine?.name ?? '')
  const [dayLabels, setDayLabels] = useState<string[]>([])
  const [savingName, setSavingName] = useState(false)
  const [savingDayIdx, setSavingDayIdx] = useState<number | null>(null)
  const [nextDayOverride, setNextDayOverrideState] = useState<number | null>(null)
  const [savingOverride, setSavingOverride] = useState(false)
  const [addingDay, setAddingDay] = useState(false)
  const [deletingDayId, setDeletingDayId] = useState<string | null>(null)
  const [errorDayLabel, setErrorDayLabel] = useState<string | null>(null)
  const [errorOverride, setErrorOverride] = useState<string | null>(null)
  const [addingExerciseDayIdx, setAddingExerciseDayIdx] = useState<number | null>(null)
  const [newExerciseName, setNewExerciseName] = useState('')
  const [libraryExercises, setLibraryExercises] = useState<LibraryExercise[]>([])
  const [savingExercise, setSavingExercise] = useState(false)
  const [deletingExId, setDeletingExId] = useState<string | null>(null)
  const [reorderingDayIdx, setReorderingDayIdx] = useState<number | null>(null)
  const [errorExercises, setErrorExercises] = useState<string | null>(null)
  const [editingSetsReps, setEditingSetsReps] = useState<Record<string, { sets: string; reps: string }>>({})
  const editingSetsRepsRef = useRef(editingSetsReps)
  useEffect(() => {
    editingSetsRepsRef.current = editingSetsReps
  }, [editingSetsReps])
  const [savingSetsRepsId, setSavingSetsRepsId] = useState<string | null>(null)
  const isActive = activeRoutine?.id === id

  useEffect(() => {
    if (routine) {
      setStartDate(routine.startDate ?? '')
      setEndDate(routine.endDate ?? '')
      setEditingName(routine.name)
      setDayLabels(getLinearDays(routine).map((d) => d.label))
    }
  }, [routine])

  useEffect(() => {
    if (id) getNextDayOverride(id).then(setNextDayOverrideState)
  }, [id])

  useEffect(() => {
    if (addingExerciseDayIdx != null) {
      listLibraryExercises().then(({ data }) => setLibraryExercises(data))
    } else {
      setNewExerciseName('')
    }
  }, [addingExerciseDayIdx])

  if (loading || !id) {
    return <div className="py-8 text-slate-400">Cargando...</div>
  }
  if (!routine) {
    return (
      <div className="py-8">
        <p className="text-slate-400">Rutina no encontrada.</p>
        <Link to="/routines" className="text-sky-400 mt-2 inline-block">
          Volver a rutinas
        </Link>
      </div>
    )
  }

  async function handleSaveDates(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const ok = await updateRoutineDates(
      id!,
      startDate || null,
      endDate || null
    )
    setSaving(false)
    if (ok) {
      refetch()
    }
  }

  async function handleActivate() {
    if (!id) return
    setActivating(true)
    const { error } = await setRoutineActive(id)
    setActivating(false)
    if (!error) refetch()
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta rutina?')) return
    setDeleting(true)
    const ok = await deleteRoutine(id!)
    setDeleting(false)
    if (ok) window.location.href = '/routines'
  }

  async function handleSaveName() {
    if (!id || !editingName.trim()) return
    setSavingName(true)
    const { error } = await updateRoutineName(id, editingName.trim())
    setSavingName(false)
    if (!error) refetch()
  }

  async function handleSaveDayLabel(dayIdx: number) {
    const day = linearDays[dayIdx]
    setErrorDayLabel(null)
    if (dayLabels[dayIdx] === undefined) return
    if (!day?.id) {
      setErrorDayLabel('No se puede guardar: recarga la página e inténtalo de nuevo.')
      return
    }
    setSavingDayIdx(dayIdx)
    const { error } = await updateRoutineDayLabel(day.id, dayLabels[dayIdx])
    setSavingDayIdx(null)
    if (error) {
      setErrorDayLabel(error)
      return
    }
    refetch()
  }

  async function handleSetNextDayOverride(dayIndex: number) {
    if (!id) return
    setErrorOverride(null)
    setSavingOverride(true)
    const { error } = await setNextDayOverride(id, dayIndex)
    setSavingOverride(false)
    if (error) {
      setErrorOverride(error)
      return
    }
    setNextDayOverrideState(dayIndex)
    refetch()
  }

  async function handleClearNextDayOverride() {
    if (!id) return
    setSavingOverride(true)
    await clearNextDayOverride(id)
    setNextDayOverrideState(null)
    setSavingOverride(false)
    refetch()
  }

  async function handleAddDay() {
    if (!id) return
    setAddingDay(true)
    const { error } = await addRoutineDay(id)
    setAddingDay(false)
    if (!error) refetch()
  }

  async function handleDeleteDay(dayId: string) {
    if (!dayId || !confirm('¿Eliminar este día de la rutina? Se borrarán también sus ejercicios.')) return
    setDeletingDayId(dayId)
    const { error } = await deleteRoutineDay(dayId)
    setDeletingDayId(null)
    if (!error) refetch()
  }

  async function handleAddExercise(dayIdx: number, name?: string, fromLibrary?: LibraryExercise) {
    const day = linearDays[dayIdx]
    if (!day?.id) return
    const exerciseName = (fromLibrary?.name ?? name ?? newExerciseName).trim()
    if (!exerciseName) return
    setErrorExercises(null)
    setSavingExercise(true)
    const { error } = await addExerciseToDay(day.id, {
      name: exerciseName,
      demo_image_url: fromLibrary?.demo_image_url ?? null,
      demo_video_url: fromLibrary?.demo_video_url ?? null
    })
    setSavingExercise(false)
    if (error) {
      setErrorExercises(error)
      return
    }
    setAddingExerciseDayIdx(null)
    setNewExerciseName('')
    refetch()
  }

  async function handleRemoveExercise(exerciseId: string) {
    if (!confirm('¿Quitar este ejercicio del día?')) return
    setErrorExercises(null)
    setDeletingExId(exerciseId)
    const { error } = await deleteRoutineExercise(exerciseId)
    setDeletingExId(null)
    if (error) setErrorExercises(error)
    else refetch()
  }

  async function handleSaveSetsReps(exId: string, setsStr: string, repsStr: string) {
    const sets = setsStr.trim() === '' ? null : parseInt(setsStr, 10)
    const reps = repsStr.trim() === '' ? null : repsStr.trim()
    setErrorExercises(null)
    setSavingSetsRepsId(exId)
    const { error } = await updateRoutineExerciseSetsReps(exId, sets, reps)
    setSavingSetsRepsId(null)
    if (error) setErrorExercises(error)
    else {
      setEditingSetsReps((prev) => {
        const next = { ...prev }
        delete next[exId]
        return next
      })
      refetch()
    }
  }

  async function handleMoveExercise(dayIdx: number, exIdx: number, direction: 'up' | 'down') {
    const day = linearDays[dayIdx]
    if (!day?.id || !day.exercises.length) return
    const next = [...day.exercises]
    const i = direction === 'up' ? exIdx - 1 : exIdx + 1
    if (i < 0 || i >= next.length) return
    ;[next[exIdx], next[i]] = [next[i], next[exIdx]]
    const orderedIds = next.map((e) => e.id).filter((id): id is string => Boolean(id))
    if (orderedIds.length !== day.exercises.length) return
    setErrorExercises(null)
    setReorderingDayIdx(dayIdx)
    const { error } = await reorderRoutineExercises(day.id, orderedIds)
    setReorderingDayIdx(null)
    if (error) setErrorExercises(error)
    else refetch()
  }

  const totalExercises = routine.weeks.reduce(
    (acc, w) => acc + w.days.reduce((a, d) => a + d.exercises.length, 0),
    0
  )

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-white">{routine.name}</h1>
        <Link to="/routines" className="text-slate-400 hover:text-white text-sm">
          Volver
        </Link>
      </div>
      <p className="text-slate-500 text-sm mb-4">
        {routine.weeks.length} semana(s), {totalExercises} ejercicios en total.
      </p>

      <section className="mb-6">
        <h2 className="text-sm font-medium text-slate-300 mb-2">Nombre de la rutina</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            className="flex-1 min-w-[200px] min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-white"
          />
          <button
            type="button"
            onClick={handleSaveName}
            disabled={savingName}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
          >
            {savingName ? 'Guardando...' : 'Guardar nombre'}
          </button>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-medium text-slate-300 mb-2">Días de la rutina</h2>
        <p className="text-slate-500 text-xs mb-3">Asigna o cambia el nombre de cada día. Puedes añadir o eliminar días.</p>
        {linearDays.length === 0 ? (
          <p className="text-slate-500 text-sm mb-2">La rutina no tiene días.</p>
        ) : null}
          <ul className="space-y-2">
            {linearDays.map((day, idx) => (
              <li key={day.id ?? idx} className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500 text-sm w-12">Día {idx + 1}</span>
                <input
                  type="text"
                  value={dayLabels[idx] ?? day.label}
                  onChange={(e) => {
                    const next = [...dayLabels]
                    next[idx] = e.target.value
                    setDayLabels(next)
                  }}
                  className="flex-1 min-w-[120px] min-h-[40px] px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleSaveDayLabel(idx)}
                  disabled={savingDayIdx === idx || !day.id}
                  title={!day.id ? 'Recarga la página para poder guardar' : undefined}
                  className="min-h-[40px] px-3 py-2 rounded-lg bg-slate-700 text-slate-200 text-sm hover:bg-slate-600 disabled:opacity-50"
                >
                  {savingDayIdx === idx ? 'Guardando...' : 'Guardar'}
                </button>
                {day.id && linearDays.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDay(day.id!)}
                        disabled={deletingDayId === day.id}
                        className="min-h-[40px] px-3 py-2 rounded-lg bg-red-900/40 text-red-300 text-sm hover:bg-red-900/60 disabled:opacity-50"
                      >
                        {deletingDayId === day.id ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    )}
              </li>
            ))}
          </ul>
        {errorDayLabel && (
          <p className="mt-2 text-sm text-red-400" role="alert">{errorDayLabel}</p>
        )}
        <button
          type="button"
          onClick={handleAddDay}
          disabled={addingDay}
          className="mt-3 min-h-[40px] px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
        >
          {addingDay ? 'Añadiendo...' : linearDays.length === 0 ? 'Añadir primer día' : 'Añadir día'}
        </button>
      </section>

      {linearDays.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium text-slate-300 mb-2">Ejercicios por día</h2>
          <p className="text-slate-500 text-xs mb-4">Añade, quita o reordena ejercicios en cada día de la rutina.</p>
          {errorExercises && <p className="text-red-400 text-sm mb-3" role="alert">{errorExercises}</p>}
          <div className="space-y-6">
            {linearDays.map((day, dayIdx) => (
              <div key={day.id ?? dayIdx} className="rounded-xl bg-slate-800/50 border border-slate-700 p-4">
                <h3 className="text-sm font-medium text-white mb-3">{getDayLabel(linearDays, dayIdx)}</h3>
                <ul className="space-y-2 mb-3">
                  {day.exercises.map((ex, exIdx) => {
                    const exId = ex.id ?? ''
                    const local = editingSetsReps[exId]
                    const setsVal = local?.sets ?? String(ex.sets ?? '')
                    const repsVal = local?.reps ?? (ex.reps ?? '')
                    const saving = savingSetsRepsId === exId
                    return (
                    <li
                      key={ex.id ?? exIdx}
                      className="flex flex-wrap items-center gap-2 min-h-[44px] py-1"
                    >
                      <span className="flex-1 min-w-0 text-slate-200 text-sm">{ex.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="sr-only">Series</label>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          placeholder="S"
                          value={setsVal}
                          onChange={(e) => setEditingSetsReps((prev) => ({ ...prev, [exId]: { sets: e.target.value, reps: prev[exId]?.reps ?? (ex.reps ?? '') } }))}
                          onBlur={() => {
                            if (!ex.id) return
                            const v = editingSetsRepsRef.current[exId] ?? { sets: String(ex.sets ?? ''), reps: ex.reps ?? '' }
                            handleSaveSetsReps(ex.id, v.sets, v.reps)
                          }}
                          disabled={saving}
                          className="w-12 min-h-[36px] px-2 py-1 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm text-center"
                        />
                        <label className="sr-only">Repeticiones</label>
                        <input
                          type="text"
                          placeholder="Rep"
                          value={repsVal}
                          onChange={(e) => setEditingSetsReps((prev) => ({ ...prev, [exId]: { sets: prev[exId]?.sets ?? String(ex.sets ?? ''), reps: e.target.value } }))}
                          onBlur={() => {
                            if (!ex.id) return
                            const v = editingSetsRepsRef.current[exId] ?? { sets: String(ex.sets ?? ''), reps: ex.reps ?? '' }
                            handleSaveSetsReps(ex.id, v.sets, v.reps)
                          }}
                          disabled={saving}
                          className="w-14 min-h-[36px] px-2 py-1 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveExercise(dayIdx, exIdx, 'up')}
                          disabled={reorderingDayIdx === dayIdx || exIdx === 0}
                          className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:pointer-events-none"
                          title="Subir"
                          aria-label="Subir"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveExercise(dayIdx, exIdx, 'down')}
                          disabled={reorderingDayIdx === dayIdx || exIdx === day.exercises.length - 1}
                          className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:pointer-events-none"
                          title="Bajar"
                          aria-label="Bajar"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => ex.id && handleRemoveExercise(ex.id)}
                          disabled={deletingExId === (ex.id ?? '')}
                          className="p-2 rounded-lg bg-red-900/40 text-red-300 hover:bg-red-900/60 disabled:opacity-50"
                          title="Quitar ejercicio"
                          aria-label="Quitar ejercicio"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                    )
                  })}
                </ul>
                {addingExerciseDayIdx === dayIdx ? (
                  <div className="border-t border-slate-600 pt-3 space-y-2">
                    <input
                      type="text"
                      value={newExerciseName}
                      onChange={(e) => setNewExerciseName(e.target.value)}
                      placeholder="Nombre del ejercicio"
                      className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
                      autoFocus
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddExercise(dayIdx)}
                        disabled={savingExercise || !newExerciseName.trim()}
                        className="min-h-[40px] px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
                      >
                        {savingExercise ? 'Añadiendo...' : 'Añadir'}
                      </button>
                      {libraryExercises.length > 0 && (
                        <select
                          className="min-h-[40px] px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
                          value=""
                          onChange={(e) => {
                            const libId = e.target.value
                            if (!libId) return
                            const lib = libraryExercises.find((x) => x.id === libId)
                            if (lib) handleAddExercise(dayIdx, undefined, lib)
                            e.target.value = ''
                          }}
                        >
                          <option value="">Desde biblioteca...</option>
                          {libraryExercises.map((lib) => (
                            <option key={lib.id} value={lib.id}>{lib.name}</option>
                          ))}
                        </select>
                      )}
                      <button
                        type="button"
                        onClick={() => setAddingExerciseDayIdx(null)}
                        className="min-h-[40px] px-3 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingExerciseDayIdx(dayIdx)}
                    className="min-h-[40px] px-4 py-2 rounded-lg bg-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-600"
                  >
                    Añadir ejercicio
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {isActive && linearDays.length > 0 && (
        <section className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <h2 className="text-sm font-medium text-slate-300 mb-1">Próximo día a realizar</h2>
          <p className="text-slate-500 text-xs mb-2">
            Fija qué día de la rutina tocará la próxima vez que se entrene (aunque el sistema recomiende otro).
          </p>
          <p className="text-sky-300/90 text-xs mb-3">
            Pulsa el día que quieras; se guarda al instante (no hace falta otro botón).
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {linearDays.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSetNextDayOverride(idx)}
                disabled={savingOverride}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium touch-manipulation ${
                  nextDayOverride === idx
                    ? 'bg-sky-600 text-white ring-2 ring-sky-400'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
              >
                {getDayLabel(linearDays, idx)}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClearNextDayOverride}
              disabled={savingOverride || nextDayOverride == null}
              className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-slate-400 border border-slate-600 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:pointer-events-none"
            >
              Quitar fijación
            </button>
          </div>
          {errorOverride && (
            <p className="mt-2 text-sm text-red-400" role="alert">
              {errorOverride}
              {errorOverride.includes('relation') || errorOverride.includes('does not exist')
                ? ' Ejecuta en Supabase la migración: 20260301_user_routine_next_override.sql'
                : ''}
            </p>
          )}
          <p className="text-slate-500 text-xs mt-2">
            {nextDayOverride != null ? `Próximo entreno: ${getDayLabel(linearDays, nextDayOverride)}` : 'Sin fijar (se usa la secuencia automática)'}
          </p>
        </section>
      )}

      {!isActive && (
        <div className="mb-6">
          <button
            type="button"
            onClick={handleActivate}
            disabled={activating}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 active:bg-sky-500 disabled:opacity-50 touch-manipulation"
          >
            {activating ? 'Activando...' : 'Activar esta rutina'}
          </button>
          <p className="text-slate-500 text-xs mt-1">La rutina activa es la que se usa en Hoy y Calendario.</p>
        </div>
      )}
      {isActive && (
        <p className="text-sky-400 text-sm mb-6">Esta rutina está activa.</p>
      )}

      <form onSubmit={handleSaveDates} className="space-y-4 mb-8">
        <h2 className="text-sm font-medium text-slate-300">Fechas de la rutina</h2>
        <p className="text-slate-500 text-xs">
          Así la rutina aparecerá en &quot;Hoy&quot; entre estas fechas.
        </p>
        <div className="flex flex-wrap gap-4">
          <div>
            <label htmlFor="start" className="block text-xs text-slate-500 mb-1">Inicio</label>
            <input
              id="start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
            />
          </div>
          <div>
            <label htmlFor="end" className="block text-xs text-slate-500 mb-1">Fin</label>
            <input
              id="end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar fechas'}
        </button>
      </form>

      <div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 rounded-lg bg-red-900/50 text-red-300 text-sm hover:bg-red-900 disabled:opacity-50"
        >
          {deleting ? 'Eliminando...' : 'Eliminar rutina'}
        </button>
      </div>
    </div>
  )
}
