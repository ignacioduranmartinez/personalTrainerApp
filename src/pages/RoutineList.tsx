import { Link } from 'react-router-dom'
import { useRoutines } from '../hooks/useRoutines'

export default function RoutineList() {
  const { routines, loading, error } = useRoutines()

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
        <div className="flex gap-2">
          <Link
            to="/routines/import"
            className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-600"
          >
            Importar JSON
          </Link>
          <Link
            to="/routines/new"
            className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-500"
          >
            Nueva rutina
          </Link>
        </div>
      </div>

      {routines.length === 0 ? (
        <p className="text-slate-400">Aún no hay rutinas. Crea una o importa desde JSON.</p>
      ) : (
        <ul className="space-y-3">
          {routines.map((r) => (
            <li key={r.id}>
              <Link
                to={`/routines/${r.id}`}
                className="block p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600"
              >
                <span className="font-medium text-white">{r.name}</span>
                {(r.startDate || r.endDate) && (
                  <span className="block text-sm text-slate-500 mt-1">
                    {r.startDate && new Date(r.startDate).toLocaleDateString('es')}
                    {r.startDate && r.endDate && ' — '}
                    {r.endDate && new Date(r.endDate).toLocaleDateString('es')}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
