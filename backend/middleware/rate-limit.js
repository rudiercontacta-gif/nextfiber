// =========================================================
// Límite de envíos por IP (sin dependencias externas).
// Cada "ventana" define cuántas peticiones se aceptan en un periodo.
// Los contadores viven en memoria: se reinician si el servidor se reinicia.
// =========================================================
function createRateLimiter({ windows, message }) {
  const hits = new Map(); // ip -> [marcas de tiempo, de la más antigua a la más reciente]
  const longestWindow = Math.max(...windows.map((w) => w.ms));

  // Limpieza periódica para que la memoria no crezca sin control
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, stamps] of hits) {
      const recent = stamps.filter((t) => now - t < longestWindow);
      if (recent.length) hits.set(ip, recent);
      else hits.delete(ip);
    }
  }, 10 * 60 * 1000);
  cleanup.unref();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const ip = req.ip || 'desconocida';
    const stamps = (hits.get(ip) || []).filter((t) => now - t < longestWindow);

    for (const { ms, max } of windows) {
      const inWindow = stamps.filter((t) => now - t < ms);
      if (inWindow.length >= max) {
        const retryAfter = Math.max(1, Math.ceil((inWindow[0] + ms - now) / 1000));
        hits.set(ip, stamps);
        res.setHeader('Retry-After', String(retryAfter));
        return res.status(429).json({ error: message });
      }
    }

    stamps.push(now);
    hits.set(ip, stamps);
    next();
  };
}

module.exports = { createRateLimiter };
