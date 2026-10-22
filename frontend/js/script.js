// =========================================================
// NextFiber — Interacciones del sitio + envío de registros
// =========================================================

// La API vive en el mismo servidor que sirve este sitio (ver /backend).
// Si más adelante alojas el frontend y el backend en dominios distintos,
// cambia esta constante por la URL completa de tu API, ej:
// const API_BASE = 'https://api.nextfiber.pe';
// (y agrega el dominio del sitio en ALLOWED_ORIGINS del backend).
const API_BASE = '';

// Número de ventas para los enlaces de WhatsApp (código de país sin "+").
const WHATSAPP_VENTAS = '51945835216';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Tarjetas de planes: efecto "glare card" (brillo holográfico) ----------
document.querySelectorAll('.plan-card').forEach((card) => {
  const rotateFactor = 0.55;

  card.addEventListener('pointermove', (e) => {
    const rect = card.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const dx = px - 50;
    const dy = py - 50;

    card.style.setProperty('--m-x', `${px}%`);
    card.style.setProperty('--m-y', `${py}%`);
    card.style.setProperty('--bg-x', `${50 + px / 4 - 12.5}%`);
    card.style.setProperty('--bg-y', `${50 + py / 4 - 12.5}%`);
    card.style.setProperty('--r-x', `${-(dx / 3.5) * rotateFactor}deg`);
    card.style.setProperty('--r-y', `${(dy / 2.5) * rotateFactor}deg`);
  });

  card.addEventListener('pointerenter', () => {
    card.style.setProperty('--opacity', '0.6');
    card.style.setProperty('--duration', '120ms');
  });

  card.addEventListener('pointerleave', () => {
    card.style.setProperty('--opacity', '0');
    card.style.setProperty('--duration', '450ms');
    card.style.setProperty('--r-x', '0deg');
    card.style.setProperty('--r-y', '0deg');
  });
});

// ---------- Tarjetas Visa de "Formas de pago": tilt 3D al mouse ----------
document.querySelectorAll('.pay-visual').forEach((visual) => {
  if (reduceMotion) return;
  const maxTilt = 14;

  visual.addEventListener('pointermove', (e) => {
    const rect = visual.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    visual.style.setProperty('--tilt-x', `${(px - 0.5) * maxTilt}deg`);
    visual.style.setProperty('--tilt-y', `${-(py - 0.5) * maxTilt}deg`);
  });

  visual.addEventListener('pointerleave', () => {
    visual.style.setProperty('--tilt-x', '0deg');
    visual.style.setProperty('--tilt-y', '0deg');
  });
});

// ---------- Carrusel de testimonios ----------
const testSlides = document.querySelectorAll('.test-slide');
const testDots = document.querySelectorAll('.test-dot');
let testIndex = 0;
let testTimer = null;

function goToTestimonial(index) {
  if (!testSlides.length) return;
  testIndex = (index + testSlides.length) % testSlides.length;
  testSlides.forEach((s, i) => s.classList.toggle('active', i === testIndex));
  testDots.forEach((d, i) => d.classList.toggle('active', i === testIndex));
}

function startTestimonialsAutoplay() {
  clearInterval(testTimer);
  if (reduceMotion) return;
  testTimer = setInterval(() => goToTestimonial(testIndex + 1), 6000);
}

if (testSlides.length) {
  testDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      goToTestimonial(parseInt(dot.dataset.index, 10));
      startTestimonialsAutoplay();
    });
  });
  startTestimonialsAutoplay();
}

