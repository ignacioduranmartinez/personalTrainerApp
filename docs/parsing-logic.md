# Cómo se parsea tu .docx de rutina

## Estructura detectada en el documento

1. **Título:** "Seguimiento de Rutina de Entrenamiento Semanal" (y texto intro).
2. **Bloques por día:** Cada "DÍA N: Nombre" define un día. Dentro hay una tabla con:
   - Columna **EJERCICIO** (nombre, a veces con "Descanso entre series: X")
   - **SERIES** (número)
   - **REPS** (texto: "6-8", "8-10", "Fallo", etc.)
   - **% RM / INTENSIDAD** o **% RM / Carga**
   - **Ilustración:** imagen + opcional enlace a YouTube

3. **Días encontrados:**
   - DÍA 1: Tren Inferior y Core
   - DÍA 2: Empuje (Pecho, Hombro, Tríceps)
   - DÍA 3: NATACIÓN (sin tabla de ejercicios)
   - DÍA 4: Pierna Posterior y Glúteo
   - DÍA 5: Tracción (Espalda, Bíceps)

4. **Imágenes y vídeos:** El .docx tiene 26 imágenes en `word/media/`. Los enlaces a YouTube están en `word/_rels/document.xml.rels`. El orden de aparición en `document.xml` (r:embed = imagen, r:id = hipervínculo) se usa para asociar cada vídeo a un ejercicio concreto.

## Proceso de parseo

1. **Extraer texto:** Se leen los nodos `<w:t>` del `document.xml` para obtener títulos de día y filas de ejercicios (nombre, series, reps).
2. **Detectar días:** Se buscan líneas que empiezan por "DÍA N:" y se agrupa todo hasta el siguiente "DÍA".
3. **Detectar ejercicios:** Se filtran líneas que son números + nombre ("1. Sentadilla") y se ignoran cabeceras de tabla ("EJERCICIO", "SERIES", "REPS") y "Descanso entre series".
4. **Imágenes y vídeos:** Se recorre el XML en orden; cada `<w:drawing>` con `r:embed` es una imagen (se mapea a `media/imageN.png`); si justo después hay un hipervínculo `r:id`, ese enlace es el `videoUrl` de ese ejercicio. Las imágenes del .docx son locales; para la app hay que subirlas a un hosting (p. ej. Supabase Storage) y usar la URL pública como `demo.imageUrl`.

## Limitaciones

- **DÍA 3 (NATACIÓN):** No hay tabla; en el JSON se deja como día con 0 ejercicios o con un ejercicio tipo "NATACIÓN" si quieres.
- **Imágenes en la app:** El JSON que genero puede incluir `videoUrl` (los enlaces de YouTube salen del .docx). Las imágenes no tienen URL hasta que las subas a un sitio; en el JSON se puede dejar `imageUrl` vacío o que tú las subas y me pases las URLs para incluirlas.
