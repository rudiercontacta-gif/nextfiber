// =========================================================
// Utilidades compartidas para armar el texto de las notificaciones.
// =========================================================
// Datos del proveedor (aparecen en la hoja de reclamación y en los correos).
const EMPRESA = {
  razonSocial: 'GRUPO ANTEL E.I.R.L.',
  ruc: '20602947000',
  marca: 'NextFiber',
  domicilio: 'La Victoria A-28, San Sebastián, Cusco, Perú',
};

// Fecha y hora en horario de Perú, sin importar la zona del servidor.
function fechaHoraLima(fecha) {
  const d = fecha ? new Date(fecha) : new Date();
  return d.toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'long', timeStyle: 'short' });
}

const ORIGIN_NAMES = {
  registro: 'Formulario de registro',
  verificador_hero: 'Verificador de cobertura (inicio)',
  verificador_cobertura: 'Verificador de cobertura (sección Cobertura)',
  facebook_messenger: 'Facebook Messenger',
};

function originName(origen) {
  return ORIGIN_NAMES[origen] || origen || 'desconocido';
}

// Escapa los caracteres especiales para el modo HTML de Telegram.
function escapeHTML(texto) {
  return String(texto === null || texto === undefined ? '' : texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function truncate(texto, max) {
  const t = String(texto === null || texto === undefined ? '' : texto);
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

// "Av. La Cultura 123 (Dpto. 301)"
function fullAddress(lead) {
  if (!lead.direccion) return '';
  return lead.dpto ? `${lead.direccion} (Dpto. ${lead.dpto})` : lead.direccion;
}

// Enlace directo a WhatsApp si el número es un celular peruano.
function whatsappUrl(telefono) {
  return /^9\d{8}$/.test(telefono || '') ? `https://wa.me/51${telefono}` : null;
}

// Líneas de texto plano, usadas por el correo y por WhatsApp.
function plainTextLines(lead) {
  return [
    `Nombre: ${lead.nombre}`,
    `Teléfono: ${lead.telefono || 'No proporcionado'}`,
    `Correo: ${lead.correo || '-'}`,
    `Dirección: ${fullAddress(lead) || '-'}`,
    `Plan de interés: ${lead.plan_interes || 'No especificado'}`,
    `Mensaje: ${lead.mensaje ? truncate(lead.mensaje, 500) : '-'}`,
    `Origen: ${originName(lead.origen)}`,
  ];
}

module.exports = { EMPRESA, fechaHoraLima, escapeHTML, truncate, fullAddress, whatsappUrl, originName, plainTextLines };