// ---------- Botón "metal líquido" — efecto de onda al hacer clic ----------
document.querySelectorAll('.btn-liquid').forEach((btn) => {
  btn.addEventListener('click', function (e) {
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.2;
    const ripple = document.createElement('span');
    ripple.className = 'liquid-ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });
});

// ---------- Carrusel del hero ----------
// Los textos de cada diapositiva están en el HTML (.hero-variant), apilados en
// la misma celda: el bloque siempre mide lo que el texto más largo, así el
// formulario no se mueve mientras la persona escribe.
const heroSlides = document.querySelectorAll('.hero-slide');
const heroVariants = document.querySelectorAll('.hero-variant');
const heroDots = document.querySelectorAll('.hero-dots .dot');
const heroForm = document.querySelector('.hero .check-form');
let heroIndex = 0;
let heroTimer = null;
let heroPaused = false;

function goToHeroSlide(index) {
  if (!heroSlides.length) return;
  heroIndex = (index + heroSlides.length) % heroSlides.length;

  heroSlides.forEach((s, i) => s.classList.toggle('active', i === heroIndex));
  heroDots.forEach((d, i) => {
    d.classList.toggle('active', i === heroIndex);
    d.setAttribute('aria-current', i === heroIndex ? 'true' : 'false');
  });
  heroVariants.forEach((v, i) => {
    const isActive = i === heroIndex;
    v.classList.toggle('active', isActive);
    if (isActive) v.removeAttribute('aria-hidden');
    else v.setAttribute('aria-hidden', 'true');
  });
}

function startHeroAutoplay() {
  clearInterval(heroTimer);
  if (reduceMotion || heroPaused) return;
  heroTimer = setInterval(() => goToHeroSlide(heroIndex + 1), 5500);
}

if (heroSlides.length) {
  heroDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      goToHeroSlide(parseInt(dot.dataset.slide, 10));
      startHeroAutoplay();
    });
  });

  // El carrusel se detiene mientras la persona usa el formulario del hero
  if (heroForm) {
    const pause = () => {
      heroPaused = true;
      clearInterval(heroTimer);
    };
    const resume = () => {
      heroPaused = false;
      startHeroAutoplay();
    };
    heroForm.addEventListener('focusin', pause);
    heroForm.addEventListener('focusout', (e) => {
      if (!heroForm.contains(e.relatedTarget)) resume();
    });
    heroForm.addEventListener('pointerenter', pause);
    heroForm.addEventListener('pointerleave', () => {
      if (!heroForm.contains(document.activeElement)) resume();
    });
  }

  startHeroAutoplay();
}

// ---------- Menú móvil ----------
const siteHeader = document.querySelector('header');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.getElementById('navLinks');

if (siteHeader && menuToggle && navLinks) {
  const setMenu = (open) => {
    siteHeader.classList.toggle('nav-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  };
  const isOpen = () => siteHeader.classList.contains('nav-open');

  menuToggle.addEventListener('click', () => setMenu(!isOpen()));
  // Se cierra al elegir una opción, al tocar fuera o con la tecla Escape
  navLinks.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('click', (e) => {
    if (isOpen() && !siteHeader.contains(e.target)) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      setMenu(false);
      menuToggle.focus();
    }
  });
  // Al pasar a tamaño escritorio (por ejemplo, al girar una tablet) se reinicia
  window.matchMedia('(min-width: 941px)').addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
  });
}

// ---------- Animación de aparición al hacer scroll ----------
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealEls.forEach((el) => io.observe(el));
}

// ---------- Aviso flotante (toast) ----------
// Los lectores de pantalla lo anuncian (role="status"). Puede incluir un enlace.
let toastEl = null;
function showToast(message, { isError = false, link = null } = {}) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;
  if (link) {
    const a = document.createElement('a');
    a.href = link.href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = link.label;
    toastEl.append(' ', a);
  }
  toastEl.classList.toggle('error', isError);
  toastEl.classList.add('show');
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => toastEl.classList.remove('show'), link ? 12000 : 5000);
}

// ---------- WhatsApp como respaldo ----------
function whatsappLink(texto) {
  return `https://wa.me/${WHATSAPP_VENTAS}?text=${encodeURIComponent(texto)}`;
}

// Arma un mensaje con lo que la persona ya escribió, para no perder el contacto
function whatsappText(d) {
  const partes = [d.nombre ? `Hola NextFiber, soy ${d.nombre}.` : 'Hola NextFiber.'];
  if (d.plan_interes) partes.push(`Me interesa el plan ${d.plan_interes}.`);
  if (d.direccion) {
    const dpto = d.dpto ? ` (Dpto. ${d.dpto})` : '';
    partes.push(`Quiero el servicio en: ${d.direccion}${dpto}.`);
  }
  if (d.telefono) partes.push(`Mi número es ${d.telefono}.`);
  if (d.mensaje) partes.push(d.mensaje);
  return partes.join(' ');
}

// ---------- Teléfono: misma regla que usa el servidor ----------
function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('0051')) digits = digits.slice(4);
  else if (digits.startsWith('51') && digits.length === 11) digits = digits.slice(2);
  return digits;
}
function isValidPhone(digits) {
  return /^9\d{8}$/.test(digits) || /^0?[1-8]\d{7}$/.test(digits);
}

// ---------- Barra de progreso del formulario de registro ----------
const regForm = document.getElementById('regForm');
const regProgressBar = document.getElementById('regProgressBar');

function updateRegProgress() {
  if (!regForm || !regProgressBar) return;
  const fields = Array.from(regForm.querySelectorAll('input, select, textarea')).filter(
    (f) => f.name !== 'sitio_web'
  );
  const filled = fields.filter((f) => f.value.trim() !== '').length;
  regProgressBar.style.width = `${Math.round((filled / fields.length) * 100)}%`;
}

