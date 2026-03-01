import { useState, useEffect, useRef } from 'react'
import { parseRestSecondsFromNotes, formatRestLabel } from '../lib/restTimer'

interface RestTimerProps {
  /** Si está definido, se usa directamente; si no, se parsea desde notes */
  restSeconds?: number | null
  notes?: string
  onComplete?: () => void
}

export function RestTimer({ restSeconds: restSec, notes, onComplete }: RestTimerProps) {
  const totalSeconds = restSec != null && restSec > 0 ? restSec : parseRestSecondsFromNotes(notes)
  const [running, setRunning] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!running || remaining <= 0) return
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          intervalRef.current = null
          setRunning(false)
          onComplete?.()
          try {
            if (typeof window !== 'undefined' && window.AudioContext) {
              const ctx = new window.AudioContext()
              const o = ctx.createOscillator()
              const g = ctx.createGain()
              o.connect(g)
              g.connect(ctx.destination)
              g.gain.value = 0.2
              o.frequency.value = 800
              o.start()
              o.stop(ctx.currentTime + 0.2)
            }
          } catch (_) {}
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, onComplete])

  if (totalSeconds == null || totalSeconds <= 0) return null

  function start() {
    setRemaining(totalSeconds!)
    setRunning(true)
  }

  if (!running) {
    return (
      <button
        type="button"
        onClick={start}
        className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-600"
      >
        <span aria-hidden>⏱</span>
        Temporizador {formatRestLabel(totalSeconds)}
      </button>
    )
  }

  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  const display = `${m}:${String(s).padStart(2, '0')}`

  return (
    <div className="mt-1.5 inline-flex items-center gap-2 rounded-lg bg-amber-900/40 px-2.5 py-1.5 text-sm font-mono text-amber-200">
      <span>⏱ {display}</span>
      <button
        type="button"
        onClick={() => {
          setRunning(false)
          if (intervalRef.current) clearInterval(intervalRef.current)
        }}
        className="text-xs text-slate-400 hover:text-white"
      >
        Parar
      </button>
    </div>
  )
}
