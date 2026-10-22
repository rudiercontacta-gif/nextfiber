// =========================================================
// Integración con Gmail (Nodemailer)
// - Avisa al equipo de ventas cuando llega un nuevo registro.
// - Envía una confirmación automática al cliente, si dejó su correo.
// Requiere: GMAIL_USER, GMAIL_APP_PASSWORD, SALES_EMAIL en .env
// =========================================================
const nodemailer = require('nodemailer');
const { plainTextLines, truncate, EMPRESA, fechaHoraLima } = require('./format');

// Un solo "transportador" reutilizado (antes se creaba uno por cada correo).
let transporter = null;
function getTransporter() {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

// ---------------------------------------------------------
// Protección contra abuso de la respuesta automática.
// Cualquiera puede escribir un correo ajeno en el formulario, así que:
//  - como máximo 1 respuesta al día para una misma dirección, y
//  - como máximo 20 respuestas por hora en total.
// Así nadie puede usar tu cuenta de Gmail para enviar spam a terceros.
// ---------------------------------------------------------
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;
const MAX_AUTOREPLIES_PER_HOUR = 20;
const lastReplyByAddress = new Map();
let recentReplies = [];

function canAutoReply(correo) {
  const now = Date.now();
  recentReplies = recentReplies.filter((t) => now - t < ONE_HOUR);
  const last = lastReplyByAddress.get(correo);
  if (last && now - last < ONE_DAY) return false;
  if (recentReplies.length >= MAX_AUTOREPLIES_PER_HOUR) return false;
  lastReplyByAddress.set(correo, now);
  recentReplies.push(now);
  return true;
}

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [correo, t] of lastReplyByAddress) {
    if (now - t >= ONE_DAY) lastReplyByAddress.delete(correo);
  }
}, ONE_HOUR);
cleanup.unref();

async function notifyEmail(lead) {
  const mailer = getTransporter();
  if (!mailer) {
    console.log('[Email] Integración no configurada — se omite el envío.');
    return;
  }

  const { GMAIL_USER, SALES_EMAIL } = process.env;

  // Aviso interno al equipo de ventas ("Responder" le escribe directo al cliente)
  await mailer.sendMail({
    from: `NextFiber Web <${GMAIL_USER}>`,
    to: SALES_EMAIL || GMAIL_USER,
    replyTo: lead.correo || undefined,
    subject: `Nuevo cliente interesado: ${truncate(lead.nombre, 60)}`,
    text: plainTextLines(lead).join('\n'),
  });

  // Confirmación automática al cliente (si dejó su correo)
  if (lead.correo) {
    if (!canAutoReply(lead.correo)) {
      console.log('[Email] Respuesta automática omitida (límite antiabuso).');
      return;
    }
    await mailer.sendMail({
      from: `NextFiber <${GMAIL_USER}>`,
      to: lead.correo,
      subject: 'Recibimos tu solicitud — NextFiber',
      text:
        `Hola ${lead.nombre},\n\n` +
        `Gracias por tu interés en NextFiber. Un asesor te contactará muy pronto ` +
        `al número ${lead.telefono || 'que nos dejaste'} para coordinar tu instalación.\n\n` +
        `Si tienes alguna urgencia, escríbenos por WhatsApp al 945 835 216.\n\n` +
        `— Equipo NextFiber`,
    });
  }
}

// ---------------------------------------------------------
// Copia de la hoja de reclamación al consumidor.
// Es una obligación legal (no un correo comercial), por eso NO comparte el
// límite de las respuestas automáticas de los registros. Aun así lleva un
// tope generoso para que nadie use el formulario para escribirle a un tercero
// una y otra vez: 5 por dirección al día y 60 por hora en total.
// Si el tope se supera, el aviso interno lo indica para reenviarla a mano.
// ---------------------------------------------------------
const COPY_MAX_PER_ADDRESS_PER_DAY = 5;
const COPY_MAX_PER_HOUR = 60;
const copiesByAddress = new Map(); // correo -> [marcas de tiempo]
let recentCopies = [];

function canSendReclamoCopy(correo) {
  const now = Date.now();
  recentCopies = recentCopies.filter((t) => now - t < ONE_HOUR);
  const mine = (copiesByAddress.get(correo) || []).filter((t) => now - t < ONE_DAY);
  if (mine.length >= COPY_MAX_PER_ADDRESS_PER_DAY) return false;
  if (recentCopies.length >= COPY_MAX_PER_HOUR) return false;
  mine.push(now);
  copiesByAddress.set(correo, mine);
  recentCopies.push(now);
  return true;
}

