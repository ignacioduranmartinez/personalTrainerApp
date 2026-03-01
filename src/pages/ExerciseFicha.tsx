import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getExerciseById, type ExerciseRow } from '../lib/routineDb'
import { formatRestLabel } from '../lib/restTimer'

export default function ExerciseFicha() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<ExerciseRow | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    getExerciseById(id).then((row) => {
      setExercise(row ?? null)
      setError(!row)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="py-8 text-center text-slate-400">
        Cargando ejercicio...
      </div>
    )
  }

  if (error || !exercise) {
    return (
      <div className="py-8">
        <p className="text-slate-400 text-center">No se encontró el ejercicio.</p>
        <Link to="/" className="mt-4 block text-center text-sky-400 hover:underline">
          Volver a Hoy
        </Link>
      </div>
    )
  }

  const imageUrl = exercise.demo_image_url ?? null
  const videoUrl = exercise.demo_video_url ?? null

  return (
    <div className="py-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4"
      >
        ← Volver
      </button>

      <div className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
        {imageUrl ? (
          <div className="aspect-[4/3] bg-slate-900">
            <img
              src={imageUrl}
              alt={exercise.name}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] bg-slate-800/50 border-b border-slate-700 flex items-center justify-center text-slate-500 text-sm">
            Sin imagen
          </div>
        )}

        <div className="p-4">
          <h1 className="text-xl font-semibold text-white">{exercise.name}</h1>
          {(exercise.sets != null || exercise.reps || exercise.intensity) && (
            <p className="text-slate-400 text-sm mt-2">
              {exercise.sets != null && `${exercise.sets} series`}
              {exercise.sets != null && exercise.reps && ' · '}
              {exercise.reps && `${exercise.reps} repeticiones`}
              {(exercise.sets != null || exercise.reps) && exercise.intensity && ' · '}
              {exercise.intensity && (
                <span className="text-amber-400/90">{exercise.intensity}</span>
              )}
            </p>
          )}
          {exercise.rest_seconds != null && (
            <p className="text-slate-500 text-sm mt-1">
              Descanso: {formatRestLabel(exercise.rest_seconds)}
            </p>
          )}
          {exercise.notes && (
            <p className="text-slate-400 text-sm mt-2 whitespace-pre-wrap">{exercise.notes}</p>
          )}
          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-medium hover:bg-sky-500"
            >
              Ver vídeo de muestra
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
