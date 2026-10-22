(function () {
  const SPLASH_PATHS = [
    'M4 20 Q 14 10 26 14',
    'M4 20 Q 14 30 26 26',
    'M96 20 Q 86 10 74 14',
    'M96 20 Q 86 30 74 26',
    'M50 2 Q 46 10 50 16',
    'M50 38 Q 46 30 50 24',
  ];
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function buildChars(text) {
    const wrap = document.createElement('span');
    text.split('').forEach((ch, i) => {
      const s = document.createElement('span');
      s.textContent = ch === ' ' ? '\u00A0' : ch;
      s.style.setProperty('--i', i);
      wrap.appendChild(s);
    });
    return wrap;
  }

  function buildSplash() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 100 40');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('class', 'btn3d-splash');
    svg.setAttribute('aria-hidden', 'true');
    SPLASH_PATHS.forEach((d) => {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', d);
      svg.appendChild(path);
    });
    return svg;
  }

  document.querySelectorAll('.btn-3d[data-hover-text]').forEach((btn) => {
    const original = btn.textContent.trim();
    const hoverText = btn.getAttribute('data-hover-text');
    if (!original || !hoverText) return;

    btn.textContent = '';

    const label = document.createElement('span');
    label.className = 'btn3d-label';

    const txtA = buildChars(original);
    txtA.className = 'btn3d-txt btn3d-txt-a';
    const txtB = buildChars(hoverText);
    txtB.className = 'btn3d-txt btn3d-txt-b';

    label.appendChild(txtA);
    label.appendChild(txtB);
    btn.appendChild(label);
    btn.appendChild(buildSplash());

    requestAnimationFrame(() => {
      const ancho = Math.max(txtA.offsetWidth, txtB.offsetWidth);
      if (ancho) label.style.minWidth = `${ancho}px`;
    });
  });
})();
