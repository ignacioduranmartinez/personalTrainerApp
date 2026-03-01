import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveRoutine } from '../lib/routineDb'
import type { RoutineImportJSON } from '../types/routine'

export default function RoutineImport() {
  const navigate = useNavigate()
  const [raw, setRaw] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    let data: RoutineImportJSON
    try {
      data = JSON.parse(raw) as RoutineImportJSON
    } catch {
      setError('El JSON no es válido.')
      return
    }
    if (!data.name || !Array.isArray(data.weeks)) {
      setError('El JSON debe tener "name" y "weeks" (array).')
      return
    }
    setSaving(true)
    saveRoutine(data)
      .then((id) => {
        if (id) navigate('/routines')
        else setError('No se pudo guardar.')
      })
      .finally(() => setSaving(false))
  }

  return (
    <div className="py-4">
      <h1 className="text-xl font-semibold text-white mb-2">Importar rutina desde JSON</h1>
      <p className="text-slate-400 text-sm mb-4">
        Pega aquí el JSON de la rutina (el que te pase el asistente a partir del Word).
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder='{"name": "Rutina Marzo", "weeks": [...]}'
          rows={12}
          className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white font-mono text-sm placeholder-slate-500 focus:ring-2 focus:ring-sky-500 resize-y"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-500 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Importar'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/routines')}
            className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
