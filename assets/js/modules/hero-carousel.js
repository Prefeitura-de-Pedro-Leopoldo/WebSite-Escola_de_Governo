export function initHeroCarousel() {
  const root = document.querySelector('[data-hero-carousel]');
  if (!root) return;

  const slides = Array.from(root.querySelectorAll('.noticia-hero__slide'));
  if (slides.length === 0) return;

  const dotsContainer = root.querySelector('[data-hero-dots]');
  const prevBtn = root.querySelector('[data-hero-prev]');
  const nextBtn = root.querySelector('[data-hero-next]');

  let current = slides.findIndex(s => s.classList.contains('is-active'));
  if (current < 0) current = 0;

  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'noticia-hero__dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Ir para imagem ${i + 1}`);
    if (i === current) dot.classList.add('is-active');
    dot.addEventListener('click', () => go(i));
    dotsContainer?.appendChild(dot);
    return dot;
  });

  function go(index) {
    const next = (index + slides.length) % slides.length;
    slides[current].classList.remove('is-active');
    dots[current]?.classList.remove('is-active');
    slides[next].classList.add('is-active');
    dots[next]?.classList.add('is-active');
    current = next;
  }

  prevBtn?.addEventListener('click', () => { go(current - 1); restart(); });
  nextBtn?.addEventListener('click', () => { go(current + 1); restart(); });

  let timer = null;
  const INTERVAL = 5000;
  function start() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timer = window.setInterval(() => go(current + 1), INTERVAL);
  }
  function stop() {
    if (timer) { window.clearInterval(timer); timer = null; }
  }
  function restart() { stop(); start(); }

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else start();
  });

  start();
}
