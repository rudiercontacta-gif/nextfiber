(function () {
  const boton = document.querySelector('.wa-float');
  if (!boton) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  setTimeout(() => {
    boton.classList.add('is-open');
    setTimeout(() => boton.classList.remove('is-open'), 3200);
  }, 1800);
})();
