// =========================================================
// Integración con Telegram (Bot API)
// Envía una notificación al chat/grupo del equipo cuando
// se registra un nuevo cliente potencial.
// Requiere: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID en .env
//
// Se usa el modo HTML y se escapa cada dato del cliente. Antes se usaba
// Markdown sin escapar: un correo como juan_perez@gmail.com (con "_")
// hacía que Telegram rechazara el mensaje y el aviso se perdía.
// =========================================================
const { escapeHTML, truncate, fullAddress, whatsappUrl, originName } = require('./format');

async function notifyTelegram(lead) {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('[Telegram] Integración no configurada — se omite el envío.');
    return;
  }

  const wa = whatsappUrl(lead.telefono);
  const lineas = [
    '📥 <b>Nuevo registro NextFiber</b>',
    `<b>Nombre:</b> ${escapeHTML(lead.nombre)}`,
    `<b>Teléfono:</b> ${escapeHTML(lead.telefono || 'No proporcionado')}${
      wa ? ` · <a href="${wa}">abrir WhatsApp</a>` : ''
    }`,
    `<b>Correo:</b> ${escapeHTML(lead.correo || '-')}`,
    `<b>Dirección:</b> ${escapeHTML(fullAddress(lead) || '-')}`,
    `<b>Plan de interés:</b> ${escapeHTML(lead.plan_interes || 'No especificado')}`,
  ];
  if (lead.mensaje) lineas.push(`<b>Mensaje:</b> ${escapeHTML(truncate(lead.mensaje, 500))}`);
  lineas.push(`<b>Origen:</b> ${escapeHTML(originName(lead.origen))}`);

  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: lineas.join('\n'),
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Telegram API respondió ${res.status}: ${errText}`);
  }
}

async function notifyTelegramReclamo(reclamo) {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('[Telegram] Integración no configurada — se omite el envío.');
    return;
  }

  const wa = whatsappUrl(reclamo.telefono);
  const etiqueta = reclamo.tipo === 'queja' ? 'Queja' : 'Reclamo';
  const lineas = [
    `📕 <b>Nuevo ${etiqueta} — Libro de Reclamaciones</b>`,
    `<b>Consumidor:</b> ${escapeHTML(reclamo.consumidor)}`,
    `<b>Documento:</b> ${escapeHTML(reclamo.tipo_documento)} ${escapeHTML(reclamo.numero_documento)}`,
    `<b>Teléfono:</b> ${escapeHTML(reclamo.telefono)}${wa ? ` · <a href="${wa}">abrir WhatsApp</a>` : ''}`,
    `<b>Correo:</b> ${escapeHTML(reclamo.correo || '-')}`,
    `<b>Servicio:</b> ${escapeHTML(reclamo.bien_contratado)}`,
    `<b>Detalle:</b> ${escapeHTML(truncate(reclamo.detalle, 600))}`,
    `<b>Pedido:</b> ${escapeHTML(truncate(reclamo.pedido, 400))}`,
  ];

  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: lineas.join('\n'),
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Telegram API respondió ${res.status}: ${errText}`);
  }
}

module.exports = { notifyTelegram, notifyTelegramReclamo };
