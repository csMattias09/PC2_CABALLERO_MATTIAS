// API de la tienda. Servidor con el módulo http de Node, sin dependencias.
const http = require('node:http')
const { PRODUCTOS, calcularTotal } = require('./src/precios')

const PORT = process.env.PORT || 3000

function responder(res, estado, cuerpo) {
  res.writeHead(estado, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(cuerpo))
}

// Log estructurado: una línea JSON por evento.
function log(level, msg, campos = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...campos }))
}

const servidor = http.createServer((req, res) => {
  const inicio = process.hrtime.bigint()
  const url = new URL(req.url, 'http://localhost')

  // Al terminar la respuesta se registra la petición con su estado y duración.
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6
    log(res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info', 'peticion', {
      method: req.method,
      path: url.pathname,
      status: res.statusCode,
      ms: Math.round(ms * 100) / 100,
    })
  })

  // Raíz: bienvenida con las rutas disponibles.
  if (url.pathname === '/') {
    return responder(res, 200, {
      mensaje: 'Bienvenido a tienda-api (PC02 - Despliegue de Aplicaciones)',
      alumno: 'Caballero Mattias',
      rutas: {
        '/health': 'Liveness: {"status":"ok"}',
        '/ready': 'Readiness: {"status":"listo"} o 503 si BASE_DE_DATOS_OK=false',
        '/productos': 'Lista de productos',
        '/total?ids=1,2&cupon=DESC10': 'Total con cupón e IGV',
      },
    })
  }

  // Liveness: el proceso está vivo.
  if (url.pathname === '/health') return responder(res, 200, { status: 'ok' })

  // Readiness: la app puede atender (depende de la base de datos).
  if (url.pathname === '/ready') {
    if (process.env.BASE_DE_DATOS_OK === 'false') {
      return responder(res, 503, { status: 'no listo', motivo: 'base de datos no disponible' })
    }
    return responder(res, 200, { status: 'listo' })
  }

  if (url.pathname === '/productos') return responder(res, 200, PRODUCTOS)

  if (url.pathname === '/total') {
    try {
      const ids = (url.searchParams.get('ids') || '').split(',').filter(Boolean).map(Number)
      const items = ids.map((id) => {
        const p = PRODUCTOS.find((x) => x.id === id)
        if (!p) throw new Error(`Producto ${id} no existe`)
        return { precio: p.precio, cantidad: 1 }
      })
      return responder(res, 200, { total: calcularTotal(items, url.searchParams.get('cupon')) })
    } catch (e) {
      return responder(res, 400, { error: e.message })
    }
  }

  return responder(res, 404, { error: 'no encontrado' })
})

servidor.listen(PORT, () => log('info', `Servidor en el puerto ${PORT}`, { port: Number(PORT) }))
