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
        className="mt-2 min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-600 active:bg-slate-600 touch-manipulation"
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
    <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-amber-900/40 px-4 py-2.5 min-h-[44px] text-sm font-mono text-amber-200">
      <span>⏱ {display}</span>
      <button
        type="button"
        onClick={() => {
          setRunning(false)
          if (intervalRef.current) clearInterval(intervalRef.current)
        }}
        className="min-h-[36px] px-2 py-1 text-sm text-slate-400 hover:text-white active:text-white touch-manipulation"
      >
        Parar
      </button>
    </div>
  )
}
