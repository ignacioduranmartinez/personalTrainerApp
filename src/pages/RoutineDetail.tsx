import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  updateRoutineDates,
  deleteRoutine,
  setRoutineActive,
  updateRoutineName,
  updateRoutineDayLabel,
  setNextDayOverride,
  getNextDayOverride
} from '../lib/routineDb'
import { useRoutines, useActiveRoutine } from '../hooks/useRoutines'
import { getLinearDays, getDayLabel } from '../lib/routineUtils'

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
  const isActive = activeRoutine?.id === id

  useEffect(() => {
    if (routine) {
      setStartDate(routine.startDate ?? '')
      setEndDate(routine.endDate ?? '')
      setEditingName(routine.name)
      setDayLabels(linearDays.map((d) => d.label))
    }
  }, [routine, linearDays])

  useEffect(() => {
    if (id) getNextDayOverride(id).then(setNextDayOverrideState)
  }, [id])

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
    if (!day?.id || dayLabels[dayIdx] === undefined) return
    setSavingDayIdx(dayIdx)
    const { error } = await updateRoutineDayLabel(day.id, dayLabels[dayIdx])
    setSavingDayIdx(null)
    if (!error) refetch()
  }

  async function handleSetNextDayOverride(dayIndex: number) {
    if (!id) return
    setSavingOverride(true)
    const { error } = await setNextDayOverride(id, dayIndex)
    setSavingOverride(false)
    if (!error) {
      setNextDayOverrideState(dayIndex)
      refetch()
    }
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

      {linearDays.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium text-slate-300 mb-2">Nombres de los días</h2>
          <p className="text-slate-500 text-xs mb-3">Asigna o cambia el nombre de cada día de la rutina.</p>
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
                {day.id && (
                  <button
                    type="button"
                    onClick={() => handleSaveDayLabel(idx)}
                    disabled={savingDayIdx === idx}
                    className="min-h-[40px] px-3 py-2 rounded-lg bg-slate-700 text-slate-200 text-sm hover:bg-slate-600 disabled:opacity-50"
                  >
                    {savingDayIdx === idx ? 'Guardando...' : 'Guardar'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {isActive && linearDays.length > 0 && (
        <section className="mb-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <h2 className="text-sm font-medium text-slate-300 mb-1">Próximo día a realizar</h2>
          <p className="text-slate-500 text-xs mb-3">
            Fija qué día de la rutina tocará la próxima vez que se entrene (aunque el sistema recomiende otro). Así puedes indicar, por ejemplo, que empiece de nuevo por el Día 1.
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
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
              >
                {getDayLabel(linearDays, idx)}
              </button>
            ))}
            <span className="text-slate-500 text-xs">
              {nextDayOverride != null ? `Actual: ${getDayLabel(linearDays, nextDayOverride)}` : 'Sin fijar (se usa la secuencia)'}
            </span>
          </div>
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
