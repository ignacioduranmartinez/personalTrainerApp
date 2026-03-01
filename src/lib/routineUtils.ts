import type { Routine, DaySchedule } from '../types/routine'

/** Devuelve los días de la rutina en orden lineal (Día 1, Día 2, ...) */
export function getLinearDays(routine: Routine): DaySchedule[] {
  return routine.weeks.flatMap((w) => w.days)
}

/** Etiqueta de visualización para un día por su índice lineal: "Día 1", "Día 2", ... */
export function getDayDisplayLabel(linearIndex: number): string {
  return `Día ${linearIndex + 1}`
}
