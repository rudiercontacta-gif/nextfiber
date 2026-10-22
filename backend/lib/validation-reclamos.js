const TIPOS = ['reclamo', 'queja'];
const TIPOS_DOCUMENTO = ['DNI', 'Carné de extranjería', 'Pasaporte'];

const CAMPOS = {
  consumidor: { etiqueta: 'Nombre completo', max: 120 },
  numero_documento: { etiqueta: 'Número de documento', max: 20 },
  domicilio: { etiqueta: 'Domicilio', max: 200 },
  telefono: { etiqueta: 'Teléfono', max: 20 },
  correo: { etiqueta: 'Correo', max: 120 },
  apoderado: { etiqueta: 'Nombre del padre, madre o apoderado', max: 120 },
  bien_contratado: { etiqueta: 'Servicio contratado', max: 200 },
  fecha_contrato: { etiqueta: 'Fecha de contratación', max: 20 },
  monto_reclamado: { etiqueta: 'Monto reclamado', max: 30 },
  detalle: { etiqueta: 'Detalle', max: 2000, multilinea: true },
  pedido: { etiqueta: 'Pedido del consumidor', max: 1000, multilinea: true },
};

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

function normalizePhone(texto) {
  let digitos = String(texto || '').replace(/\D/g, '');
  if (digitos.startsWith('0051')) digitos = digitos.slice(4);
  else if (digitos.startsWith('51') && digitos.length === 11) digitos = digitos.slice(2);
  return digitos;
}

function isValidPhone(digitos) {
  return /^9\d{8}$/.test(digitos) || /^0?[1-8]\d{7}$/.test(digitos);
}

function validateReclamo(datos) {
  const leidos = {};
  for (const campo of Object.keys(CAMPOS)) {
    const resultado = readText(datos, campo);
    if (resultado.error) return { error: resultado.error };
    leidos[campo] = resultado.valor;
  }

  const tipo = TIPOS.includes(datos.tipo) ? datos.tipo : null;
  if (!tipo) return { error: 'Indica si se trata de un reclamo o de una queja.' };

  const tipoDocumento = TIPOS_DOCUMENTO.includes(datos.tipo_documento) ? datos.tipo_documento : null;
  if (!tipoDocumento) return { error: 'Selecciona un tipo de documento válido.' };

  if (!leidos.consumidor) return { error: 'Escribe tu nombre completo.' };
  if (!leidos.numero_documento) return { error: 'Escribe tu número de documento.' };
  if (!leidos.bien_contratado) return { error: 'Describe el servicio o producto contratado.' };
  if (!leidos.detalle) return { error: 'Describe el detalle del reclamo o la queja.' };
  if (!leidos.pedido) return { error: 'Indica qué solicitas como solución.' };

  if (!leidos.telefono) return { error: 'Necesitamos un teléfono de contacto.' };
  const telefono = normalizePhone(leidos.telefono);
  if (!isValidPhone(telefono)) {
    return {
      error:
        'Revisa tu número: debe ser un celular de 9 dígitos (ej. 987 654 321) o un fijo con código de ciudad.',
    };
  }

  // El correo es obligatorio: a esa dirección se envía la copia de la hoja de reclamación.
  const correo = leidos.correo.toLowerCase();
  if (!correo) {
    return { error: 'Necesitamos tu correo electrónico para enviarte una copia de tu reclamación.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    return { error: 'Revisa tu correo electrónico: parece incompleto.' };
  }

  const esMenorEdad = datos.es_menor_edad === true;
  if (esMenorEdad && !leidos.apoderado) {
    return { error: 'Si eres menor de edad, necesitamos el nombre de tu padre, madre o apoderado.' };
  }

  return {
    reclamo: {
      tipo,
      consumidor: leidos.consumidor,
      tipo_documento: tipoDocumento,
      numero_documento: leidos.numero_documento,
      domicilio: leidos.domicilio || null,
      telefono,
      correo,
      es_menor_edad: esMenorEdad ? 1 : 0,
      apoderado: esMenorEdad ? leidos.apoderado : null,
      bien_contratado: leidos.bien_contratado,
      fecha_contrato: leidos.fecha_contrato || null,
      monto_reclamado: leidos.monto_reclamado || null,
      detalle: leidos.detalle,
      pedido: leidos.pedido,
    },
  };
}

module.exports = { validateReclamo, TIPOS, TIPOS_DOCUMENTO };
