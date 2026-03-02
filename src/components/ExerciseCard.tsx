import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useExerciseNotes } from '../hooks/useExerciseNotes'
import { updateExerciseDemo, updateExerciseRest } from '../lib/routineDb'
import { uploadExerciseImage } from '../lib/exerciseImageStorage'
import { RestTimer } from './RestTimer'
import { formatRestLabel } from '../lib/restTimer'
import type { Exercise } from '../types/routine'

interface ExerciseCardProps {
  exercise: Exercise
  forDate: string
  routineExerciseId?: string
  /** Si es false (vista entrenamiento), no se muestran enlaces para editar vídeo ni descanso */
  editable?: boolean
  /** Llamado tras guardar o quitar vídeo/imagen (para refetch en Gestionar) */
  onDemoUpdated?: () => void
}

const QUICK_REST = [30, 60, 90, 120]

export function ExerciseCard({ exercise, forDate, routineExerciseId, editable = false, onDemoUpdated }: ExerciseCardProps) {
  const [showNotes, setShowNotes] = useState(false)
  const [showEditDemo, setShowEditDemo] = useState(false)
  const [showEditImage, setShowEditImage] = useState(false)
  const [showEditRest, setShowEditRest] = useState(false)
  const [demoVideoUrl, setDemoVideoUrl] = useState(exercise.demo?.videoUrl ?? '')
  const [demoImageUrl, setDemoImageUrl] = useState(exercise.demo?.imageUrl ?? '')
  const [restSeconds, setRestSeconds] = useState<number | null>(exercise.restSeconds ?? null)
  const [savingDemo, setSavingDemo] = useState(false)
  const [savingImage, setSavingImage] = useState(false)
  const [uploadImageError, setUploadImageError] = useState<string | null>(null)
  const [removeVideoError, setRemoveVideoError] = useState<string | null>(null)
  const [savingRest, setSavingRest] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { note, setNote, saveNote, saving } = useExerciseNotes(routineExerciseId ?? null, forDate)

  const displayVideoUrl = (demoVideoUrl || exercise.demo?.videoUrl) ?? ''
  const hasVideo = displayVideoUrl.length > 0
  const displayImageUrl = demoImageUrl || exercise.demo?.imageUrl
  const hasDemo = displayImageUrl || displayVideoUrl
  const displayRestSeconds = restSeconds ?? exercise.restSeconds

  useEffect(() => {
    if (!showEditDemo) setDemoVideoUrl(exercise.demo?.videoUrl ?? '')
    if (!showEditImage) setDemoImageUrl(exercise.demo?.imageUrl ?? '')
  }, [exercise.demo?.videoUrl, exercise.demo?.imageUrl, showEditDemo, showEditImage])

  function openDemo() {
    const url = displayVideoUrl || exercise.demo?.videoUrl
    if (url && String(url).trim()) window.open(url, '_blank', 'noopener')
  }

  async function handleSaveDemo() {
    if (!routineExerciseId) return
    setSavingDemo(true)
    const { error } = await updateExerciseDemo(routineExerciseId, { videoUrl: demoVideoUrl || null })
    setSavingDemo(false)
    if (!error) setShowEditDemo(false)
  }

  async function handleSaveImage() {
    if (!routineExerciseId) return
    setSavingImage(true)
    const { error } = await updateExerciseDemo(routineExerciseId, { imageUrl: demoImageUrl || null })
    setSavingImage(false)
    if (!error) setShowEditImage(false)
  }

  async function handleRemoveImage() {
    if (!routineExerciseId) return
    setSavingImage(true)
    setUploadImageError(null)
    const { error } = await updateExerciseDemo(routineExerciseId, { imageUrl: null })
    setSavingImage(false)
    if (error) {
      setUploadImageError(error)
      return
    }
    setDemoImageUrl('')
    setShowEditImage(false)
    onDemoUpdated?.()
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !routineExerciseId) return
    if (!file.type.startsWith('image/')) {
      setUploadImageError('Elige un archivo de imagen (JPG, PNG, etc.)')
      return
    }
    setUploadImageError(null)
    setSavingImage(true)
    const result = await uploadExerciseImage(routineExerciseId, file)
    setSavingImage(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if ('error' in result) {
      setUploadImageError(result.error)
      return
    }
    setDemoImageUrl(result.url)
    const { error } = await updateExerciseDemo(routineExerciseId, { imageUrl: result.url })
    if (!error) setShowEditImage(false)
  }

  async function handleRemoveVideo(e?: React.MouseEvent) {
    e?.preventDefault()
    e?.stopPropagation()
    if (!routineExerciseId) return
    setRemoveVideoError(null)
    setSavingDemo(true)
    const { error } = await updateExerciseDemo(routineExerciseId, { videoUrl: null })
    setSavingDemo(false)
    if (error) {
      setRemoveVideoError(error)
      return
    }
    setDemoVideoUrl('')
    setShowEditDemo(false)
    onDemoUpdated?.()
  }

  async function handleSaveRest() {
    if (!routineExerciseId) return
    setSavingRest(true)
    const { error } = await updateExerciseRest(routineExerciseId, restSeconds)
    setSavingRest(false)
    if (!error) setShowEditRest(false)
  }

  const linkToFicha = !editable && routineExerciseId ? `/exercise/${routineExerciseId}` : null

  return (
    <article className="rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
      <div className="p-4">
        <div className="flex gap-3">
          {displayImageUrl && (
            linkToFicha ? (
              <Link
                to={linkToFicha}
                className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-700 border border-slate-600 block"
              >
                <img
                  src={displayImageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </Link>
            ) : hasVideo ? (
              <button
                type="button"
                onClick={openDemo}
                className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-700 border border-slate-600"
              >
                <img
                  src={displayImageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ) : (
              <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-700 border border-slate-600">
                <img
                  src={displayImageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )
          )}
          <div className="flex-1 min-w-0">
            {linkToFicha ? (
              <Link to={linkToFicha} className="block group">
                <h3 className="font-semibold text-white group-hover:text-sky-300">{exercise.name}</h3>
              </Link>
            ) : (
              <h3 className="font-semibold text-white">{exercise.name}</h3>
            )}
            {(exercise.sets != null || exercise.reps || exercise.intensity) && (
              <p className="text-slate-400 text-sm mt-0.5">
                {exercise.sets != null && `${exercise.sets} series`}
                {exercise.sets != null && exercise.reps && ' · '}
                {exercise.reps && `${exercise.reps} repeticiones`}
                {(exercise.sets != null || exercise.reps) && exercise.intensity && ' · '}
                {exercise.intensity && (
                  <span className="text-amber-400/90" title="% RM / Intensidad">
                    {exercise.intensity}
                  </span>
                )}
              </p>
            )}
            <RestTimer
              restSeconds={displayRestSeconds ?? undefined}
              notes={exercise.notes}
            />
            {!displayImageUrl && hasVideo && (
              <span className="mt-2 inline-flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={openDemo}
                  className="text-sm text-sky-400 hover:underline"
                >
                  Ver vídeo de muestra
                </button>
                {editable && routineExerciseId && (
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    disabled={savingDemo}
                    className="rounded px-2 py-0.5 text-xs text-red-400 hover:bg-red-400/20 hover:text-red-300 disabled:opacity-50 border border-red-400/50"
                    title="Quitar vídeo"
                  >
                    Quitar vídeo
                  </button>
                )}
              </span>
            )}
            {hasDemo && displayImageUrl && hasVideo && (
              <span className="mt-2 inline-flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={openDemo}
                  className="text-sm text-sky-400 hover:underline"
                >
                  Ver vídeo de muestra
                </button>
                {editable && routineExerciseId && (
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    disabled={savingDemo}
                    className="rounded px-2 py-0.5 text-xs text-red-400 hover:bg-red-400/20 hover:text-red-300 disabled:opacity-50 border border-red-400/50"
                    title="Quitar vídeo"
                  >
                    Quitar vídeo
                  </button>
                )}
              </span>
            )}
            {editable && routineExerciseId && (
              <>
                {!showEditDemo ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditDemo(true)
                        setDemoVideoUrl(demoVideoUrl || (exercise.demo?.videoUrl ?? ''))
                      }}
                      className="block text-xs text-slate-500 hover:text-slate-400"
                    >
                      {hasVideo ? 'Editar enlace al vídeo' : 'Añadir enlace al vídeo de muestra'}
                    </button>
                    {hasVideo && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveVideo(e)}
                          disabled={savingDemo}
                          className="mt-1 block text-xs text-red-400 hover:text-red-300 hover:underline disabled:opacity-50"
                        >
                          Quitar vídeo
                        </button>
                        {removeVideoError && (
                          <p className="mt-1 text-xs text-red-400">{removeVideoError}</p>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      type="url"
                      value={demoVideoUrl}
                      onChange={(e) => setDemoVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/..."
                      className="flex-1 min-w-0 rounded bg-slate-900 border border-slate-600 px-2 py-1.5 text-sm text-white placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveDemo}
                      disabled={savingDemo}
                      className="rounded bg-sky-600 px-2 py-1.5 text-xs text-white hover:bg-sky-500 disabled:opacity-50"
                    >
                      {savingDemo ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowEditDemo(false); setDemoVideoUrl(exercise.demo?.videoUrl ?? '') }}
                      className="text-xs text-slate-500 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                {!showEditImage ? (
                  <div className="mt-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={savingImage}
                      className="rounded bg-sky-600 px-3 py-1.5 text-xs text-white hover:bg-sky-500 disabled:opacity-50"
                    >
                      {savingImage ? 'Subiendo...' : 'Subir imagen'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditImage(true)
                        setDemoImageUrl(demoImageUrl || (exercise.demo?.imageUrl ?? ''))
                        setUploadImageError(null)
                      }}
                      className="ml-2 text-xs text-slate-500 hover:text-slate-400"
                    >
                      O pegar URL
                    </button>
                    {uploadImageError && (
                      <p className="mt-1 text-xs text-red-400">{uploadImageError}</p>
                    )}
                    {displayImageUrl && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveImage() }}
                        disabled={savingImage}
                        className="mt-1 block text-xs text-red-400 hover:text-red-300 hover:underline disabled:opacity-50"
                      >
                        Quitar imagen
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      type="url"
                      value={demoImageUrl}
                      onChange={(e) => setDemoImageUrl(e.target.value)}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="flex-1 min-w-0 rounded bg-slate-900 border border-slate-600 px-2 py-1.5 text-sm text-white placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveImage}
                      disabled={savingImage}
                      className="rounded bg-sky-600 px-2 py-1.5 text-xs text-white hover:bg-sky-500 disabled:opacity-50"
                    >
                      {savingImage ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowEditImage(false); setDemoImageUrl(exercise.demo?.imageUrl ?? ''); setUploadImageError(null) }}
                      className="text-xs text-slate-500 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                {!showEditRest ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditRest(true)
                      setRestSeconds(restSeconds ?? exercise.restSeconds ?? null)
                    }}
                    className="mt-1 block text-xs text-slate-500 hover:text-slate-400"
                  >
                    {displayRestSeconds != null
                      ? `Editar descanso (${formatRestLabel(displayRestSeconds)})`
                      : 'Añadir tiempo de descanso'}
                  </button>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500">Descanso (seg):</span>
                    <input
                      type="number"
                      min={0}
                      value={restSeconds ?? ''}
                      onChange={(e) => setRestSeconds(e.target.value ? parseInt(e.target.value, 10) : null)}
                      placeholder="ej. 90"
                      className="w-20 rounded bg-slate-900 border border-slate-600 px-2 py-1.5 text-sm text-white"
                    />
                    {QUICK_REST.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRestSeconds(s)}
                        className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-600"
                      >
                        {formatRestLabel(s)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleSaveRest}
                      disabled={savingRest}
                      className="rounded bg-sky-600 px-2 py-1.5 text-xs text-white hover:bg-sky-500 disabled:opacity-50"
                    >
                      {savingRest ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowEditRest(false); setRestSeconds(exercise.restSeconds ?? null) }}
                      className="text-xs text-slate-500 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-700">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="text-sm text-slate-400 hover:text-white"
          >
            {showNotes ? 'Ocultar notas' : 'Notas'}
          </button>
          {showNotes && (
            <div className="mt-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={() => routineExerciseId && saveNote(note)}
                placeholder="Escribe aquí tus notas del ejercicio..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-sky-500 resize-none"
              />
              {saving && <span className="text-xs text-slate-500">Guardando...</span>}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
