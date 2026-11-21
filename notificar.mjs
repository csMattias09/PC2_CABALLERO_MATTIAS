// Envía el resultado del pipeline a Slack mediante un Incoming Webhook.
// Uso:
//   node notificar.mjs exito
//   node notificar.mjs error "detalle opcional"
// La URL del webhook se lee SOLO de la variable de entorno SLACK_WEBHOOK_URL.
import { readFileSync } from 'node:fs'

const [estado = '', ...resto] = process.argv.slice(2)
const detalle = resto.join(' ') || 'sin detalle'

const webhook = process.env.SLACK_WEBHOOK_URL
if (!webhook) {
  console.error('Falta la variable de entorno SLACK_WEBHOOK_URL.')
  process.exit(1)
}

if (!['exito', 'error'].includes(estado)) {
  console.error('Uso: node notificar.mjs <exito|error> ["detalle opcional"]')
  process.exit(1)
}

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })

const titulo = estado === 'exito'
  ? ':white_check_mark: *ÉXITO*: las pruebas pasaron'
  : ':x: *ERROR*: el pipeline falló'

const lineas = [
  titulo,
  `Proyecto: ${pkg.name} v${pkg.version}`,
  `Detalle: ${detalle}`,
  `Fecha: ${fecha}`,
]
if (process.env.ALUMNO) lineas.push(`Alumno: ${process.env.ALUMNO}`)

try {
  const respuesta = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: lineas.join('\n') }),
  })
  if (!respuesta.ok) {
    console.error(`Slack respondió con estado ${respuesta.status}.`)
    process.exit(1)
  }
  console.log(`Notificación enviada a Slack (${estado}).`)
} catch (e) {
  console.error(`No se pudo contactar a Slack: ${e.message}`)
  process.exit(1)
}
