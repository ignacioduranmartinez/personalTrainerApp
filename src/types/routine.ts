/** Ejercicio con opcional imagen + enlace a vídeo de muestra */
export interface ExerciseDemo {
  imageUrl?: string
  videoUrl?: string
}

export interface Exercise {
  id?: string
  name: string
  sets?: number
  reps?: string
  /** % RM / Intensidad (ej. "75-80%", "Esfuerzo moderado") */
  intensity?: string
  /** Descanso entre series en segundos (para temporizador) */
  restSeconds?: number
  notes?: string
  demo?: ExerciseDemo
}

export interface DaySchedule {
  label: string
  exercises: Exercise[]
}

export interface WeekSchedule {
  days: DaySchedule[]
}

export interface Routine {
  id?: string
  name: string
  weeks: WeekSchedule[]
  startDate?: string
  endDate?: string
  createdAt?: string
  userId?: string
}

/** Una sesión registrada en el calendario (rutina lineal) */
export interface WorkoutLog {
  id: string
  user_id: string
  routine_id: string
  for_date: string
  routine_day_index: number
  session_notes: string | null
  created_at: string
  /** null = sesión empezada pero no finalizada; con valor = sesión finalizada */
  finished_at: string | null
  /** Cuándo se pulsó "Empezar este entrenamiento" */
  started_at?: string | null
  /** Duración en segundos (desde started_at hasta finished_at); solo cuando está finalizada */
  duration_seconds?: number | null
}

/** Sesión pasada con notas por ejercicio (para histórico) */
export interface PastSession {
  for_date: string
  session_notes: string | null
  duration_seconds: number | null
  exerciseNotes: Array< { exerciseName: string; note: string | null } >
}

/** Formato JSON para importar rutina (sin IDs) */
export interface RoutineImportJSON {
  name: string
  weeks: Array<{
    days: Array<{
      label: string
      exercises: Array<{
        name: string
        sets?: number
        reps?: string
        intensity?: string
        restSeconds?: number
        notes?: string
        demo?: ExerciseDemo
      }>
    }>
  }>
}