// Hoja de reclamación completa (la recibe el consumidor y también el equipo).
function hojaReclamacionLines(reclamo, etiqueta) {
  const lineas = [
    'HOJA DE RECLAMACIÓN — LIBRO DE RECLAMACIONES VIRTUAL',
    `N.° de folio: ${reclamo.id}`,
    `Fecha y hora de registro: ${fechaHoraLima(reclamo.fecha_registro)} (hora de Perú)`,
    '',
    'PROVEEDOR',
    `Razón social: ${EMPRESA.razonSocial} (${EMPRESA.marca})`,
    `RUC: ${EMPRESA.ruc}`,
    `Domicilio: ${EMPRESA.domicilio}`,
    '',
    'IDENTIFICACIÓN DEL CONSUMIDOR',
    `Nombre: ${reclamo.consumidor}`,
    `Documento: ${reclamo.tipo_documento} ${reclamo.numero_documento}`,
    `Domicilio: ${reclamo.domicilio || '-'}`,
    `Teléfono: ${reclamo.telefono}`,
    `Correo: ${reclamo.correo}`,
  ];
  if (reclamo.es_menor_edad) lineas.push(`Padre, madre o apoderado: ${reclamo.apoderado}`);
  lineas.push(
    '',
    'IDENTIFICACIÓN DEL BIEN CONTRATADO',
    `Servicio o producto: ${reclamo.bien_contratado}`,
    `Fecha de contratación: ${reclamo.fecha_contrato || '-'}`,
    `Monto reclamado: ${reclamo.monto_reclamado || '-'}`,
    '',
    `DETALLE DEL ${etiqueta.toUpperCase()}`,
    `Tipo: ${etiqueta}`,
    `Detalle: ${reclamo.detalle}`,
    `Pedido del consumidor: ${reclamo.pedido}`
  );
  return lineas;
}

async function notifyEmailReclamo(reclamo) {
  const mailer = getTransporter();
  if (!mailer) {
    console.log('[Email] Integración no configurada — se omite el envío.');
    return;
  }

  const { GMAIL_USER, SALES_EMAIL } = process.env;
  const etiqueta = reclamo.tipo === 'queja' ? 'Queja' : 'Reclamo';
  const hoja = hojaReclamacionLines(reclamo, etiqueta);
  const copiaPermitida = canSendReclamoCopy(reclamo.correo);

  if (!copiaPermitida) {
    console.warn(`[Email] Copia del ${etiqueta.toLowerCase()} #${reclamo.id} NO enviada (tope de seguridad). Reenviarla manualmente a ${reclamo.correo}.`);
  }

  // Aviso interno al equipo ("Responder" le escribe directo al consumidor)
  const interno = mailer.sendMail({
    from: `NextFiber Web <${GMAIL_USER}>`,
    to: SALES_EMAIL || GMAIL_USER,
    replyTo: reclamo.correo,
    subject: `Nuevo ${etiqueta.toLowerCase()} #${reclamo.id} — Libro de Reclamaciones`,
    text: [
      ...hoja,
      '',
      copiaPermitida
        ? 'Copia enviada al correo del consumidor: SÍ.'
        : 'Copia enviada al correo del consumidor: NO (tope de seguridad). Reenviar manualmente.',
      'Recuerda responder dentro del plazo legal de 15 días hábiles, improrrogable.',
    ].join('\n'),
  });

  // Copia para el consumidor, con la hoja completa
  const copia = copiaPermitida
    ? mailer.sendMail({
        from: `NextFiber <${GMAIL_USER}>`,
        to: reclamo.correo,
        subject: `Copia de tu ${etiqueta.toLowerCase()} N.° ${reclamo.id} — NextFiber`,
        text: [
          `Hola ${reclamo.consumidor},`,
          '',
          `Registramos tu ${etiqueta.toLowerCase()} en el Libro de Reclamaciones Virtual de ${EMPRESA.razonSocial} (${EMPRESA.marca}). Esta es tu copia:`,
          '',
          ...hoja,
          '',
          'Te daremos respuesta en un plazo no mayor a 15 días hábiles, improrrogable.',
          'La formulación de un reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante Indecopi.',
          `Si necesitas agregar información, escríbenos por WhatsApp al 945 835 216 indicando el folio N.° ${reclamo.id}.`,
          '',
          `— ${EMPRESA.marca}`,
        ].join('\n'),
      })
    : Promise.resolve();

  // Un fallo en uno no impide el otro; si algo falla, se informa en la consola.
  const resultados = await Promise.allSettled([interno, copia]);
  const fallos = resultados.filter((r) => r.status === 'rejected').map((r) => r.reason && r.reason.message);
  if (fallos.length) throw new Error(`Envío incompleto del reclamo #${reclamo.id}: ${fallos.join(' | ')}`);
}

module.exports = { notifyEmail, notifyEmailReclamo };
