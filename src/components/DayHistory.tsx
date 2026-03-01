import { useState } from 'react'
import { useHistoryForDay } from '../hooks/useWorkoutLog'
import { formatDuration } from '../lib/restTimer'
import type { Exercise } from '../types/routine'

interface DayHistoryProps {
  routineId: string | null
  routineDayIndex: number
  exercises: Exercise[]
}

export function DayHistory({ routineId, routineDayIndex, exercises }: DayHistoryProps) {
  const [open, setOpen] = useState(false)
  const { sessions, loading } = useHistoryForDay(
    routineId,
    routineDayIndex,
    exercises.map((e) => ({ id: e.id, name: e.name }))
  )

  if (loading || sessions.length === 0) return null

  return (
    <div className="mt-8 pt-6 border-t border-slate-700">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm font-medium text-slate-400 hover:text-white"
      >
        {open ? 'Ocultar' : 'Ver'} histórico de este día ({sessions.length} sesiones)
      </button>
      {open && (
        <ul className="mt-3 space-y-4">
          {sessions.map((s) => (
            <li key={s.for_date} className="rounded-xl bg-slate-800 border border-slate-700 p-4">
              <p className="text-white font-medium">
                {new Date(s.for_date + 'Z').toLocaleDateString('es-ES', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
              {s.duration_seconds != null && s.duration_seconds > 0 && (
                <p className="text-amber-400/90 text-sm mt-0.5">
                  Duración: {formatDuration(s.duration_seconds)}
                </p>
              )}
              {s.session_notes && (
                <p className="text-slate-400 text-sm mt-1">{s.session_notes}</p>
              )}
              <ul className="mt-2 space-y-1 text-sm">
                {s.exerciseNotes
                  .filter((n) => n.note)
                  .map((n) => (
                    <li key={n.exerciseName} className="text-slate-300">
                      <span className="font-medium">{n.exerciseName}:</span>{' '}
                      {n.note}
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
