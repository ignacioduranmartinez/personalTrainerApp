import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRoutines } from '../hooks/useRoutines'
import { useActiveRoutine } from '../hooks/useRoutines'
import { setRoutineActive } from '../lib/routineDb'

const today = new Date().toISOString().slice(0, 10)

export default function RoutineList() {
  const { routines, loading, error, refetch } = useRoutines()
  const { activeRoutine } = useActiveRoutine(today)
  const [activatingId, setActivatingId] = useState<string | null>(null)

  async function handleActivate(routineId: string) {
    setActivatingId(routineId)
    const { error: err } = await setRoutineActive(routineId)
    setActivatingId(null)
    if (!err) refetch()
  }

  if (loading) {
    return <div className="py-8 text-slate-400">Cargando rutinas...</div>
  }
  if (error) {
    return <div className="py-8 text-red-400">Error: {error}</div>
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">Rutinas</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/routines/import"
            className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-xl bg-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-600 touch-manipulation"
          >
            Importar JSON
          </Link>
          <Link
            to="/routines/new"
            className="min-h-[44px] inline-flex items-center px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 touch-manipulation"
          >
            Nueva rutina
          </Link>
        </div>
      </div>

      <p className="text-slate-500 text-sm mb-4">
        La rutina <strong>activa</strong> es la que se usa en Hoy, Calendario y Estadísticas. Actívala desde aquí o desde su detalle.
      </p>

      {routines.length === 0 ? (
        <p className="text-slate-400">Aún no hay rutinas. Crea una o importa desde JSON.</p>
      ) : (
        <ul className="space-y-3">
          {routines.map((r) => {
            const isActive = activeRoutine?.id === r.id
            return (
              <li key={r.id} className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
                <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <Link to={`/routines/${r.id}`} className="flex-1 min-w-0">
                    <span className="font-medium text-white">{r.name}</span>
                    {isActive && (
                      <span className="ml-2 inline-block px-2 py-0.5 rounded-md bg-sky-600/80 text-white text-xs font-medium">
                        Activa
                      </span>
                    )}
                    {(r.startDate || r.endDate) && (
                      <span className="block text-sm text-slate-500 mt-1">
                        {r.startDate && new Date(r.startDate).toLocaleDateString('es')}
                        {r.startDate && r.endDate && ' — '}
                        {r.endDate && new Date(r.endDate).toLocaleDateString('es')}
                      </span>
                    )}
                  </Link>
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => handleActivate(r.id!)}
                      disabled={activatingId === r.id}
                      className="shrink-0 min-h-[44px] px-4 py-2 rounded-xl bg-sky-600 text-white text-sm font-medium hover:bg-sky-500 active:bg-sky-500 disabled:opacity-50 touch-manipulation"
                    >
                      {activatingId === r.id ? 'Activando...' : 'Activar'}
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
