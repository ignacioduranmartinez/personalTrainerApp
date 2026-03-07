import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createLibraryExercise,
  importLibraryFromRoutines,
  listLibraryExercises,
  updateLibraryExercise,
  MUSCLE_OPTIONS,
  MOVEMENT_PATTERN_OPTIONS,
  type LibraryExercise
} from '../lib/exerciseLibraryDb'

const EMPTY = ''

export default function ExerciseLibrary() {
  const [items, setItems] = useState<LibraryExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [muscleFilter, setMuscleFilter] = useState<string>(EMPTY)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [typology, setTypology] = useState('')
  const [equipment, setEquipment] = useState('')
  const [muscle, setMuscle] = useState('')
  const [movementPattern, setMovementPattern] = useState('')
  const [notes, setNotes] = useState('')
  const [demoVideoUrl, setDemoVideoUrl] = useState('')
  const [demoImageUrl, setDemoImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editMuscle, setEditMuscle] = useState('')
  const [editPattern, setEditPattern] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error } = await listLibraryExercises()
    setError(error)
    setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function fold(text: string) {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  }

  const filtered = useMemo(() => {
    let list = items
    if (muscleFilter) {
      list = list.filter((i) => (i.muscle ?? '') === muscleFilter)
    }
    const query = fold(q.trim())
    if (!query) return list
    return list.filter((i) => {
      return (
        fold(i.name).includes(query) ||
        fold(i.category ?? '').includes(query) ||
        fold(i.typology ?? '').includes(query) ||
        fold(i.equipment ?? '').includes(query) ||
        fold(i.muscle ?? '').includes(query) ||
        fold(i.movement_pattern ?? '').includes(query)
      )
    })
  }, [items, q, muscleFilter])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const { error } = await createLibraryExercise({
      name: name.trim(),
      category,
      typology,
      equipment,
      muscle: muscle || undefined,
      movementPattern: movementPattern || undefined,
      notes,
      demoVideoUrl,
      demoImageUrl
    })
    setSaving(false)
    if (error) {
      setError(error)
      return
    }
    setName('')
    setCategory('')
    setTypology('')
    setEquipment('')
    setMuscle('')
    setMovementPattern('')
    setNotes('')
    setDemoVideoUrl('')
    setDemoImageUrl('')
    await load()
  }

  function startEdit(item: LibraryExercise) {
    setEditingId(item.id)
    setEditMuscle(item.muscle ?? '')
    setEditPattern(item.movement_pattern ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditMuscle('')
    setEditPattern('')
  }

  async function saveEdit() {
    if (!editingId) return
    setSavingEdit(true)
    const { error } = await updateLibraryExercise(editingId, {
      muscle: editMuscle || null,
      movementPattern: editPattern || null
    })
    setSavingEdit(false)
    if (error) {
      setError(error)
      return
    }
    setEditingId(null)
    await load()
  }

  async function handleImport() {
    setImportMsg(null)
    setError(null)
    setImporting(true)
    const { imported, error } = await importLibraryFromRoutines()
    setImporting(false)
    if (error) {
      setError(error)
      return
    }
    setImportMsg(imported > 0 ? `Importados ${imported} ejercicios desde tus rutinas.` : 'No había ejercicios nuevos para importar.')
    await load()
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-white">Biblioteca de ejercicios</h1>
        <Link to="/manage" className="text-sm text-sky-400 hover:underline">
          Volver a Gestionar
        </Link>
      </div>

      <p className="text-slate-500 text-sm mb-6">
        Añade ejercicios aquí y luego podrás incorporarlos rápidamente al crear nuevas rutinas.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleImport}
          disabled={importing}
          className="px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-600 disabled:opacity-50"
        >
          {importing ? 'Importando...' : 'Importar ejercicios desde rutinas'}
        </button>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-sm font-medium hover:bg-slate-700 border border-slate-700"
        >
          Refrescar
        </button>
      </div>
      {importMsg && <p className="text-slate-300 text-sm mb-4">{importMsg}</p>}
      {error && <p className="text-red-400 text-sm mb-4">Error: {error}</p>}

      <div className="rounded-xl bg-slate-800 border border-slate-700 p-4 mb-8">
        <h2 className="text-sm font-medium text-slate-300 mb-3">Añadir ejercicio</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre (obligatorio)"
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Categoría (ej. Fuerza)"
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
            />
            <input
              value={typology}
              onChange={(e) => setTypology(e.target.value)}
              placeholder="Tipología (ej. Pierna)"
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
            />
            <input
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="Material (ej. Mancuernas)"
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-slate-400 text-sm">Músculo</label>
            <label className="text-slate-400 text-sm sm:col-start-2">Patrón de movimiento</label>
            <select
              value={muscle}
              onChange={(e) => setMuscle(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
            >
              <option value="">— Elegir —</option>
              {MUSCLE_OPTIONS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={movementPattern}
              onChange={(e) => setMovementPattern(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
            >
              <option value="">— Elegir —</option>
              {MOVEMENT_PATTERN_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas / cues (opcional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={demoVideoUrl}
              onChange={(e) => setDemoVideoUrl(e.target.value)}
              placeholder="URL vídeo (opcional)"
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
            />
            <input
              value={demoImageUrl}
              onChange={(e) => setDemoImageUrl(e.target.value)}
              placeholder="URL imagen (opcional)"
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Añadir a biblioteca'}
          </button>
        </form>
      </div>

      <div className="mb-3 flex flex-wrap gap-2 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, categoría, tipología o material..."
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm placeholder-slate-500"
        />
        <select
          value={muscleFilter}
          onChange={(e) => setMuscleFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
        >
          <option value="">Todos los músculos</option>
          {MUSCLE_OPTIONS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500 text-sm">No hay ejercicios (o no coincide la búsqueda).</p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((i) => (
            <li key={i.id} className="rounded-xl bg-slate-800 border border-slate-700 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white font-medium">{i.name}</p>
                  {(i.category || i.typology || i.equipment || i.muscle || i.movement_pattern) && (
                    <p className="text-slate-500 text-sm mt-1">
                      {[i.muscle, i.movement_pattern, i.category, i.typology, i.equipment].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {i.notes && <p className="text-slate-400 text-sm mt-2 whitespace-pre-wrap">{i.notes}</p>}
                </div>
                {editingId === i.id ? (
                  <div className="flex flex-col gap-2 shrink-0">
                    <select
                      value={editMuscle}
                      onChange={(e) => setEditMuscle(e.target.value)}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-600 text-white text-sm"
                    >
                      <option value="">— Músculo —</option>
                      {MUSCLE_OPTIONS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      value={editPattern}
                      onChange={(e) => setEditPattern(e.target.value)}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-600 text-white text-sm"
                    >
                      <option value="">— Patrón —</option>
                      {MOVEMENT_PATTERN_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={savingEdit}
                        className="px-2 py-1 rounded bg-sky-600 text-white text-xs hover:bg-sky-500 disabled:opacity-50"
                      >
                        {savingEdit ? '...' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-2 py-1 rounded bg-slate-600 text-slate-200 text-xs hover:bg-slate-500"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(i)}
                    className="shrink-0 text-sky-400 text-sm hover:underline"
                  >
                    Editar
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

