import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { MOVEMENT_PATTERN_OPTIONS } from '../lib/exerciseLibraryDb'

/** Formatea una fecha YYYY-MM-DD para mostrar; evita "Invalid Date". */
function formatStatDate(dateStr: string | null | undefined): string {
  if (dateStr == null || dateStr === '') return '—'
  const d = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

const UNCLASSIFIED = 'Sin clasificar'

interface TopEntry {
  exerciseId: string
  exerciseName: string
  movementPattern: string
  bestWeight: number
  bestReps: number | null
  bestDate: string
  lastWeight: number
  lastReps: number | null
  lastDate: string
}

export default function Stats() {
  const [entries, setEntries] = useState<TopEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setEntries([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('exercise_notes')
        .select('routine_exercise_id, for_date, top_weight, top_reps')
        .eq('user_id', user.id)
        .not('top_weight', 'is', null)
        .order('for_date', { ascending: true })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const rows = (data || []) as {
        routine_exercise_id: string
        for_date: string
        top_weight: number | null
        top_reps: number | null
      }[]

      if (rows.length === 0) {
        setEntries([])
        setLoading(false)
        return
      }

      const exIds = Array.from(new Set(rows.map((r) => r.routine_exercise_id)))
      const [{ data: exData }, { data: libraryData }] = await Promise.all([
        supabase.from('routine_exercises').select('id, name').in('id', exIds),
        supabase.from('exercise_library').select('name, movement_pattern').eq('user_id', user.id)
      ])

      const nameById = new Map<string, string>()
      for (const e of (exData || []) as { id: string; name: string }[]) {
        nameById.set(e.id, e.name)
      }

      const patternByName = new Map<string, string>()
      for (const lib of (libraryData || []) as { name: string; movement_pattern: string | null }[]) {
        if (lib.movement_pattern) patternByName.set(lib.name.trim(), lib.movement_pattern)
      }

      const grouped = new Map<string, { name: string; rows: typeof rows }>()
      for (const r of rows) {
        const name = nameById.get(r.routine_exercise_id) ?? 'Ejercicio'
        if (!grouped.has(r.routine_exercise_id)) {
          grouped.set(r.routine_exercise_id, { name, rows: [] as typeof rows })
        }
        grouped.get(r.routine_exercise_id)!.rows.push(r)
      }

      const stats: TopEntry[] = []
      for (const [id, g] of grouped) {
        const sorted = g.rows.slice().sort((a, b) => a.for_date.localeCompare(b.for_date))
        const last = sorted[sorted.length - 1]
        const best = sorted.reduce((acc, cur) => {
          if (cur.top_weight == null) return acc
          if (acc.top_weight == null || (cur.top_weight ?? 0) > (acc.top_weight ?? 0)) return cur
          return acc
        }, sorted[0])

        if (!best.top_weight) continue

        const movementPattern = patternByName.get(g.name.trim()) || UNCLASSIFIED

        stats.push({
          exerciseId: id,
          exerciseName: g.name,
          movementPattern,
          bestWeight: Number(best.top_weight),
          bestReps: best.top_reps,
          bestDate: best.for_date,
          lastWeight: Number(last.top_weight ?? best.top_weight),
          lastReps: last.top_reps ?? best.top_reps,
          lastDate: last.for_date
        })
      }

      stats.sort((a, b) => {
        const orderA = MOVEMENT_PATTERN_OPTIONS.includes(a.movementPattern as 'Push' | 'Pull' | 'Legs') ? MOVEMENT_PATTERN_OPTIONS.indexOf(a.movementPattern as 'Push' | 'Pull' | 'Legs') : 99
        const orderB = MOVEMENT_PATTERN_OPTIONS.includes(b.movementPattern as 'Push' | 'Pull' | 'Legs') ? MOVEMENT_PATTERN_OPTIONS.indexOf(b.movementPattern as 'Push' | 'Pull' | 'Legs') : 99
        if (orderA !== orderB) return orderA - orderB
        return a.exerciseName.localeCompare(b.exerciseName)
      })
      setEntries(stats)
      setLoading(false)
    }

    load()
  }, [])

  const filtered = entries.filter((e) =>
    e.exerciseName.toLowerCase().includes(filter.toLowerCase())
  )

  const byPattern = useMemo(() => {
    const sections: { pattern: string; entries: TopEntry[] }[] = []
    const order = [...MOVEMENT_PATTERN_OPTIONS, UNCLASSIFIED]
    for (const pattern of order) {
      const list = filtered.filter((e) => e.movementPattern === pattern)
      if (list.length > 0) sections.push({ pattern, entries: list })
    }
    return sections
  }, [filtered])

  return (
    <div className="py-4">
      <h1 className="text-xl font-semibold text-white mb-4">Estadísticas</h1>

      {loading && <p className="text-slate-400 text-sm">Cargando...</p>}
      {error && <p className="text-red-400 text-sm mb-2">Error: {error}</p>}

      {!loading && entries.length === 0 && !error && (
        <p className="text-slate-500 text-sm">
          Aún no hay series máximas guardadas. Durante el entreno, abre “Notas” en un ejercicio y
          guarda una serie máxima (peso x repeticiones).
        </p>
      )}

      {entries.length > 0 && (
        <>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar ejercicio..."
            className="mb-4 w-full max-w-sm min-h-[48px] px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500"
          />

          <p className="text-slate-500 text-sm mb-4">
            Marcas agrupadas por patrón de movimiento (asignado en Biblioteca de ejercicios).
          </p>

          {byPattern.map(({ pattern, entries: sectionEntries }) => (
            <section key={pattern} className="mb-6">
              <h2 className="text-sm font-medium text-slate-400 mb-2">{pattern}</h2>
              <ul className="space-y-3">
                {sectionEntries.map((e) => (
                  <li
                    key={e.exerciseId}
                    className="rounded-xl bg-slate-800 border border-slate-700 p-4 sm:p-4"
                  >
                    <p className="text-white font-semibold">{e.exerciseName}</p>
                    <p className="text-slate-400 text-sm mt-1">
                      Mejor marca:{' '}
                      <strong>
                        {e.bestWeight} kg{e.bestReps != null ? ` x ${e.bestReps} reps` : ''}
                      </strong>{' '}
                      ({formatStatDate(e.bestDate)})
                    </p>
                    <p className="text-slate-400 text-sm">
                      Última:{' '}
                      <strong>
                        {e.lastWeight} kg{e.lastReps != null ? ` x ${e.lastReps} reps` : ''}
                      </strong>{' '}
                      ({formatStatDate(e.lastDate)})
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  )
}

