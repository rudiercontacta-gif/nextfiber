// =========================================================
// NextFiber — Panel de registros
// La clave se guarda en sessionStorage: se borra sola al cerrar la pestaña.
// =========================================================
(function () {
  const API = '/api/leads';
  const STORAGE_KEY = 'nf_admin_token';
  const ORIGENES = {
    registro: 'Registro',
    verificador_hero: 'Verificador (inicio)',
    verificador_cobertura: 'Verificador (cobertura)',
    facebook_messenger: 'Messenger',
  };
  const ESTADOS = {
    nuevo: 'Nuevo',
    contactado: 'Contactado',
    en_proceso: 'En proceso',
    instalado: 'Instalado',
    descartado: 'Descartado',
  };

  // Versiones anteriores del panel guardaban la clave de forma permanente.
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    /* sin acceso al almacenamiento: no pasa nada */
  }

  const $ = (id) => document.getElementById(id);

  // Escapa HTML para evitar XSS almacenado: cualquier dato que venga de un
  // lead (nombre, mensaje, etc.) puede contener texto escrito por un usuario
  // externo a través del formulario público.
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
  }

  function phoneCell(telefono) {
    const digits = String(telefono || '').replace(/\D/g, '');
    if (/^9\d{8}$/.test(digits)) {
      return `<a href="https://wa.me/51${digits}" target="_blank" rel="noopener">${escapeHTML(telefono)}</a>`;
    }
    return escapeHTML(telefono) || '-';
  }

  function addressCell(lead) {
    if (!lead.direccion) return '-';
    const dpto = lead.dpto ? ` (Dpto. ${lead.dpto})` : '';
    return escapeHTML(lead.direccion + dpto);
  }

  function render(leads) {
    $('count').textContent = `${leads.length} registro(s)`;

    if (!leads.length) {
      $('tableWrap').innerHTML =
        '<div class="empty">Todavía no hay registros. Cuando alguien complete un formulario del sitio, aparecerá aquí.</div>';
      return;
    }

    const rows = leads
      .map((l) => {
        const estado = ESTADOS[l.estado] ? l.estado : 'nuevo';
        return `
        <tr>
          <td class="nowrap">#${escapeHTML(l.id)}</td>
          <td class="nowrap">${escapeHTML(l.creado_en)}</td>
          <td>${escapeHTML(l.nombre) || '-'}</td>
          <td class="nowrap">${phoneCell(l.telefono)}</td>
          <td>${escapeHTML(l.correo) || '-'}</td>
          <td>${addressCell(l)}</td>
          <td>${escapeHTML(l.plan_interes) || '-'}</td>
          <td class="msg">${escapeHTML(l.mensaje) || '-'}</td>
          <td><span class="badge">${escapeHTML(ORIGENES[l.origen] || l.origen)}</span></td>
          <td><span class="badge estado-${estado}">${escapeHTML(ESTADOS[estado])}</span></td>
        </tr>`;
      })
      .join('');

    $('tableWrap').innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Fecha</th><th>Nombre</th><th>Teléfono</th><th>Correo</th>
              <th>Dirección</th><th>Plan</th><th>Mensaje</th><th>Origen</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
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

    const leads = await res.json();
    showPanel(true);
    render(leads);
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

  // Si ya había una sesión abierta en esta pestaña, entra directo
  if (sessionStorage.getItem(STORAGE_KEY)) load();
})();
