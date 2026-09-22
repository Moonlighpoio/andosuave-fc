# AndoSuave FC · Zona de miembros

Sitio del club de fútbol AndoSuave FC: portada pública, zona de miembros
(reglamento, horarios y chat), login por usuario y panel de administración.

## Estructura

| Archivo | Descripción |
|---|---|
| `index.html` | Portada + login/registro + app (SPA) |
| `styles.css` | Estilos y diseño responsive |
| `config.js` | **Todos los datos del club** (nombre, horarios, cuota, reglamento, chat, llaves) |
| `app.js` | Lógica del sitio (modo demo + Supabase) |
| `logo.jpg` | Logo del equipo |
| `supabase/schema.sql` | Esquema de la base de datos (ejecutar en Supabase) |
| `supabase/functions/delete-member/` | Edge Function para la baja real de miembros |
| `bot/` | **Bot de WhatsApp del club** (misma fuente de datos en `config.js`) |

## Modos de funcionamiento

- **Demo**: si `SUPABASE.url` y `SUPABASE.anonKey` están vacíos, usa `localStorage`
  del navegador (para probar sin servidor).
- **Producción**: al llenar esas dos llaves en `config.js`, pasa automáticamente a
  usar Supabase (usuarios reales en la nube, panel real, bajas reales).

---

## Configurar Supabase (base de datos real)

### 1. Crear el proyecto
1. Entra a https://supabase.com → **Start your project** (puedes loguear con GitHub).
2. Crea un **nuevo proyecto**, nombre sugerido: `andosuave-fc`.
3. Región: **South America (São Paulo)** (cerca de Chile).
4. Guarda bien la **contraseña de la base de datos** (es la única que usa la BD,
   no hay que escribirla en el código).

### 2. Crear el esquema
1. En la consola de Supabase ve a **SQL Editor → New query**.
2. Edita la línea del correo admin en `supabase/schema.sql`:
   reemplaza `'ADMIN_DEL_CLUB@EJEMPLO.COM'` por el correo único del administrador.
3. Pega todo el contenido de `supabase/schema.sql` y pulsa **Run**.
   Debe terminar en **"Success"**.

### 3. Login sin confirmación de correo (opcional pero recomendado)
1. **Authentication → Providers → Email**.
2. Desactiva **"Confirm email"** para que los miembros entren al instante
   (si la dejas activa, deberán confirmar un link por correo al registrarse).

### 4. Publicar la Edge Function (baja de miembros)
Desde el terminal, dentro de `club-futbol`:
```bash
npm i -g supabase        # o usa npx en su lugar
supabase login           # pega el access token de tu cuenta (Settings → Access Tokens)
supabase link --project-ref tu-referencia-del-proyecto
supabase functions deploy delete-member
```
> La referencia del proyecto aparece en la URL del dashboard: `supabase.com/dashboard/project/<referencia>`.

### 5. Conectar el sitio
1. En Supabase: **Settings → API**, copia `Project URL` y `anon public`.
2. Pásalos junto con el **correo del administrador** para llenar `config.js`:
   - `CLUB.adminEmail` = correo único del administrador (debe coincidir con el del schema).
   - `SUPABASE.url` = `https://xxxx.supabase.co`
   - `SUPABASE.anonKey` = la clave `anon public` (es segura y pública).
3. Publicar el sitio en GitHub Pages (repo `andosuave-fc`), como con el CV.

## Publicar en GitHub Pages
```bash
git init -b main
git add -A && git commit -m "AndoSuave FC"
gh repo create andosuave-fc --public --source=. --push
```
Luego en GitHub: **repo → Settings → Pages → branch `main`** (o vía API/gh).

## Bot de WhatsApp

El asistente que ves en el el chat también responde por WhatsApp
(`!consulta <pregunta>` o escribiendo la pregunta directamente). El bot vive en
`bot/`, reutiliza los datos de `config.js` (horarios, cuota, reglamento, chat) y
puede actualizar la página desde WhatsApp. Ver `bot/README.md`.

## Seguridad (importante)
- La **clave anónima** es pública por diseño; la seguridad la dan las políticas
  **RLS** del schema (los no logueados no leen nada; los miembros solo su perfil;
  el panel solo para admins).
- La **clave de servicio** nunca se publica: vive solo dentro de la Edge Function.
- Al eliminar un miembro el panel usa la Edge Function, que verifica que quien
  llama sea administrador antes de borrar.