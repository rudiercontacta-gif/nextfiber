// =========================================================
// Rutas de la API de registros (leads)
//   POST  /api/leads       -> registra un nuevo cliente potencial (público)
//   GET   /api/leads       -> lista todos los registros (panel admin)
//   PATCH /api/leads/:id   -> cambia el estado de un registro (panel admin)
// =========================================================
const express = require('express');
const db = require('../db/database');
const { validateLead } = require('../lib/validation');
const { createRateLimiter } = require('../middleware/rate-limit');
const { requireAdmin } = require('../middleware/admin-auth');
const { notifyWhatsApp } = require('../integrations/whatsapp');
const { notifyEmail } = require('../integrations/email');
const { notifyTelegram } = require('../integrations/telegram');

const router = express.Router();

const ESTADOS = ['nuevo', 'contactado', 'en_proceso', 'instalado', 'descartado'];

const insertLead = db.prepare(`
  INSERT INTO leads (nombre, telefono, correo, direccion, dpto, plan_interes, mensaje, origen)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const listLeads = db.prepare('SELECT * FROM leads ORDER BY id DESC');
const updateEstado = db.prepare('UPDATE leads SET estado = ? WHERE id = ?');

// Máximo 8 envíos cada 15 minutos y 40 al día por conexión (IP).
const leadsRateLimit = createRateLimiter({
  windows: [
    { ms: 15 * 60 * 1000, max: 8 },
    { ms: 24 * 60 * 60 * 1000, max: 40 },
  ],
  message:
    'Recibimos muchas solicitudes desde tu conexión. Intenta más tarde o escríbenos por WhatsApp al 945 835 216.',
});

// ---------- Crear un nuevo registro ----------
router.post('/', leadsRateLimit, (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};

  // Campo trampa (antispam): es invisible para las personas, así que si
  // llega con texto lo llenó un robot. Respondemos "ok" para no darle pistas,
  // pero no se guarda nada ni se envía ninguna notificación.
  if (typeof body.sitio_web === 'string' && body.sitio_web.trim() !== '') {
    console.warn(`[Antispam] Envío descartado (campo trampa) desde ${req.ip}`);
    return res.status(201).json({ ok: true });
  }

  const { lead, error } = validateLead(body);
  if (error) return res.status(400).json({ error });

  const info = insertLead.run(
    lead.nombre,
    lead.telefono,
    lead.correo,
    lead.direccion,
    lead.dpto,
    lead.plan_interes,
    lead.mensaje,
    lead.origen
  );
  lead.id = Number(info.lastInsertRowid);

  // Las notificaciones se disparan en segundo plano: si una falla
  // (por ejemplo, porque no configuraste esa integración todavía),
  // el registro del cliente en la base de datos NO se ve afectado.
  notifyWhatsApp(lead).catch((err) => console.error('[WhatsApp]', err.message));
  notifyEmail(lead).catch((err) => console.error('[Email]', err.message));
  notifyTelegram(lead).catch((err) => console.error('[Telegram]', err.message));

  res.status(201).json({ ok: true });
});

// ---------- Listar todos los registros (panel admin) ----------
router.get('/', requireAdmin, (req, res) => {
  res.json(listLeads.all());
});

// ---------- Actualizar el estado de un registro ----------
router.patch('/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'El id del registro no es válido.' });
  }

  const estado = req.body && req.body.estado;
  if (!ESTADOS.includes(estado)) {
    return res.status(400).json({ error: `Estado no válido. Usa uno de: ${ESTADOS.join(', ')}.` });
  }

  const result = updateEstado.run(estado, id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'No existe un registro con ese id.' });
  }
  res.json({ ok: true });
});

module.exports = router;
