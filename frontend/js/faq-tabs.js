/* Preguntas frecuentes: pestañas por tema.
   Si este archivo no carga, la página sigue funcionando: todas las preguntas
   quedan visibles, agrupadas por tema, y cada una se abre con su <details>. */
(function () {
  var section = document.getElementById('preguntas');
  if (!section) return;

  var tablist = section.querySelector('.faq-tabs');
  var tabs = Array.prototype.slice.call(section.querySelectorAll('.faq-tab'));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  if (!tablist || !tabs.length || panels.some(function (p) { return !p; })) return;

  tablist.setAttribute('role', 'tablist');
  tabs.forEach(function (t, i) {
    t.setAttribute('role', 'tab');
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', t.id);
  });
  section.classList.add('faq-js');

  function select(index, moveFocus) {
    tabs.forEach(function (t, i) {
      var on = i === index;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panels[i].classList.toggle('is-active', on);
    });
    if (moveFocus) tabs[index].focus();
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(i, false); });
    t.addEventListener('keydown', function (e) {
      var n = tabs.length, next = null;
      if (e.key === 'ArrowRight') next = (i + 1) % n;
      else if (e.key === 'ArrowLeft') next = (i - 1 + n) % n;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = n - 1;
      if (next !== null) { e.preventDefault(); select(next, true); }
    });
  });

  select(0, false);
})();
