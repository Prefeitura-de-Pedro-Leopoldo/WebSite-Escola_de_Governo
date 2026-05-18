/* ========================================
   Cursor customizado — capelo de formatura animado
   Aparece somente ao sobrevoar botões de inscrição no Sympla.
   ======================================== */

// Capelo de formatura (mortarboard) — sobre botões de inscrição e
// áreas CLICÁVEIS do carrossel (cards e setas de navegação).
// IMPORTANTE: NÃO incluir o swiper inteiro — o texto abaixo do card
// (`.evento-info`) não é clicável e deve manter cursor normal.
const SELECTOR_CAP = [
  '.curso-card__btn--primary',
  '.curso-detalhe__cta--primary',
  'a[href*="sympla.com.br"]',
  '.evento-card',
  '.eventos-destaque__nav',
].join(', ')

// Canudo de diploma — sobre o botão "Saiba mais".
const SELECTOR_DIPLOMA = '.curso-card__btn--secondary'

const SELECTOR = `${SELECTOR_CAP}, ${SELECTOR_DIPLOMA}`

const SVG_CAP = `
<svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="cap-top" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a3d70"/>
      <stop offset="55%" stop-color="#3063ad"/>
      <stop offset="100%" stop-color="#4f87d9"/>
    </linearGradient>
    <linearGradient id="cap-base" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2a4f87"/>
      <stop offset="100%" stop-color="#142a4d"/>
    </linearGradient>
    <linearGradient id="tassel-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffb946"/>
      <stop offset="100%" stop-color="#e87b1c"/>
    </linearGradient>
  </defs>

  <path d="M7 12 L7 17 C7 18.6 8.5 19.5 10 19.9 C11.2 20.2 12.6 20.4 14 20.4 C15.4 20.4 16.8 20.2 18 19.9 C19.5 19.5 21 18.6 21 17 L21 12 L14 15.5 Z"
        fill="url(#cap-base)"
        stroke="rgba(255,255,255,0.18)" stroke-width="0.4"/>

  <path d="M14 3 L25.2 9 L14 14.6 L2.8 9 Z"
        fill="url(#cap-top)"
        stroke="rgba(255,255,255,0.25)" stroke-width="0.5" stroke-linejoin="round"/>

  <path d="M14 3.6 L23 8.4 L14 13.4 L13.6 13 L21.2 8.6 L14 4.8 Z"
        fill="rgba(255,255,255,0.18)"/>

  <circle cx="19" cy="9" r="0.85" fill="#ffd86b" stroke="#b85c10" stroke-width="0.3"/>

  <g class="custom-cursor__tassel">
    <path d="M19 9 Q19.4 11.5 19.2 13.6" stroke="url(#tassel-grad)" stroke-width="1" fill="none" stroke-linecap="round"/>
    <path d="M19.2 13.6 L18.4 16.4 L19.2 16 L19.2 16.6 L20 16.2 L20 16.8 L19.4 17.4 L18.7 17 L18.2 17.5 L18.6 16.6 Z"
          fill="url(#tassel-grad)"
          stroke="#b85c10" stroke-width="0.25" stroke-linejoin="round"/>
    <circle cx="19.2" cy="13.6" r="0.55" fill="#ffd86b"/>
  </g>
</svg>
`.trim()

// URL absoluta do logo EGov, resolvida via import.meta.url para funcionar
// tanto na home (raiz) quanto nas páginas internas (pages/...).
const LOGO_URL = new URL('../../img/logo-light.png', import.meta.url).href

