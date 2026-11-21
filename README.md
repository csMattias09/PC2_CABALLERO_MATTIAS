# tienda-api (PC02 - Despliegue de Aplicaciones)

API de ejemplo sin dependencias. Requiere Node.js 20 o superior.

    npm test            # ejecuta las pruebas
    npm run test:cov    # pruebas con cobertura
    npm start           # inicia el servidor en el puerto 3000 (o en $PORT)
    node verificar.mjs  # autoverificación de la parte práctica
    npm run pipeline    # pruebas y notificación a Slack (requiere SLACK_WEBHOOK_URL)

## Rutas

| Ruta | Descripción |
|---|---|
| `GET /health` | Liveness: `200 {"status":"ok"}` |
| `GET /ready` | Readiness: `200 {"status":"listo"}`; `503` si `BASE_DE_DATOS_OK=false` |
| `GET /productos` | Lista de productos |
| `GET /total?ids=1,2&cupon=DESC10` | Total con cupón (no distingue mayúsculas) e IGV |

Cada petición escribe en consola una línea JSON con `ts`, `level`, `msg`, `method`, `path`, `status` y `ms`.

## Notificación a Slack

El webhook **no** se guarda en el repositorio: se pasa por variable de entorno.

PowerShell:

    $env:SLACK_WEBHOOK_URL="URL_ENTREGADA_POR_EL_DOCENTE"
    $env:ALUMNO="Apellido Nombre"
    npm run pipeline

En GitHub Actions (`.github/workflows/ci.yml`) se toma de `secrets.SLACK_WEBHOOK_URL`
(Settings → Secrets and variables → Actions → New repository secret).

## Versionado y rollback

- `v1.0.0`: versión estable.
- `v1.1.0`: nueva versión publicada.
- Rollback con `git revert` del commit de `v1.1.0`: `HEAD` vuelve a la versión 1.0.0.

## Despliegue en la nube

- **Plataforma:** Render (Web Service)
- **URL pública:** _pendiente: https://TU-SERVICIO.onrender.com_
- **Verificación:** `https://TU-SERVICIO.onrender.com/health` → `{"status":"ok"}`

Configuración usada en Render:

| Campo | Valor |
|---|---|
| Runtime | Node |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

El servidor toma el puerto de la variable `PORT` que asigna Render.
