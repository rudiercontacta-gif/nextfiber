// =========================================================
// Integración con Facebook Messenger (webhook)
//
// Meta NO permite que una página le escriba primero a un usuario de
// Messenger: el cliente debe escribirle primero a la Página de Facebook.
// Por eso esta integración funciona como un "webhook":
//   1) El cliente escribe a la Página de NextFiber en Messenger.
//   2) Meta reenvía ese mensaje aquí (POST /webhook/facebook).
//   3) Se guarda el contacto como un lead (uno solo por persona).
//   4) Se le responde automáticamente con un saludo (solo la primera vez).
//
// Requiere en .env: VERIFY_TOKEN, FB_APP_SECRET y FB_PAGE_TOKEN.
// Si falta VERIFY_TOKEN o FB_APP_SECRET, el webhook queda desactivado.
// Configura el webhook en developers.facebook.com apuntando a:
//   https://tu-dominio.com/webhook/facebook
// =========================================================
const crypto = require('crypto');
const express = require('express');
const db = require('../db/database');
const { safeEqual } = require('../lib/safe-compare');
const { notifyWhatsApp } = require('./whatsapp');
const { notifyEmail } = require('./email');
const { notifyTelegram } = require('./telegram');

const router = express.Router();
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v19.0';

const findByPsid = db.prepare('SELECT id, mensaje FROM leads WHERE fb_psid = ? ORDER BY id DESC LIMIT 1');
const appendMessage = db.prepare('UPDATE leads SET mensaje = ? WHERE id = ?');
const insertLead = db.prepare(`
  INSERT INTO leads (nombre, telefono, correo, direccion, dpto, plan_interes, mensaje, origen, fb_psid)
  VALUES ('Contacto de Facebook Messenger', NULL, NULL, NULL, NULL, NULL, ?, 'facebook_messenger', ?)
`);

// ---------- Verificación del webhook (Meta la hace con GET, una vez) ----------
router.get('/', (req, res) => {
  const { VERIFY_TOKEN } = process.env;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (!VERIFY_TOKEN) {
    console.warn('[Facebook] Falta VERIFY_TOKEN en .env: webhook desactivado.');
    return res.sendStatus(403);
  }

  // El "challenge" se devuelve como texto plano (nunca como HTML) y solo si
  // tiene el formato que usa Meta. Antes se devolvía como HTML y permitía
  // inyectar código (XSS) en el mismo dominio del panel de administración.
  if (
    mode === 'subscribe' &&
    typeof token === 'string' &&
    safeEqual(token, VERIFY_TOKEN) &&
    typeof challenge === 'string' &&
    /^[A-Za-z0-9_-]{1,128}$/.test(challenge)
  ) {
    console.log('[Facebook] Webhook verificado correctamente.');
    return res.status(200).type('text/plain').send(challenge);
  }
  res.sendStatus(403);
});

// ---------- Mensajes entrantes de Messenger ----------
router.post('/', (req, res) => {
  const { FB_APP_SECRET } = process.env;
  if (!FB_APP_SECRET) {
    console.warn('[Facebook] Falta FB_APP_SECRET en .env: se rechazan los mensajes del webhook.');
    return res.sendStatus(403);
  }
  // Solo aceptamos peticiones firmadas por Meta con el secreto de tu app.
  if (!hasValidSignature(req.rawBody, req.get('x-hub-signature-256'), FB_APP_SECRET)) {
    console.warn(`[Facebook] Firma inválida: petición rechazada (${req.ip}).`);
    return res.sendStatus(403);
  }

  const body = req.body || {};
  if (body.object !== 'page') return res.sendStatus(404);

  // Meta espera una respuesta rápida; el procesamiento sigue después.
  res.sendStatus(200);

  for (const entry of Array.isArray(body.entry) ? body.entry : []) {
    for (const event of Array.isArray(entry.messaging) ? entry.messaging : []) {
      try {
        handleMessage(event);
      } catch (err) {
        console.error('[Facebook] Error procesando un mensaje:', err.message);
      }
    }
  }
});

function handleMessage(event) {
  const psid = event && event.sender && event.sender.id;
  const message = event && event.message;
  const texto = message && typeof message.text === 'string' ? message.text.trim() : '';
  // is_echo: son los mensajes que envía la propia Página (incluida nuestra
  // respuesta automática). No deben guardarse como clientes.
  if (!psid || !texto || message.is_echo) return;

  const mensaje = texto.slice(0, 1000);
  const existing = findByPsid.get(String(psid));

  if (existing) {
    // Misma persona escribiendo otra vez: se agrega al registro que ya existe
    // y no se le repite la respuesta automática.
    const combinado = `${existing.mensaje || ''}\n---\n${mensaje}`.slice(-2000);
    appendMessage.run(combinado, existing.id);
    return;
  }

  const info = insertLead.run(mensaje, String(psid));
  const lead = {
    id: Number(info.lastInsertRowid),
    nombre: 'Contacto de Facebook Messenger',
    mensaje,
    origen: 'facebook_messenger',
  };

  notifyWhatsApp(lead).catch((err) => console.error('[WhatsApp]', err.message));
  notifyEmail(lead).catch((err) => console.error('[Email]', err.message));
  notifyTelegram(lead).catch((err) => console.error('[Telegram]', err.message));

  replyOnMessenger(
    psid,
    '¡Hola! Gracias por escribirnos a NextFiber 👋. Un asesor te responderá en breve. ' +
      'Si prefieres, también puedes escribirnos por WhatsApp al 945 835 216.'
  ).catch((err) => console.error('[Facebook] Error respondiendo:', err.message));
}

// Verifica la cabecera X-Hub-Signature-256 = "sha256=" + HMAC(cuerpo, FB_APP_SECRET)
function hasValidSignature(rawBody, header, secret) {
  if (!rawBody || typeof header !== 'string' || !header.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const received = header.slice('sha256='.length);
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received, 'utf8'), Buffer.from(expected, 'utf8'));
}

async function replyOnMessenger(recipientId, mensaje) {
  const { FB_PAGE_TOKEN } = process.env;
  if (!FB_PAGE_TOKEN) {
    console.log('[Facebook] Integración no configurada — no se envía respuesta.');
    return;
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/me/messages?access_token=${encodeURIComponent(FB_PAGE_TOKEN)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: mensaje },
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Messenger API respondió ${res.status}: ${errText}`);
  }
}

module.exports = router;
