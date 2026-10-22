// =========================================================
// Manejo de errores centralizado.
// Registra el detalle en la consola del servidor, pero al visitante
// solo le responde un mensaje genérico (nunca rutas ni código interno).
// =========================================================
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Los datos enviados no tienen un formato válido.' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Los datos enviados son demasiado grandes.' });
  }

  const status =
    err && Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  if (status >= 500) console.error('[Error]', err);

  const isApi = req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/webhook');
  if (isApi) {
    return res
      .status(status)
      .json({ error: 'Ocurrió un error inesperado. Intenta de nuevo en unos minutos.' });
  }
  res.status(status).type('text/plain').send('Ocurrió un error inesperado.');
}

module.exports = { errorHandler };
