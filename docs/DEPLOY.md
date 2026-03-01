# Despliegue gratuito de la app

Puedes desplegar la app en un hosting estático gratuito. Todas estas opciones tienen plan free y sirven para una SPA como esta.

## 1. Crear el proyecto en GitHub

Así tendrás el código en la nube y podrás conectar ese repo con Vercel para que se despliegue solo en cada push.

### Desde cero (proyecto aún sin Git)

1. **Crea un repositorio en GitHub**
   - Entra en [github.com](https://github.com) y, si hace falta, crea una cuenta.
   - Clic en **+** → **New repository**.
   - **Repository name:** por ejemplo `personalTrainerApp`.
   - Elige **Private** o **Public**.
   - No marques “Add a README” (el proyecto ya tiene archivos).
   - Clic en **Create repository**.

2. **Sube el proyecto desde tu ordenador**
   En la terminal, desde la carpeta del proyecto (`personalTrainerApp`):

   ```bash
   cd /ruta/a/personalTrainerApp

   git init
   git add .
   git commit -m "Initial commit: app rutinas + Supabase"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/personalTrainerApp.git
   git push -u origin main
   ```

   Sustituye `TU_USUARIO` por tu usuario de GitHub y `personalTrainerApp` por el nombre del repo si lo cambiaste.

3. **Comprueba que no subes secretos**
   - El archivo `.env` (con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`) no debe subirse. El `.gitignore` del proyecto ya lo excluye.
   - Si en el pasado hiciste `git add .env`, bórralo del historial o no lo incluyas en el primer commit.

### Si ya tienes Git en el proyecto

Si ya hiciste `git init` y tienes commits:

```bash
git remote add origin https://github.com/TU_USUARIO/personalTrainerApp.git
git branch -M main
git push -u origin main
```

---

### Sin usar la terminal: GitHub Desktop + Vercel web

Si prefieres no usar la línea de comandos:

1. **Crear el repositorio en GitHub (desde el navegador)**  
   - Entra en [github.com](https://github.com) e inicia sesión.  
   - **+** → **New repository**.  
   - Nombre: `personalTrainerApp` (o el que quieras).  
   - Elige **Private** o **Public**.  
   - **No** marques “Add a README file”.  
   - **Create repository**.

2. **Instalar GitHub Desktop**  
   - Descarga desde [desktop.github.com](https://desktop.github.com) e instálalo.  
   - Inicia sesión con tu cuenta de GitHub (**File → Options → Accounts**).

3. **Clonar el repo vacío con GitHub Desktop**  
   - En GitHub Desktop: **File → Clone repository**.  
   - Pestaña **GitHub.com** → elige el repo que acabas de crear (ej. `personalTrainerApp`).  
   - En **Local path** elige una carpeta (ej. `Documents`).  
   - **Clone**. Se creará una carpeta con el nombre del repo, casi vacía.

4. **Copiar tu proyecto dentro de la carpeta clonada**  
   - Abre la carpeta que se acaba de crear (ej. `Documents/personalTrainerApp`).  
   - **Copia dentro** todo el contenido de tu proyecto actual **excepto** la carpeta `node_modules` y el archivo `.env` (no hace falta subirlos).  
   - Es decir: copia `src`, `public`, `index.html`, `package.json`, `vite.config.ts`, `docs`, `supabase`, `.gitignore`, etc.  
   - No copies `node_modules` ni `.env`.

5. **Subir los cambios a GitHub**  
   - Vuelve a **GitHub Desktop**. Verás todos los archivos nuevos como cambios.  
   - Abajo a la izquierda escribe un mensaje, por ejemplo: *Initial commit: app rutinas*.  
   - Pulsa **Commit to main**.  
   - Luego **Push origin** (arriba) para subir todo a GitHub.

6. **Conectar con Vercel (todo desde el navegador)**  
   - Entra en [vercel.com](https://vercel.com) e inicia sesión con **Continue with GitHub**.  
   - **Add New… → Project** → importa el repositorio `personalTrainerApp`.  
   - Añade las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.  
   - **Deploy**.

A partir de ahí, cada vez que quieras actualizar la app: abre el proyecto en GitHub Desktop, haz **Commit** y **Push origin**; Vercel desplegará solo.

---

## 2. Conectar GitHub con Vercel

1. Entra en [vercel.com](https://vercel.com) e inicia sesión (con **Continue with GitHub**).
2. **Add New…** → **Project**.
3. **Import** el repositorio `personalTrainerApp` (o el nombre que le hayas puesto). Si no sale, autoriza a Vercel para ver tus repos de GitHub.
4. **Configure Project:**
   - **Framework Preset:** Vite (Vercel suele detectarlo).
   - **Root Directory:** `.` (raíz del repo).
   - **Build Command:** `npm run build` (por defecto).
   - **Output Directory:** `dist` (por defecto en Vite).
5. **Environment Variables** — añade estas dos (y usa los valores de tu proyecto Supabase):
   - `VITE_SUPABASE_URL` = tu URL de Supabase (ej. `https://xxxx.supabase.co`)
   - `VITE_SUPABASE_ANON_KEY` = tu anon key (clave pública)
6. Clic en **Deploy**.

Cuando termine, tendrás una URL tipo `https://personal-trainer-app-xxx.vercel.app`. Esa es la URL de la app en producción.

### Despliegues automáticos

Cada vez que hagas `git push` a la rama que conectaste (p. ej. `main`), Vercel volverá a hacer build y desplegará la nueva versión.

---

## Requisitos previos (build local)

1. **Build de la app:** en la raíz del proyecto:
   ```bash
   npm run build
   ```
   Se genera la carpeta `dist/` con los archivos estáticos.

2. **Variables de entorno en producción:** tu app usa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. En cada servicio hay que configurarlas para el **build** (no solo en tu `.env` local).

---

## Opción 1: Vercel (muy sencillo)

1. Crea cuenta en [vercel.com](https://vercel.com) (con GitHub).
2. **Import Project** → conecta el repositorio donde está este proyecto (o sube la carpeta).
3. **Framework Preset:** Vite. **Root Directory:** `.` (o la raíz del repo).
4. **Environment Variables:** añade:
   - `VITE_SUPABASE_URL` = tu URL de Supabase  
   - `VITE_SUPABASE_ANON_KEY` = tu anon key  
5. **Deploy.** Vercel hará `npm run build` y publicará la salida.
6. La URL será algo como `https://personal-trainer-app-xxx.vercel.app`. Esa es la que usas en el móvil.

**Ventajas:** Plan gratuito generoso, despliegue automático al hacer push, HTTPS y CDN incluidos.

---

## Opción 2: Netlify

1. Crea cuenta en [netlify.com](https://netlify.com).
2. **Add new site → Import an existing project** → conecta Git (GitHub/GitLab) o arrastra la carpeta `dist/` si no usas Git.
3. Si conectas el repo:
   - **Build command:** `npm run build`  
   - **Publish directory:** `dist`  
   - **Environment variables:** en Site settings → Environment variables añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Deploy. La URL será tipo `https://nombre-site.netlify.app`.

**Ventajas:** Gratis, fácil, buenos formularios y funciones si más adelante quieres ampliar.

---

## Opción 3: Cloudflare Pages

1. Crea cuenta en [pages.cloudflare.com](https://pages.cloudflare.com).
2. **Create project** → **Connect to Git** → elige el repo.
3. **Build settings:**
   - **Framework preset:** None (o Vite si lo ofrecen).
   - **Build command:** `npm run build`  
   - **Build output directory:** `dist`  
4. **Environment variables** (en el proyecto): `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (Variables and Secrets).
5. Deploy. URL tipo `https://nombre.pages.dev`.

**Ventajas:** Plan free amplio, buena velocidad global.

---

## Después del despliegue

- Abre la URL en el móvil (Safari en iPhone).
- **Compartir → Añadir a la pantalla de inicio** para usarla como app.
- Esa URL pública es la que usa todo el mundo (tú y tu mujer) con la misma cuenta; los datos siguen en Supabase.

## Nota

El plan gratuito de estos servicios suele bastar para uso personal. Si un día superas límites (ancho de banda, builds), te avisan; para una app de rutinas el uso suele ser bajo.
