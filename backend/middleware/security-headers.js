// =========================================================
// Cabeceras de seguridad (equivalente liviano de "helmet").
//
// IMPORTANTE: si agregas al sitio un servicio externo nuevo (Google
// Analytics, píxel de Facebook, un chat, un mapa distinto, etc.), tienes
// que añadir su dominio en la directiva que corresponda de
// CONTENT_SECURITY_POLICY. Si no, el navegador lo bloqueará.
// =========================================================
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  // Leaflet (mapas de las sedes) se carga desde unpkg.com
  "script-src 'self' https://unpkg.com",
  // 'unsafe-inline': el HTML y los widgets usan estilos en línea
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  // Teselas de OpenStreetMap para los mapas
  "img-src 'self' data: https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://unpkg.com",
  "media-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

function securityHeaders(req, res, next) {
  res.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  // Evita que el navegador "adivine" el tipo de contenido (clave contra XSS)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Evita que otros sitios muestren el tuyo dentro de un iframe
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  // Solo cuando el sitio ya se sirve por HTTPS: obliga a usar siempre HTTPS
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000');
  }
  next();
}

module.exports = { securityHeaders, CONTENT_SECURITY_POLICY };
