(function () {
  const API = '/api/reclamos';
  const STORAGE_KEY = 'nf_admin_token';

  let ultimosReclamos = [];

  const $ = (id) => document.getElementById(id);

  function escapeHTML(value) {
    const str = value === null || value === undefined ? '' : String(value);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showPanel(visible) {
    $('gate').classList.toggle('hidden', visible);
    $('content').classList.toggle('hidden', !visible);
  }

  function logout(message) {
    sessionStorage.removeItem(STORAGE_KEY);
    showPanel(false);
    $('gateError').textContent = message || '';
    $('token').value = '';
    $('token').focus();
    $('detailWrap').innerHTML = '';
  }

  function phoneCell(telefono) {
    const digits = String(telefono || '').replace(/\D/g, '');
    if (/^9\d{8}$/.test(digits)) {
      return `<a href="https://wa.me/51${digits}" target="_blank" rel="noopener">${escapeHTML(telefono)}</a>`;
    }
    return escapeHTML(telefono) || '-';
  }

  function render(reclamos) {
    ultimosReclamos = reclamos;
    $('count').textContent = `${reclamos.length} registro(s)`;

    if (!reclamos.length) {
      $('tableWrap').innerHTML =
        '<div class="empty">Todavía no hay reclamos ni quejas. Cuando alguien complete el formulario del Libro de Reclamaciones, aparecerá aquí.</div>';
      return;
    }

    const rows = reclamos
      .map((r) => {
        const estado = r.estado === 'atendido' ? 'atendido' : 'pendiente';
        const tipoClase = r.tipo === 'queja' ? 'tipo-queja' : 'tipo-reclamo';
        const tipoTexto = r.tipo === 'queja' ? 'Queja' : 'Reclamo';
        return `
        <tr>
          <td class="nowrap">#${escapeHTML(r.id)}</td>
          <td class="nowrap">${escapeHTML(r.creado_en)}</td>
          <td><span class="badge ${tipoClase}">${tipoTexto}</span></td>
          <td>${escapeHTML(r.consumidor)}</td>
          <td class="nowrap">${escapeHTML(r.tipo_documento)} ${escapeHTML(r.numero_documento)}</td>
          <td class="nowrap">${phoneCell(r.telefono)}</td>
          <td>${escapeHTML(r.bien_contratado)}</td>
          <td><span class="badge estado-${estado}">${estado === 'atendido' ? 'Atendido' : 'Pendiente'}</span></td>
          <td><button type="button" class="small secondary" data-ver="${r.id}">Ver / Responder</button></td>
        </tr>`;
      })
      .join('');

    $('tableWrap').innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Fecha</th><th>Tipo</th><th>Consumidor</th><th>Documento</th>
              <th>Teléfono</th><th>Servicio</th><th>Estado</th><th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;

    $('tableWrap').querySelectorAll('[data-ver]').forEach((btn) => {
      btn.addEventListener('click', () => showDetail(Number(btn.dataset.ver)));
    });
  }

  function showDetail(id) {
    const r = ultimosReclamos.find((x) => x.id === id);
    if (!r) return;

    $('detailWrap').innerHTML = `
      <div class="panel">
        <h2>${r.tipo === 'queja' ? 'Queja' : 'Reclamo'} #${escapeHTML(r.id)}</h2>
        <dl>
          <dt>Consumidor</dt><dd>${escapeHTML(r.consumidor)}</dd>
          <dt>Documento</dt><dd>${escapeHTML(r.tipo_documento)} ${escapeHTML(r.numero_documento)}</dd>
          <dt>Domicilio</dt><dd>${escapeHTML(r.domicilio) || '-'}</dd>
          <dt>Teléfono</dt><dd>${phoneCell(r.telefono)}</dd>
          <dt>Correo</dt><dd>${escapeHTML(r.correo) || '-'}</dd>
          <dt>Menor de edad</dt><dd>${r.es_menor_edad ? `Sí — Apoderado: ${escapeHTML(r.apoderado) || '-'}` : 'No'}</dd>
          <dt>Servicio</dt><dd>${escapeHTML(r.bien_contratado)}</dd>
          <dt>Fecha de contratación</dt><dd>${escapeHTML(r.fecha_contrato) || '-'}</dd>
          <dt>Monto reclamado</dt><dd>${escapeHTML(r.monto_reclamado) || '-'}</dd>
          <dt>Detalle</dt><dd>${escapeHTML(r.detalle)}</dd>
          <dt>Pedido</dt><dd>${escapeHTML(r.pedido)}</dd>
          <dt>Recibido</dt><dd>${escapeHTML(r.creado_en)}</dd>
        </dl>
        <label for="respuesta">Respuesta del proveedor (recuerda: 15 días hábiles improrrogables de plazo legal)</label>
        <textarea id="respuesta">${escapeHTML(r.respuesta || '')}</textarea>
        <div class="panel-actions">
          <select id="estado">
            <option value="pendiente" ${r.estado !== 'atendido' ? 'selected' : ''}>Pendiente</option>
            <option value="atendido" ${r.estado === 'atendido' ? 'selected' : ''}>Atendido</option>
          </select>
          <button type="button" id="guardar">Guardar</button>
          <span class="save-msg hidden" id="saveMsg">Guardado ✓</span>
        </div>
      </div>`;

    $('guardar').addEventListener('click', () => guardarRespuesta(id));
  }

  async function guardarRespuesta(id) {
    const token = sessionStorage.getItem(STORAGE_KEY);
    const estado = $('estado').value;
    const respuesta = $('respuesta').value;

    const res = await fetch(`${API}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
      body: JSON.stringify({ estado, respuesta }),
    });

    if (res.status === 401) return logout('Clave incorrecta. Vuelve a intentarlo.');
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'No se pudo guardar. Intenta de nuevo.');
      return;
    }

    $('saveMsg').classList.remove('hidden');
    setTimeout(() => $('saveMsg').classList.add('hidden'), 2500);
    load();
  }

  async function load() {
    const token = sessionStorage.getItem(STORAGE_KEY);
    if (!token) return showPanel(false);

    let res;
    try {
      res = await fetch(API, { headers: { 'x-admin-token': token }, cache: 'no-store' });
    } catch (err) {
      showPanel(true);
      $('tableWrap').innerHTML =
        '<div class="empty">No se pudo conectar con el servidor. Revisa tu conexión y pulsa Actualizar.</div>';
      return;
    }

    if (res.status === 401) return logout('Clave incorrecta. Vuelve a intentarlo.');
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return logout(data.error || 'No se pudo cargar el panel. Intenta de nuevo.');
    }

    const reclamos = await res.json();
    showPanel(true);
    render(reclamos);
  }

  $('gate').addEventListener('submit', (e) => {
    e.preventDefault();
    const token = $('token').value.trim();
    if (!token) return;
    sessionStorage.setItem(STORAGE_KEY, token);
    $('gateError').textContent = '';
    load();
  });
  $('reload').addEventListener('click', load);
  $('logout').addEventListener('click', () => logout(''));

  if (sessionStorage.getItem(STORAGE_KEY)) load();
})();
