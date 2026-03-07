import type { Routine, DaySchedule } from '../types/routine'

/** Devuelve los días de la rutina en orden lineal (secuencia: día 1, día 2, ... sin relación con el día de la semana). */
export function getLinearDays(routine: Routine): DaySchedule[] {
  return routine.weeks.flatMap((w) => w.days)
}

/** Etiqueta numérica por índice: "Día 1", "Día 2", ... */
export function getDayDisplayLabel(linearIndex: number): string {
  return `Día ${linearIndex + 1}`
}

/** Etiqueta a mostrar: usa el nombre del día de la rutina si existe, si no "Día N". */
export function getDayLabel(days: DaySchedule[], index: number): string {
  const day = days[index]
  const name = day?.label?.trim()
  return name || getDayDisplayLabel(index)
}