const SVG_DIPLOMA = `
<svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="cert-paper" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#eef2f8"/>
    </linearGradient>
    <linearGradient id="cert-header" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#4f87d9"/>
      <stop offset="100%" stop-color="#3063ad"/>
    </linearGradient>
    <linearGradient id="cert-ribbon" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#4f87d9"/>
      <stop offset="100%" stop-color="#1a3d70"/>
    </linearGradient>
  </defs>

  <g transform="rotate(-5 14 14)">
    <!-- Sombra suave do certificado -->
    <rect x="4.4" y="7.6" width="19.2" height="14" rx="1.3"
          fill="rgba(11,17,32,0.14)" transform="translate(0.4, 0.8)"/>

    <!-- Certificado (papel limpo) -->
    <rect x="4.4" y="7.6" width="19.2" height="14" rx="1.3"
          fill="url(#cert-paper)"
          stroke="#cbd3df" stroke-width="0.4"/>

    <!-- Faixa superior decorativa em azul EGov -->
    <path d="M4.4 8.8 Q4.4 7.6 5.6 7.6 L22.4 7.6 Q23.6 7.6 23.6 8.8 L23.6 10.2 L4.4 10.2 Z"
          fill="url(#cert-header)"/>

    <!-- Detalhe na faixa: pontos decorativos -->
    <g fill="rgba(255,255,255,0.6)">
      <circle cx="6.6" cy="8.95" r="0.28"/>
      <circle cx="8.4" cy="8.95" r="0.28"/>
      <circle cx="10.2" cy="8.95" r="0.28"/>
      <circle cx="17.8" cy="8.95" r="0.28"/>
      <circle cx="19.6" cy="8.95" r="0.28"/>
      <circle cx="21.4" cy="8.95" r="0.28"/>
    </g>

    <!-- LOGO EGov centralizada (peça principal) -->
    <image href="${LOGO_URL}"
           x="9.5" y="10.6" width="9" height="9"
           preserveAspectRatio="xMidYMid meet"/>

    <!-- Linhas decorativas finas (lados do logo, sugerem "selo institucional") -->
    <g stroke="#3063ad" stroke-width="0.35" stroke-linecap="round" opacity="0.5">
      <path d="M5.6 14.6 L8.8 14.6"/>
      <path d="M5.6 15.6 L7.8 15.6"/>
      <path d="M19.2 14.6 L22.4 14.6"/>
      <path d="M20.2 15.6 L22.4 15.6"/>
    </g>

    <!-- Linha de assinatura abaixo do logo -->
    <path d="M9 20.2 L19 20.2" stroke="#9aa4b5" stroke-width="0.4" stroke-linecap="round" opacity="0.7"/>

    <!-- Fita azul lateral (estilo lacre) — balança como pêndulo -->
    <g class="custom-cursor__ribbon">
      <path d="M19.6 21.0 L19.0 25.6 L20.2 24.6 L20.6 25.8 L21.4 24.5 L22.0 25.8 L22.4 24.6 L23.0 25.6 L22.0 21.0 Z"
            fill="url(#cert-ribbon)"
            stroke="rgba(0,0,0,0.32)" stroke-width="0.3" stroke-linejoin="round"/>
      <path d="M20.4 21.6 L20.1 24.4 M21.6 21.6 L21.9 24.4"
            stroke="rgba(255,255,255,0.18)" stroke-width="0.3" fill="none" stroke-linecap="round"/>
    </g>
  </g>
</svg>
`.trim()

export function initCustomCursor() {
  if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return

  const cursor = document.createElement('div')
  cursor.className = 'custom-cursor'
  cursor.setAttribute('aria-hidden', 'true')
  cursor.innerHTML = `
    <span class="custom-cursor__halo"></span>
    <span class="custom-cursor__inner">
      <span class="custom-cursor__icon custom-cursor__icon--cap">${SVG_CAP}</span>
      <span class="custom-cursor__icon custom-cursor__icon--diploma">${SVG_DIPLOMA}</span>
    </span>
  `
  document.body.appendChild(cursor)
  document.body.classList.add('js-custom-cursor')

  let mx = -200
  let my = -200
  let cx = -200
  let cy = -200
  let active = false

  // Atualiza posição imediatamente (usado na entrada para evitar "salto").
  const setPosition = (x, y) => {
    cx = x
    cy = y
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }

  // Loop sempre ativo: custo desprezível e elimina latência da partida.
  const loop = () => {
    cx += (mx - cx) * 0.25
    cy += (my - cy) * 0.25
    cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)

  document.addEventListener('mousemove', e => {
    mx = e.clientX
    my = e.clientY
  }, { passive: true })

  const applyVariant = el => {
    const diploma = !!el && !!el.closest(SELECTOR_DIPLOMA)
    cursor.classList.toggle('diploma', diploma)
    cursor.classList.toggle('cap', !diploma)
  }

  document.addEventListener('mouseover', e => {
    const target = e.target instanceof Element ? e.target.closest(SELECTOR) : null
    if (!target) return
    if (!active) {
      active = true
      mx = e.clientX
      my = e.clientY
      setPosition(mx, my)
      cursor.classList.add('visible')
    }
    applyVariant(target)
  })

  document.addEventListener('mouseout', e => {
    const from = e.target instanceof Element ? e.target.closest(SELECTOR) : null
    if (!from || !active) return
    const to = e.relatedTarget instanceof Element ? e.relatedTarget.closest(SELECTOR) : null
    if (!to) {
      active = false
      cursor.classList.remove('visible')
    } else {
      applyVariant(to)
    }
  })

  document.addEventListener('mouseleave', () => {
    if (active) {
      active = false
      cursor.classList.remove('visible')
    }
  })

  // Balançada do cursor — disparada por outros módulos (ex.: setas do carrossel).
  let shakeTimer = null
  const triggerShake = () => {
    cursor.classList.remove('is-shaking')
    void cursor.offsetWidth // reflow para reiniciar em cliques consecutivos
    cursor.classList.add('is-shaking')
    if (shakeTimer) clearTimeout(shakeTimer)
    shakeTimer = setTimeout(() => cursor.classList.remove('is-shaking'), 720)
  }
  document.addEventListener('cursor:shake', triggerShake)

}
