// =========================================================
// NextFiber — Servidor principal
// Sirve el sitio web (frontend), la API de registros (leads)
// y el webhook de Facebook Messenger.
// =========================================================
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const leadsRouter = require('./routes/leads');
const reclamosRouter = require('./routes/reclamos');
const facebookWebhook = require('./integrations/facebook');
const { securityHeaders } = require('./middleware/security-headers');
const { errorHandler } = require('./middleware/error-handler');

const app = express();
const PORT = process.env.PORT || 3000;

// No anunciar a los visitantes que el servidor usa Express.
app.disable('x-powered-by');

// IP real del visitante cuando el sitio está detrás de un proxy (Render,
// Railway, Nginx...). La usa el límite de envíos. Ver TRUST_PROXY en .env.example.
app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));

// Cabeceras de seguridad en todas las respuestas.
app.use(securityHeaders);

// CORS: por defecto la API solo acepta peticiones desde este mismo dominio.
// Si algún día el sitio vive en otro dominio, agrégalo en ALLOWED_ORIGINS.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use('/api', cors({ origin: allowedOrigins.length ? allowedOrigins : false }));

// API de registros (base de datos de clientes). Máximo 10 KB por envío.
app.use('/api', express.json({ limit: '10kb' }));
app.use('/api/leads', leadsRouter);
app.use('/api/reclamos', reclamosRouter);
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

// Webhook de Facebook Messenger. Se guarda el cuerpo "crudo" de la petición
// para poder verificar la firma de Meta (cabecera X-Hub-Signature-256).
app.use(
  '/webhook/facebook',
  express.json({
    limit: '200kb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
  facebookWebhook
);

// Panel simple de administración (ver /backend/admin/leads.html)
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Sitio web público (carpeta ../frontend)
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

// Errores: se registran en la consola, pero al visitante nunca se le
// muestran detalles internos del servidor.
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n✅ NextFiber corriendo en http://localhost:${PORT}`);
  console.log(`   Sitio web:        http://localhost:${PORT}`);
  console.log(`   Panel de admin:   http://localhost:${PORT}/admin/leads.html`);
  console.log(`   Libro de reclam.: http://localhost:${PORT}/admin/reclamos.html`);
  console.log(`   API de registros: http://localhost:${PORT}/api/leads\n`);
  checkConfiguration();
});

// ---------------------------------------------------------
// TRUST_PROXY vacío  -> confía solo en proxies de red privada (Render, Railway,
//                       Nginx en el mismo servidor). Es la opción segura por defecto.
// TRUST_PROXY=1      -> confía en 1 proxy delante (número de saltos).
// TRUST_PROXY=false  -> no hay proxy: la IP es la de la conexión directa.
// ---------------------------------------------------------
function parseTrustProxy(value) {
  if (value === undefined || value.trim() === '') return 'loopback, linklocal, uniquelocal';
  const v = value.trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^\d+$/.test(v)) return Number(v);
  return v;
}

// Avisos en la consola al arrancar, para detectar configuraciones inseguras.
function checkConfiguration() {
  const warnings = [];
  const adminToken = process.env.ADMIN_TOKEN || '';

  if (!adminToken) {
    warnings.push('ADMIN_TOKEN está vacío: el panel de administración queda desactivado.');
  } else if (adminToken.length < 24) {
    warnings.push('ADMIN_TOKEN es muy corto. Usa al menos 24 caracteres aleatorios (ver .env.example).');
  }
  if (process.env.NODE_ENV !== 'production') {
    warnings.push('NODE_ENV no es "production". En el servidor publicado ponlo en production.');
  }
  if (!process.env.VERIFY_TOKEN || !process.env.FB_APP_SECRET) {
    warnings.push('Webhook de Facebook desactivado (faltan VERIFY_TOKEN y/o FB_APP_SECRET).');
  }
  warnings.forEach((w) => console.warn(`⚠️  ${w}`));
}
