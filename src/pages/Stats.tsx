import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface TopEntry {
  exerciseId: string
  exerciseName: string
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
      const { data: exData } = await supabase
        .from('routine_exercises')
        .select('id, name')
        .in('id', exIds)

      const nameById = new Map<string, string>()
      for (const e of (exData || []) as { id: string; name: string }[]) {
        nameById.set(e.id, e.name)
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

        stats.push({
          exerciseId: id,
          exerciseName: g.name,
          bestWeight: Number(best.top_weight),
          bestReps: best.top_reps,
          bestDate: best.for_date,
          lastWeight: Number(last.top_weight ?? best.top_weight),
          lastReps: last.top_reps ?? best.top_reps,
          lastDate: last.for_date
        })
      }

      stats.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName))
      setEntries(stats)
      setLoading(false)
    }

    load()
  }, [])

  const filtered = entries.filter((e) =>
    e.exerciseName.toLowerCase().includes(filter.toLowerCase())
  )

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
            className="mb-4 w-full max-w-sm px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500"
          />

          <ul className="space-y-3">
            {filtered.map((e) => (
              <li
                key={e.exerciseId}
                className="rounded-xl bg-slate-800 border border-slate-700 p-4"
              >
                <p className="text-white font-semibold">{e.exerciseName}</p>
                <p className="text-slate-400 text-sm mt-1">
                  Mejor marca:{' '}
                  <strong>
                    {e.bestWeight} kg{e.bestReps != null ? ` x ${e.bestReps} reps` : ''}
                  </strong>{' '}
                  ({new Date(e.bestDate + 'Z').toLocaleDateString('es-ES')})
                </p>
                <p className="text-slate-400 text-sm">
                  Última:{' '}
                  <strong>
                    {e.lastWeight} kg{e.lastReps != null ? ` x ${e.lastReps} reps` : ''}
                  </strong>{' '}
                  ({new Date(e.lastDate + 'Z').toLocaleDateString('es-ES')})
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