if (regForm && regProgressBar) {
  regForm.addEventListener('input', updateRegProgress);
  regForm.addEventListener('change', updateRegProgress);
  // Tras enviar, el formulario se limpia: la barra vuelve a cero
  regForm.addEventListener('reset', () => setTimeout(updateRegProgress, 0));
  updateRegProgress();
}

// ---------- Botones "¡Lo quiero!" y "Cotizar": llevan el plan elegido al registro ----------
document.querySelectorAll('a[data-plan]').forEach((link) => {
  link.addEventListener('click', () => {
    const select = regForm && regForm.querySelector('select[name="plan_interes"]');
    if (!select) return;
    select.value = link.dataset.plan;
    updateRegProgress();
    select.classList.remove('plan-marcado');
    void select.offsetWidth; // reinicia el resaltado si se hace clic varias veces
    select.classList.add('plan-marcado');
    setTimeout(() => select.classList.remove('plan-marcado'), 2500);
  });
});

// ---------- Envío de formularios a la base de datos ----------
// Cualquier <form data-lead-form="..."> se envía como un registro (lead)
// a POST /api/leads. El backend guarda el dato en la base de datos y
// dispara las notificaciones a WhatsApp, Gmail y Telegram configuradas.
const SUCCESS_MESSAGES = {
  registro: '¡Gracias! Tus datos quedaron registrados. Un asesor de NextFiber te contactará pronto.',
  verificador_hero:
    '¡Recibido! Revisamos la cobertura en tu dirección y te escribimos por WhatsApp en menos de 24 horas.',
  verificador_cobertura:
    '¡Recibido! Revisamos la cobertura en tu dirección y te escribimos por WhatsApp en menos de 24 horas.',
};

document.querySelectorAll('form[data-lead-form]').forEach((form) => {
  const phoneInput = form.querySelector('input[name="telefono"]');
  if (phoneInput) phoneInput.addEventListener('input', () => phoneInput.setCustomValidity(''));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (phoneInput) {
      phoneInput.setCustomValidity(
        isValidPhone(normalizePhone(phoneInput.value))
          ? ''
          : 'Ingresa un celular de 9 dígitos (ej. 987 654 321) o un fijo con código de ciudad.'
      );
    }
    if (!form.reportValidity()) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalHTML = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Enviando...</span>';
    }

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.origen = form.dataset.leadForm;

    try {
      const res = await fetch(`${API_BASE}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const error = new Error(data.error || 'No pudimos guardar tus datos.');
        error.status = res.status;
        throw error;
      }

      showToast(SUCCESS_MESSAGES[payload.origen] || SUCCESS_MESSAGES.registro);
      form.reset();
    } catch (err) {
      console.error('Error al registrar el lead:', err);
      if (err.status === 400) {
        // Dato por corregir: el mensaje del servidor dice exactamente qué revisar
        showToast(err.message, { isError: true });
      } else {
        // Falla del servidor, de la conexión o límite de envíos: ofrecemos
        // WhatsApp con los datos ya escritos para no perder el contacto
        showToast(err.status === 429 ? err.message : 'No pudimos guardar tus datos.', {
          isError: true,
          link: { href: whatsappLink(whatsappText(payload)), label: 'Escríbenos por WhatsApp' },
        });
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
      }
    }
  });
});

// ---------- Mapas de sedes (Cusco y Puerto Maldonado) con Leaflet ----------
// Leaflet no requiere API key (a diferencia de Google Maps). Usa mapas de OpenStreetMap.
if (window.L) {
  document.querySelectorAll('.hs-leaflet[data-lat][data-lng]').forEach((el) => {
    const lat = parseFloat(el.dataset.lat);
    const lng = parseFloat(el.dataset.lng);
    const zoom = parseInt(el.dataset.zoom, 10) || 15;

    const map = L.map(el, {
      scrollWheelZoom: false, // evita que el scroll de la página quede "atrapado" dentro del mapa
      dragging: !L.Browser.mobile, // en móvil se arrastra la página, no el mapa
    }).setView([lat, lng], zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Ícono de pin personalizado (color lima de la marca)
    const nextFiberIcon = L.divIcon({
      className: 'nf-map-pin',
      html: '<span></span>',
      iconSize: [22, 22],
      iconAnchor: [11, 20],
    });

    L.marker([lat, lng], { icon: nextFiberIcon }).addTo(map);

    // Habilita el zoom con scroll solo cuando el usuario hace clic dentro del mapa
    map.on('click', () => map.scrollWheelZoom.enable());
    el.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());
  });
}
