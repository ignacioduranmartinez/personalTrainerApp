import { supabase } from './supabase'

const BUCKET = 'exercise-images'

/** Sanitiza el nombre de archivo para la ruta en Storage */
function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
}

/**
 * Sube una imagen para un ejercicio. La guarda en exercise-images/{userId}/{exerciseId}/{timestamp}-{nombre}.
 * Devuelve la URL pública o un error.
 */
export async function uploadExerciseImage(
  exerciseId: string,
  file: File
): Promise<{ url: string } | { error: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '.jpg'
  const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, '')) || 'imagen'
  const path = `${user.id}/${exerciseId}/${Date.now()}-${baseName}${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false
  })

  if (error) return { error: error.message }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl }
}
