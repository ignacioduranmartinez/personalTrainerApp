# Imágenes de ejercicios (subir desde la app)

Puedes **subir una foto** desde el móvil o el ordenador directamente en la app.

## Configuración en Supabase (solo la primera vez)

### 1. Crear el bucket de Storage

1. Entra en tu proyecto en [Supabase](https://supabase.com/dashboard) → **Storage**.
2. Pulsa **New bucket**.
3. **Name:** `exercise-images`
4. Activa **Public bucket** (para que las imágenes se vean en la ficha del ejercicio).
5. Guarda.

### 2. Políticas de acceso (SQL)

En **SQL Editor** ejecuta el contenido del archivo:

`supabase/migrations/20260301_storage_exercise_images.sql`

Ese SQL permite que los usuarios autenticados suban y borren solo sus propias imágenes (en una carpeta con su `user_id`).

---

## Uso en la app

1. **Gestionar** → **Editar ejercicios (vídeo y descanso)** → elige un día (Día 1, Día 2…).
2. En cada ejercicio:
   - **Subir imagen**: abre el selector de archivos (galería o carpeta) y elige una foto. Se sube a Supabase y se asigna al ejercicio.
   - **O pegar URL**: si prefieres usar un enlace a una imagen ya publicada en internet.
   - **Quitar imagen**: borra la imagen del ejercicio.

Al pulsar en el ejercicio durante un entreno (Hoy / Ver rutina), se abre la **ficha del ejercicio** con la imagen en grande.
