/**
 * Parsea el descanso entre series desde las notas del ejercicio.
 * Ej: "Descanso entre series: 2'" -> 120, "90''" -> 90, "60''" -> 60
 */
export function parseRestSecondsFromNotes(notes: string | undefined): number | null {
  if (!notes) return null
  const secondsMatch = notes.match(/(\d+)''/)
  if (secondsMatch) return parseInt(secondsMatch[1], 10)
  const minutesMatch = notes.match(/(\d+)'/)
  if (minutesMatch) return parseInt(minutesMatch[1], 10) * 60
  return null
}

export function formatRestLabel(seconds: number): string {
  if (seconds >= 60) return `${seconds / 60} min`
  return `${seconds} s`
}

/** Formatea duración en segundos para mostrar (ej. "45 min", "1 h 12 min") */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} s`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h} h ${m} min` : `${h} h`
}
