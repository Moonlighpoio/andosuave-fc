# AndoSuave Bot (WhatsApp)

Bot de WhatsApp del club **AndoSuave FC**. Vive dentro del repositorio del sitio
(`bot/`) para que sitio y bot se versionen y desplieguen juntos.

- **Recordatorios de multas** automáticos en el grupo (cron, sin IA).
- **Listas de partidos** con horarios establecidos (comandos en el grupo).
- **Asistente del club por WhatsApp**: responde lo mismo que el chat web del sitio
  (`!consulta <pregunta>` o escribiendo una pregunta suelta), usando `CHAT_REGLAS`
  y `NORMAS` de `../config.js`.
- **Actualiza la página** desde WhatsApp: edita `config.js`, hace commit y push —
  GitHub Pages se regenera solo.

## Stack

| Pieza | Herramienta | Costo |
|---|---|---|
| Bot WhatsApp | Node.js + `@whiskeysockets/baileys` (no oficial) | Gratis |
| Schedule/recordatorios | `node-cron` (local) | Gratis |
| Alojamiento 24/7 | Oracle Cloud Free Tier (VM ARM) | Gratis |
| Editar/actualizar sitio | Git + `config.js` (push al repo) | Gratis |

## Comandos

| Comando | Quién | Qué hace |
|---|---|---|
| `!ayuda` | todos | Lista de comandos |
| `!consulta <pregunta>` | todos | Responde como el asistente del sitio (horarios, cuota, bajas, normas…) |
| *(mensaje suelto que matchee una regla)* | todos | El bot responde solo si hay regla, sin spamear |
| `!horarios` | todos | Días, horas y canchas |
| `!proximo` | todos | Próximo partido y cuántos van |
| `!lista` / `!anotar` / `!salir` | todos | Lista de convocados |
| `!cerrar` / `!abrir` / `!borrar-lista` | admin | Estado de la lista |
| `!multas` | todos | Multas pendientes |
| `!multa add <monto> <nombre> <motivo>` | admin | Registrar multa |
| `!multa pay <id>` / `!multa undo <id>` / `!multa rm <id>` | admin | Gestionar multas |
| `!cambiar-horario <dia> <hora> <lugar>` | admin | Actualiza horarios y **publica la página** |
| `!publicar` | admin | Sube cambios pendientes al sitio |
| `!sincronizar` | admin | Baja lo último del sitio |
| `!ver-pagina` | admin | Estado actual de la página |
| `!grupo` | admin | Devuelve el ID del grupo (para GROUP_ID) |

## Recordatorios automáticos

| Cuándo (zona horaria `America/Santiago`) | Qué |
|---|---|
| Todos los días, hora configurable (default 19:00) | Multas pendientes + datos del tesorero |
| Lunes y jueves 11:30 | "La convocatoria cierra a las 12:00" + lista actual |
| Lunes y jueves 12:10 | Cierra la lista y publica los anotados |
| Lunes y jueves 19:30 | "Partido hoy 20:00" + quiénes van |

## Probarlo en tu Mac (dentro del repo)

```bash
cd bot
cp .env.example .env
# edita .env: ADMIN_NUMBERS=569XXXX (tu número admin), DATA_DIR=bot/data, SITE_DIR=..
npm install
npm start
```

Escanea el QR (o usa `PAIRING_NUMBER`) con el **número externo**, luego escribe
`!ayuda` a ese número desde tu WhatsApp. El bot responde en cualquier grupo/chat
hasta que definas `GROUP_ID`.

> `DATA_DIR=bot/data` guarda el estado fuera del repo (gitignore) y
> `SITE_DIR=..` hace que el bot edite el `config.js` del sitio en el raíz.

## Despliegue en Oracle Cloud Free Tier

1. **Crear cuenta**: https://signup.oraclecloud.com (te pide tarjeta solo para verificar; usa siempre los recursos *Always Free*).
2. **Crear VM**: Compute → Instances → Create. Imagen *Ubuntu 24.04* (ARM). Revisa que quede dentro de *Always Free* (4 OCPU ARM + 24 GB RAM).
3. **SSH**: conecta con `ssh ubuntu@<IP>`.
4. **Clonar el repo** (que ya trae el bot):
   ```bash
   git clone https://github.com/Moonlighpoio/andosuave-fc ~/andosuave-fc
   cd ~/andosuave-fc/bot
   bash setup-oracle.sh
   ```
5. El script pide llenar `.env` (`ADMIN_NUMBERS`, `GROUP_ID`, `PAIRING_NUMBER`,
   `DATA_DIR=bot/data`, `SITE_DIR=..`) y arranca con pm2.

### Token de GitHub (para que el bot haga push a la página)

1. GitHub → Settings → Developer settings → **Fine-grained personal access token**.
2. Repository access: **Only select repositories** → `Moonlighpoio/andosuave-fc`.
3. Permissions → Repository permissions → **Contents: Read and write**.
4. Copia el token a `GITHUB_TOKEN` en `.env`.

## Advertencias

- Baileys es **no oficial**: hay un riesgo bajo de bloqueo temporal del número si
  WhatsApp detecta tráfico no estándar. Por eso se usa un **número externo**.
- La sesión se guarda en `bot/data/session/`. Si cierran la sesión, borra esa
  carpeta y vuelve a escanear.
- `bot/data/db.json` concentra multas y listas. Hazle copia con regularidad.

## Estructura

```
bot/
  src/
    index.js      arranque (conecta todo)
    whatsapp.js   conexión Baileys (QR / pairing, reconexión)
    commands.js   manejador de comandos
    chat.js       asistente del club (reutiliza CHAT_REGLAS del sitio)
    scheduler.js  recordatorios con node-cron
    multas.js     estado y lógica de multas
    listas.js     estado y lógica de listas de partidos
    site.js       edición del config.js del sitio + git push
    store.js      base simple de datos JSON
    config.js     configuración (lee .env)
    helpers.js    utilidades (normalizar, teléfonos, montos)
  setup-oracle.sh depliegue en Oracle Cloud Free
```