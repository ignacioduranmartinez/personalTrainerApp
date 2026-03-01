# Rutinas — App de entrenamiento

Web app (PWA) para seguir rutinas de entrenamiento, guardar notas por ejercicio y sincronizar entre dispositivos.

## Requisitos

- **Node.js 18 o 20** (recomendado 20). Con nvm: `nvm use` (hay `.nvmrc`).
- Cuenta en [Supabase](https://supabase.com)

## Instalación

1. Clonar e instalar dependencias:

   ```bash
   npm install
   ```

2. Crear proyecto en Supabase y ejecutar el esquema SQL:
   - Dashboard → SQL Editor → pegar y ejecutar el contenido de `supabase/schema.sql`.

3. Copiar variables de entorno:
   - En Supabase: Settings → API → Project URL y anon public key.
   - Copiar `.env.example` a `.env` y rellenar:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

4. Arrancar en desarrollo:

   ```bash
   npm run dev
   ```

5. Build para producción:

   ```bash
   npm run build
   ```

   La salida está en `dist/`. Para desplegar en un servicio gratuito (Vercel, Netlify, Cloudflare Pages), sigue la guía en [docs/DEPLOY.md](docs/DEPLOY.md).

## Usar desde el móvil (ella en el iPhone)

**localhost solo funciona en tu ordenador.** Para que ella use la app desde el móvil hay dos opciones:

### Opción A: Misma WiFi (desarrollo)

1. En el ordenador, arranca el servidor accesible en la red local:
   ```bash
   npm run dev:host
   ```
   Vite mostrará algo como `http://192.168.x.x:5173`.

2. En el iPhone (conectado a la **misma WiFi**), abre Safari y entra en esa URL (sustituye por la IP que te salga).

3. Para tenerla a mano: en Safari → Compartir → **“Añadir a la pantalla de inicio”**. Así se abre como app.

**Importante:** Mientras use la IP de tu casa, el ordenador debe estar encendido y con `npm run dev -- --host` en marcha. Si apagas el PC o cambias de red, esa URL deja de funcionar.

### Opción B: Desplegar en internet (recomendado)

1. Haz **build** y sube la carpeta `dist/` a un hosting (por ejemplo [Vercel](https://vercel.com) o [Netlify](https://netlify.com)), o conecta el repo para que se despliegue solo en cada push.

2. La app quedará en una URL pública (ej. `https://rutinas-xxx.vercel.app`).

3. En el iPhone, abre esa URL en Safari → Compartir → **“Añadir a la pantalla de inicio”**.

Así ella puede usarla desde cualquier sitio, sin depender de tu PC ni de la WiFi de casa.

## Rutinas

- **Crear rutina:** Rutinas → Nueva rutina (formulario por semanas y días).
- **Importar:** Rutinas → Importar JSON. Pega el JSON que te genere el asistente a partir del Word (con imágenes y enlaces a vídeos en `demo.imageUrl` y `demo.videoUrl` por ejercicio).
- **Fechas:** En el detalle de una rutina puedes asignar fecha de inicio y fin para que sea la rutina activa en “Hoy”.

## Estructura del JSON de importación

```json
{
  "name": "Rutina Marzo",
  "weeks": [
    {
      "days": [
        {
          "label": "Lunes",
          "exercises": [
            {
              "name": "Sentadilla",
              "sets": 3,
              "reps": "10",
              "intensity": "75-80%",
              "notes": "Descanso entre series: 2'",
              "demo": {
                "imageUrl": "https://...",
                "videoUrl": "https://youtube.com/..."
              }
            }
          ]
        }
      ]
    }
  ]
}
```

`label` suele ser el día de la semana (Lunes, Martes, …). `intensity` es la columna % RM / Intensidad (ej. "75-80%", "Esfuerzo moderado"). `demo` y `notes` son opcionales.
