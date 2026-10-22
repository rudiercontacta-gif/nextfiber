/* Departamento + distrito con sugerencias (zonas con fibra óptica).
   ------------------------------------------------------------------------
   Cómo funciona: el cliente elige su departamento y luego escribe su distrito.
   Mientras escribe, el primer distrito con fibra se completa solo (texto gris) y
   aparece una lista pequeña flotante con las coincidencias (no empuja la página).
   Tab, Enter, flecha derecha o un clic aceptan la sugerencia. Puede escribir
   cualquier otro distrito: la lista ayuda, no obliga.

   PARA AGREGAR O QUITAR DISTRITOS: edita solo la lista DEPARTAMENTOS de abajo.
     valor:     debe ser igual al value del <option> del departamento en index.html.
     nombre:    el distrito tal como se mostrará.
     nota:      texto pequeño junto al nombre (opcional).
     buscar:    otras formas de escribirlo, sin tildes (opcional).
   Si este archivo no carga, el formulario sigue funcionando (envía el distrito). */
(function () {
  var DEPARTAMENTOS = [
    {
      valor: 'Cusco',
      distritos: [
        { nombre: 'Cusco', nota: 'zona central y noroccidental', buscar: ['centro historico'] },
        { nombre: 'Santiago' },
        { nombre: 'Wanchaq', buscar: ['wanchak', 'wanchac'] },
        { nombre: 'San Sebastián' },
        { nombre: 'San Jerónimo' }
      ]
    },
    {
      valor: 'Madre de Dios',
      distritos: [
        // Pendiente: agrega aquí los distritos con fibra de Madre de Dios / Puerto Maldonado.
      ]
    }
  ];

  /* ---------- Lógica (no toca la página) ---------- */
  function sinTildes(texto) {
    return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function departamento(valor) {
    for (var i = 0; i < DEPARTAMENTOS.length; i++) if (DEPARTAMENTOS[i].valor === valor) return DEPARTAMENTOS[i];
    return null;
  }

  // 0 = empieza igual · 1 = una palabra empieza igual · 2/3 = lo contiene · null = no coincide
  function puntaje(distrito, frag) {
    var nombre = sinTildes(distrito.nombre);
    if (nombre.indexOf(frag) === 0) return 0;
    var claves = (distrito.buscar || []).map(sinTildes);
    var palabras = nombre.split(/[^a-z0-9]+/);
    if (palabras.some(function (p) { return p.indexOf(frag) === 0; })) return 1;
    if (claves.some(function (c) { return c.indexOf(frag) === 0; })) return 1;
    if (frag.length >= 3) {
      if (claves.some(function (c) { return c.indexOf(frag) !== -1; })) return 2;
      if (nombre.indexOf(frag) !== -1) return 3;
    }
    return null;
  }

  // Distritos del departamento que coinciden con lo escrito (todos si no se escribió nada).
  function buscar(valorDepto, texto) {
    var dep = departamento(valorDepto);
    if (!dep) return [];
    var frag = sinTildes(texto).trim();
    if (!frag) return dep.distritos.slice();
    return dep.distritos
      .map(function (d, i) { return { d: d, p: puntaje(d, frag), i: i }; })
      .filter(function (x) { return x.p !== null; })
      .sort(function (a, b) { return (a.p - b.p) || (a.i - b.i); })
      .map(function (x) { return x.d; });
  }

  // Lo que falta para completar el nombre ('' si lo escrito no es el comienzo del nombre).
  function resto(texto, distrito) {
    var t = sinTildes(texto);
    var n = sinTildes(distrito.nombre);
    if (!t.trim() || t.length >= n.length || n.indexOf(t) !== 0) return '';
    return distrito.nombre.slice(texto.length);
  }

  // Índice del distrito que se propone completar (el primero que empieza igual; si no, el primero).
  function sugerido(lista, texto) {
    if (!String(texto || '').trim()) return -1;
    for (var i = 0; i < lista.length; i++) if (resto(texto, lista[i])) return i;
    return lista.length ? 0 : -1;
  }

  function exacto(valorDepto, texto) {
    var dep = departamento(valorDepto);
    var t = sinTildes(texto).trim();
    if (!dep || !t) return null;
    for (var i = 0; i < dep.distritos.length; i++) if (sinTildes(dep.distritos[i].nombre) === t) return dep.distritos[i];
    return null;
  }

  // Lo que se envía al servidor en el campo "dirección": "Distrito, Departamento".
  function direccionCompuesta(valorDepto, texto) {
    var t = String(texto || '').replace(/\s+/g, ' ').trim();
    if (!t) return '';
    return valorDepto ? t + ', ' + valorDepto : t;
  }

  /* ---------- Interfaz ---------- */
  var contador = 0;

  function vaciar(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  // Los elementos que crea este script llevan sus estilos propios: así, aunque el styles.css
  // de la página sea una versión anterior, la lista flotante nunca puede romper el formulario.
  function estilo(el, props) {
    if (!el.style) return;
    for (var k in props) if (Object.prototype.hasOwnProperty.call(props, k)) el.style[k] = props[k];
  }
  var COLOR_TEXTO = '#0b0b0d', COLOR_NOTA = '#4a4650', COLOR_ACTIVO = '#efe8fc', COLOR_ACTIVO_TEXTO = '#471980', COLOR_HOVER = '#f6f2fd';

  function mejorar(form) {
    if (form.dataset.zonasListo) return;
    var selector = form.querySelector('select[name="departamento"]');
    var campo = form.querySelector('input[name="direccion"]');
    if (!selector || !campo) return;
    form.dataset.zonasListo = '1';
    var id = ++contador;

    // El campo visible pasa a llamarse "distrito"; el campo oculto "direccion" lleva "Distrito, Departamento".
    campo.name = 'distrito';
    var oculto = document.createElement('input');
    oculto.type = 'hidden';
    oculto.name = 'direccion';
    form.appendChild(oculto);

    // Todo lo que se agrega vive DENTRO del campo (texto gris + lista flotante): no mueve nada de la página.
    var envoltorio = document.createElement('div');
    envoltorio.className = 'zonas-wrap';
    estilo(envoltorio, { position: 'relative', display: 'flex' });
    campo.parentNode.insertBefore(envoltorio, campo);
    envoltorio.appendChild(campo);
    estilo(campo, { flex: '1 1 auto', width: '100%', minWidth: '0' });

    var fantasma = document.createElement('span');
    fantasma.className = 'zonas-fantasma';
    fantasma.setAttribute('aria-hidden', 'true');
    estilo(fantasma, { position: 'absolute', top: '0', right: '0', bottom: '0', left: '0', display: 'flex', alignItems: 'center',
      padding: '0 14px', fontFamily: 'inherit', fontSize: '15px', whiteSpace: 'pre', overflow: 'hidden', pointerEvents: 'none', textAlign: 'left' });
    var fantasmaEscrito = document.createElement('span');
    fantasmaEscrito.className = 'zf-escrito';
    estilo(fantasmaEscrito, { visibility: 'hidden' });
    var fantasmaResto = document.createElement('span');
    fantasmaResto.className = 'zf-resto';
    estilo(fantasmaResto, { color: '#9a95a3' });
    fantasma.appendChild(fantasmaEscrito);
    fantasma.appendChild(fantasmaResto);
    envoltorio.appendChild(fantasma);

    var panel = document.createElement('div');
    panel.className = 'zonas-panel';
    panel.id = 'zonas-lista-' + id;
    panel.hidden = true;
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-label', 'Distritos con fibra óptica');
    estilo(panel, { position: 'absolute', zIndex: '30', boxSizing: 'border-box', background: '#ffffff', color: COLOR_TEXTO, borderRadius: '12px',
      padding: '6px', boxShadow: '0 14px 36px rgba(0,0,0,0.38)', textAlign: 'left', maxWidth: 'calc(100vw - 32px)' });
    envoltorio.appendChild(panel);

    campo.setAttribute('autocomplete', 'off');
    campo.setAttribute('role', 'combobox');
    campo.setAttribute('aria-autocomplete', 'both');
    campo.setAttribute('aria-controls', panel.id);
    campo.setAttribute('aria-expanded', 'false');

    var opciones = [];
    var propuestos = [];
    var activo = -1;
    var departamentoAnterior = selector.value;

    function actualizarOculto() { oculto.value = direccionCompuesta(selector.value, campo.value); }

    function pintarFantasma() {
      var r = (activo >= 0 && propuestos[activo]) ? resto(campo.value, propuestos[activo]) : '';
      fantasmaEscrito.textContent = r ? campo.value : '';
      fantasmaResto.textContent = r;
      return r;
    }

    function marcarActivo(i) {
      activo = i;
      opciones.forEach(function (op, k) {
        op.className = 'zonas-opt' + (k === i ? ' activa' : '');
        op.setAttribute('aria-selected', k === i ? 'true' : 'false');
        estilo(op, { background: k === i ? COLOR_ACTIVO : 'transparent', color: k === i ? COLOR_ACTIVO_TEXTO : COLOR_TEXTO });
      });
      if (i >= 0 && opciones[i]) campo.setAttribute('aria-activedescendant', opciones[i].id);
      else campo.removeAttribute('aria-activedescendant');
      pintarFantasma();
    }

    function cerrar() {
      panel.hidden = true;
      panel.className = 'zonas-panel';
      campo.setAttribute('aria-expanded', 'false');
      campo.removeAttribute('aria-activedescendant');
      fantasmaEscrito.textContent = '';
      fantasmaResto.textContent = '';
      vaciar(panel);
      opciones = [];
      propuestos = [];
      activo = -1;
    }

    // Abajo del campo por defecto; si ahí no hay espacio (la sección corta el contenido), se abre hacia arriba.
    function posicionar() {
      var celular = typeof window !== 'undefined' && window.innerWidth && window.innerWidth <= 640;
      estilo(panel, {
        top: 'calc(100% + 6px)', bottom: 'auto',
        left: celular ? 'auto' : '0', right: celular ? '0' : 'auto',
        width: celular ? 'min(270px, calc(100vw - 48px))' : 'max(100%, 270px)'
      });
      panel.className = 'zonas-panel';
      var seccion = campo.closest ? campo.closest('section') : null;
      if (!seccion || !panel.getBoundingClientRect) return;
      if (panel.getBoundingClientRect().bottom > seccion.getBoundingClientRect().bottom - 4) {
        estilo(panel, { top: 'auto', bottom: 'calc(100% + 6px)' });
        panel.className = 'zonas-panel arriba';
      }
    }

    function elegir(distrito) {
      campo.value = distrito.nombre;
      pintar();                                // ya es un distrito completo: la lista se cierra
      var tel = form.querySelector('input[name="telefono"]');
      if (tel) tel.focus();
    }

    function pintar() {
      actualizarOculto();
      var dep = departamento(selector.value);
      var texto = campo.value;
      // Solo aparece algo mientras se escribe, y solo si hay coincidencias.
      if (!dep || !dep.distritos.length || !texto.trim() || exacto(dep.valor, texto)) { cerrar(); return; }
      var lista = buscar(dep.valor, texto);
      if (!lista.length) { cerrar(); return; }

      vaciar(panel);
      opciones = [];
      propuestos = lista;
      lista.forEach(function (d, k) {
        var op = document.createElement('div');
        op.className = 'zonas-opt';
        op.id = 'zonas-opt-' + id + '-' + k;
        op.setAttribute('role', 'option');
        op.setAttribute('aria-selected', 'false');
        estilo(op, { display: 'flex', alignItems: 'baseline', gap: '8px', padding: '6px 10px', borderRadius: '8px', fontSize: '14px',
          fontWeight: '600', lineHeight: '1.3', color: COLOR_TEXTO, background: 'transparent', cursor: 'pointer', textAlign: 'left' });
        var nombre = document.createElement('span');
        nombre.textContent = d.nombre;
        op.appendChild(nombre);
        if (d.nota) {
          var nota = document.createElement('small');
          nota.textContent = d.nota;
          estilo(nota, { fontSize: '11.5px', fontWeight: '400', color: COLOR_NOTA });
          op.appendChild(nota);
        }
        op.addEventListener('mousedown', function (e) { e.preventDefault(); });   // el campo no pierde el foco
        op.addEventListener('click', function () { elegir(d); });
        op.addEventListener('mouseenter', function () { if (op.className.indexOf('activa') === -1) estilo(op, { background: COLOR_HOVER }); });
        op.addEventListener('mouseleave', function () { if (op.className.indexOf('activa') === -1) estilo(op, { background: 'transparent' }); });
        panel.appendChild(op);
        opciones.push(op);
      });
      panel.hidden = false;
      posicionar();
      campo.setAttribute('aria-expanded', 'true');
      marcarActivo(sugerido(lista, texto));
    }

    function aceptarSugerencia() {
      if (activo < 0 || !propuestos[activo]) return false;
      elegir(propuestos[activo]);
      return true;
    }

    selector.addEventListener('change', function () {
      selector.setCustomValidity('');
      var anterior = exacto(departamentoAnterior, campo.value);
      if (anterior) campo.value = '';        // el distrito era del departamento anterior
      departamentoAnterior = selector.value;
      pintar();
    });
    selector.addEventListener('invalid', function () { selector.setCustomValidity('Elige tu departamento.'); });

    campo.addEventListener('focus', pintar);
    campo.addEventListener('input', pintar);
    campo.addEventListener('blur', function () {
      var d = exacto(selector.value, campo.value);
      if (d) campo.value = d.nombre;          // "santiago" -> "Santiago"
      cerrar();
      actualizarOculto();
    });

    campo.addEventListener('keydown', function (e) {
      var abierta = !panel.hidden && opciones.length;
      if (e.key === 'ArrowDown' && abierta) {
        e.preventDefault(); marcarActivo((activo + 1) % opciones.length);
      } else if (e.key === 'ArrowUp' && abierta) {
        e.preventDefault(); marcarActivo((activo - 1 + opciones.length) % opciones.length);
      } else if (e.key === 'Enter' && abierta) {
        if (aceptarSugerencia()) e.preventDefault();
      } else if (e.key === 'Tab' && !e.shiftKey && abierta) {
        if (pintarFantasma()) { campo.value = propuestos[activo].nombre; pintar(); }   // Tab completa y sigue al siguiente campo
      } else if (e.key === 'ArrowRight' && abierta && campo.selectionStart === campo.value.length) {
        if (pintarFantasma()) { e.preventDefault(); campo.value = propuestos[activo].nombre; pintar(); }
      } else if (e.key === 'Escape' && abierta) {
        e.preventDefault(); cerrar();
      }
    });

    form.addEventListener('submit', actualizarOculto, true);
    form.addEventListener('reset', function () { setTimeout(pintar, 0); });
    pintar();
  }

  function iniciar() {
    Array.prototype.forEach.call(document.querySelectorAll('form.check-form'), mejorar);
  }

  if (typeof window !== 'undefined') {
    window.NextFiberZonas = {
      sinTildes: sinTildes, buscar: buscar, resto: resto, sugerido: sugerido,
      exacto: exacto, direccionCompuesta: direccionCompuesta
    };
  }
  if (typeof document !== 'undefined' && document.querySelectorAll) iniciar();
})();
