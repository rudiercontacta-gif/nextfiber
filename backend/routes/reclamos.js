const express = require('express');
const db = require('../db/database');
const { validateReclamo } = require('../lib/validation-reclamos');
const { createRateLimiter } = require('../middleware/rate-limit');
const { requireAdmin } = require('../middleware/admin-auth');
const { notifyTelegramReclamo } = require('../integrations/telegram');
const { notifyEmailReclamo } = require('../integrations/email');

const router = express.Router();

const ESTADOS = ['pendiente', 'atendido'];

const insertReclamo = db.prepare(`
  INSERT INTO reclamos (
    tipo, consumidor, tipo_documento, numero_documento, domicilio, telefono, correo,
    es_menor_edad, apoderado, bien_contratado, fecha_contrato, monto_reclamado, detalle, pedido
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const listReclamos = db.prepare('SELECT * FROM reclamos ORDER BY id DESC');
const updateRespuesta = db.prepare(
  "UPDATE reclamos SET estado = ?, respuesta = ?, respondido_en = datetime('now','localtime') WHERE id = ?"
);

const reclamosRateLimit = createRateLimiter({
  windows: [
    { ms: 15 * 60 * 1000, max: 5 },
    { ms: 24 * 60 * 60 * 1000, max: 15 },
  ],
  message:
    'Recibimos muchas solicitudes desde tu conexión. Intenta más tarde o escríbenos por WhatsApp al 945 835 216.',
});

router.post('/', reclamosRateLimit, (req, res) => {
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};

  if (typeof body.sitio_web === 'string' && body.sitio_web.trim() !== '') {
    console.warn(`[Antispam] Envío descartado (campo trampa) desde ${req.ip}`);
    return res.status(201).json({ ok: true });
  }

  const { reclamo, error } = validateReclamo(body);
  if (error) return res.status(400).json({ error });

  const info = insertReclamo.run(
    reclamo.tipo,
    reclamo.consumidor,
    reclamo.tipo_documento,
    reclamo.numero_documento,
    reclamo.domicilio,
    reclamo.telefono,
    reclamo.correo,
    reclamo.es_menor_edad,
    reclamo.apoderado,
    reclamo.bien_contratado,
    reclamo.fecha_contrato,
    reclamo.monto_reclamado,
    reclamo.detalle,
    reclamo.pedido
  );
  reclamo.id = Number(info.lastInsertRowid);
  reclamo.fecha_registro = new Date().toISOString();

  notifyTelegramReclamo(reclamo).catch((err) => console.error('[Telegram]', err.message));
  notifyEmailReclamo(reclamo).catch((err) => console.error('[Email]', err.message));

  res.status(201).json({ ok: true, folio: reclamo.id });
});

router.get('/', requireAdmin, (req, res) => {
  res.json(listReclamos.all());
});

router.patch('/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'El id del registro no es válido.' });
  }

  const estado = req.body && req.body.estado;
  const respuesta = typeof (req.body && req.body.respuesta) === 'string' ? req.body.respuesta.slice(0, 2000) : '';
  if (!ESTADOS.includes(estado)) {
    return res.status(400).json({ error: `Estado no válido. Usa uno de: ${ESTADOS.join(', ')}.` });
  }

  const result = updateRespuesta.run(estado, respuesta || null, id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'No existe un registro con ese id.' });
  }
  res.json({ ok: true });
});

module.exports = router;
