// =========================================================
// Integración con WhatsApp (Meta Cloud API)
// Envía un mensaje de texto al número del equipo de ventas
// cada vez que se registra un nuevo cliente potencial.
// Requiere: WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_TO en .env
//
// IMPORTANTE: la API de WhatsApp Cloud solo entrega mensajes de texto
// libre si el número de destino (WHATSAPP_TO) le escribió al número de la
// empresa en las últimas 24 horas. Para avisos garantizados hay que usar
// una plantilla aprobada por Meta (mensaje de tipo "template").
// =========================================================
const { plainTextLines } = require('./format');

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v19.0';

async function notifyWhatsApp(lead) {
  const { WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_TO } = process.env;

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID || !WHATSAPP_TO) {
    console.log('[WhatsApp] Integración no configurada — se omite el envío.');
    return;
  }

  const texto = ['📥 *Nuevo registro NextFiber*', ...plainTextLines(lead)].join('\n');

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: WHATSAPP_TO,
      type: 'text',
      text: { body: texto },
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`WhatsApp API respondió ${res.status}: ${errText}`);
  }
}

module.exports = { notifyWhatsApp };
