// =========================================================
// Validación y limpieza de los datos que llegan desde los formularios.
// Todo lo que viene del navegador se considera NO confiable:
// se revisa el tipo, se recorta el largo y se normaliza el teléfono.
// =========================================================
const PLANES = ['Start', 'Familiar + TV', 'Pro + TV', 'Ultra + TV', 'Max + TV', 'Empresas', 'No estoy seguro'];
const ORIGENES = ['registro', 'verificador_hero', 'verificador_cobertura'];

const CAMPOS = {
  nombre: { etiqueta: 'Nombre', max: 80 },
  telefono: { etiqueta: 'Teléfono', max: 20 },
  correo: { etiqueta: 'Correo', max: 120 },
  direccion: { etiqueta: 'Dirección', max: 200 },
  dpto: { etiqueta: 'Dpto.', max: 20 },
  mensaje: { etiqueta: 'Mensaje', max: 1000, multilinea: true },
};

// Detecta enlaces o dominios (se bloquean en el nombre porque el nombre
// aparece en el correo automático que se le envía al cliente).
const PARECE_ENLACE =
  /(https?:|www\.|:\/\/|\b[a-z0-9-]+\.(com|net|org|pe|info|biz|xyz|ru|top|io|co|me|site|online|link|app|shop)\b)/i;

function readText(datos, campo) {
  const { etiqueta, max, multilinea } = CAMPOS[campo];
  const valor = datos[campo];
  if (valor === undefined || valor === null) return { valor: '' };
  if (typeof valor !== 'string') return { error: `El campo "${etiqueta}" no es válido.` };

  let limpio = multilinea
    ? valor
        .replace(/\r\n?/g, '\n')
        .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
        .replace(/\n{3,}/g, '\n\n')
    : valor.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ');
  limpio = limpio.trim();

  if (limpio.length > max) {
    return { error: `El campo "${etiqueta}" es demasiado largo (máximo ${max} caracteres).` };
  }
  return { valor: limpio };
}

// Deja solo los dígitos y quita el código de país (+51) si lo escribieron.
function normalizePhone(texto) {
  let digitos = String(texto || '').replace(/\D/g, '');
  if (digitos.startsWith('0051')) digitos = digitos.slice(4);
  else if (digitos.startsWith('51') && digitos.length === 11) digitos = digitos.slice(2);
  return digitos;
}

// Celular peruano (9 dígitos, empieza con 9) o fijo con código de ciudad
// (8 dígitos, con o sin el 0 inicial). Ej.: 987654321, 084535299, 12345678.
function isValidPhone(digitos) {
  return /^9\d{8}$/.test(digitos) || /^0?[1-8]\d{7}$/.test(digitos);
}

function validateLead(datos) {
  const leidos = {};
  for (const campo of Object.keys(CAMPOS)) {
    const resultado = readText(datos, campo);
    if (resultado.error) return { error: resultado.error };
    leidos[campo] = resultado.valor;
  }

  const origen = ORIGENES.includes(datos.origen) ? datos.origen : 'desconocido';

  if (!leidos.telefono) {
    return { error: 'Necesitamos tu celular o WhatsApp para poder contactarte.' };
  }
  const telefono = normalizePhone(leidos.telefono);
  if (!isValidPhone(telefono)) {
    return {
      error:
        'Revisa tu número: debe ser un celular de 9 dígitos (ej. 987 654 321) o un fijo con código de ciudad.',
    };
  }

  if (origen === 'registro' && !leidos.nombre) {
    return { error: 'Escribe tu nombre para registrarte.' };
  }
  if (origen.startsWith('verificador') && !leidos.direccion) {
    return { error: 'Escribe la dirección donde quieres el servicio.' };
  }
  if (leidos.nombre && PARECE_ENLACE.test(leidos.nombre)) {
    return { error: 'El nombre no puede contener enlaces ni direcciones web.' };
  }

  const correo = leidos.correo.toLowerCase();
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    return { error: 'Revisa tu correo electrónico: parece incompleto.' };
  }

  const plan =
    typeof datos.plan_interes === 'string' && PLANES.includes(datos.plan_interes)
      ? datos.plan_interes
      : null;

  return {
    lead: {
      nombre: leidos.nombre || 'Sin nombre',
      telefono,
      correo: correo || null,
      direccion: leidos.direccion || null,
      dpto: leidos.dpto || null,
      plan_interes: plan,
      mensaje: leidos.mensaje || null,
      origen,
    },
  };
}

module.exports = { validateLead, normalizePhone, isValidPhone, PLANES, ORIGENES };
