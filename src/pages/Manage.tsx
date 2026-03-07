import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useActiveRoutine } from '../hooks/useRoutines'
import { getLinearDays, getDayLabel } from '../lib/routineUtils'
import { ExerciseCard } from '../components/ExerciseCard'
import { deleteAllWorkoutHistory } from '../hooks/useWorkoutLog'

const today = new Date().toISOString().slice(0, 10)

export default function Manage() {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { activeRoutine, loading, error, refetch } = useActiveRoutine(today)
  const linearDays = activeRoutine ? getLinearDays(activeRoutine) : []
  const selectedDay = selectedDayIndex != null ? linearDays[selectedDayIndex] ?? null : null

  if (loading) return <div className="py-8 text-slate-400">Cargando...</div>
  if (error) return <div className="py-8 text-red-400">Error: {error}</div>

  return (
    <div className="py-4">
      <h1 className="text-xl font-semibold text-white mb-2">Gestionar</h1>
      <p className="text-slate-500 text-sm mb-6">
        Desde aquí puedes crear rutinas y editar vídeos o descansos de cada ejercicio. La vista <strong>Hoy</strong>, <strong>Ver rutina</strong> y <strong>Calendario</strong> son solo de consulta para entrenar.
      </p>

      <div className="mb-8">
        <h2 className="text-sm font-medium text-slate-400 mb-2">Rutinas</h2>
        <p className="text-slate-400 text-sm mb-2">
          Crear nueva rutina, importar JSON o ver y asignar fechas.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/routines"
            className="inline-flex items-center min-h-[48px] px-5 py-3 rounded-xl bg-slate-700 text-white text-base font-medium hover:bg-slate-600 active:bg-slate-600 touch-manipulation"
          >
            Ir a Rutinas
          </Link>
          <Link
            to="/library"
            className="inline-flex items-center min-h-[48px] px-5 py-3 rounded-xl bg-slate-700 text-white text-base font-medium hover:bg-slate-600 active:bg-slate-600 touch-manipulation"
          >
            Biblioteca de ejercicios
          </Link>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-2">Editar ejercicios (vídeo y descanso)</h2>
        <p className="text-slate-400 text-sm mb-4">
          Elige un día de la rutina activa para añadir o cambiar el enlace al vídeo y el tiempo de descanso de cada ejercicio.
        </p>
        {!activeRoutine ? (
          <p className="text-slate-500 text-sm">No hay rutina activa. Asigna una en Rutinas.</p>
        ) : linearDays.length === 0 ? (
          <p className="text-slate-500 text-sm">Esta rutina no tiene días.</p>
        ) : selectedDayIndex == null ? (
          <ul className="space-y-2">
            {linearDays.map((day, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => setSelectedDayIndex(idx)}
                  className="w-full text-left min-h-[52px] px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 active:bg-slate-700 text-white font-medium touch-manipulation"
                >
                  {getDayLabel(linearDays, idx)}
                  {day.exercises.length > 0 && (
                    <span className="text-slate-500 text-sm ml-2">
                      ({day.exercises.length} ejercicios)
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => setSelectedDayIndex(null)}
              className="text-sky-400 text-sm mb-4 hover:underline"
            >
              ← Volver a elegir día
            </button>
            {selectedDay && (
              <>
                <h3 className="text-lg font-semibold text-white mb-4">{getDayLabel(linearDays, selectedDayIndex)}</h3>
                <p className="text-slate-500 text-sm mb-4">
                  Aquí puedes añadir/editar vídeo de muestra y tiempo de descanso por ejercicio.
                </p>
                <ul className="space-y-3">
                  {selectedDay.exercises.map((ex) => (
                    <li key={ex.id ?? ex.name}>
                      <ExerciseCard
                        exercise={ex}
                        forDate={today}
                        routineExerciseId={ex.id ?? undefined}
                        editable
                        onDemoUpdated={refetch}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-10 pt-8 border-t border-slate-700">
        <h2 className="text-sm font-medium text-slate-400 mb-2">Borrar datos de prueba</h2>
        <p className="text-slate-500 text-sm mb-3">
          Si has hecho un ensayo y quieres dejar la app limpia para que la use otra persona: aquí puedes borrar <strong>todo el historial de entrenamientos</strong> y <strong>todas las notas</strong> de ejercicios. Las rutinas y sus ejercicios (vídeos, descansos) no se borran.
        </p>
        <button
          type="button"
          disabled={deleting}
          onClick={async () => {
            const first = window.confirm('¿Borrar todo el historial de entrenamientos y todas las notas? Esta acción no se puede deshacer.')
            if (!first) return
            const second = window.confirm('Última confirmación: ¿seguro que quieres borrarlo todo?')
            if (!second) return
            setDeleting(true)
            const { error } = await deleteAllWorkoutHistory()
            setDeleting(false)
            if (error) alert('Error: ' + error)
            else {
              alert('Hecho. Historial y notas borrados. Recarga la página para ver los cambios.')
              window.location.reload()
            }
          }}
          className="px-4 py-2 rounded-lg bg-amber-900/50 text-amber-200 text-sm font-medium hover:bg-amber-800/50 border border-amber-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? 'Borrando…' : 'Borrar historial y notas'}
        </button>
      </div>
    </div>
  )
}
