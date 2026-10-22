// =========================================================
// Protección de las rutas de administración (listar y actualizar registros).
// - Compara la clave en tiempo constante.
// - Bloquea temporalmente una IP tras varios intentos fallidos,
//   para que nadie pueda adivinar ADMIN_TOKEN probando claves.
// =========================================================
const { safeEqual } = require('../lib/safe-compare');

const FAIL_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 10;
const failures = new Map(); // ip -> [marcas de tiempo de intentos fallidos]

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [ip, stamps] of failures) {
    const recent = stamps.filter((t) => now - t < FAIL_WINDOW_MS);
    if (recent.length) failures.set(ip, recent);
    else failures.delete(ip);
  }
}, FAIL_WINDOW_MS);
cleanup.unref();

function requireAdmin(req, res, next) {
  // Los datos de clientes nunca deben quedar guardados en cachés
  res.setHeader('Cache-Control', 'no-store');

  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return res
      .status(503)
      .json({ error: 'Panel desactivado: falta configurar ADMIN_TOKEN en el servidor.' });
  }

  const now = Date.now();
  const ip = req.ip || 'desconocida';
  const recent = (failures.get(ip) || []).filter((t) => now - t < FAIL_WINDOW_MS);
  if (recent.length >= MAX_FAILS) {
    res.setHeader('Retry-After', String(Math.ceil((recent[0] + FAIL_WINDOW_MS - now) / 1000)));
    return res
      .status(429)
      .json({ error: 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.' });
  }

  const token = req.get('x-admin-token') || '';
  if (!safeEqual(token, expected)) {
    recent.push(now);
    failures.set(ip, recent);
    return res.status(401).json({ error: 'No autorizado.' });
  }

  failures.delete(ip);
  next();
}

module.exports = { requireAdmin };
