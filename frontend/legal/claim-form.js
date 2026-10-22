(function () {
  const form = document.getElementById('claimForm');
  if (!form) return;

  const msg = document.getElementById('formMsg');
  const menorCheckbox = document.getElementById('es_menor_edad');
  const apoderadoRow = document.getElementById('apoderadoRow');

  menorCheckbox.addEventListener('change', () => {
    apoderadoRow.style.display = menorCheckbox.checked ? 'grid' : 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'form-msg';
    msg.textContent = '';

    const data = Object.fromEntries(new FormData(form).entries());
    data.es_menor_edad = menorCheckbox.checked;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando…';

    try {
      const res = await fetch('/api/reclamos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        msg.classList.add('error');
        msg.textContent = result.error || 'No se pudo enviar tu reclamación. Intenta de nuevo.';
        return;
      }

      msg.classList.add('ok');
      msg.textContent = `Listo, quedó registrado con el folio #${result.folio}. Te enviamos una copia a tu correo y te responderemos en un plazo máximo de 15 días hábiles.`;
      form.reset();
      apoderadoRow.style.display = 'none';
    } catch (err) {
      msg.classList.add('error');
      msg.textContent =
        'No se pudo conectar con el servidor. Escríbenos por WhatsApp al 945 835 216 si el problema continúa.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar reclamación';
    }
  });
})();
