/* ========================================
   Curso Detalhe
   Renderiza a pagina pages/curso.html a partir de ?id=<curso.id>
   lendo assets/data/cursos.json.
   ======================================== */

const DATA_URL = new URL("../../data/cursos.json", import.meta.url)
const MIDIAS_URL = new URL("../../data/midias.json", import.meta.url)

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    c =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[c]
  )
}

function findCurso(data, id) {
  for (const eixoKey of Object.keys(data.eixos || {})) {
    const eixo = data.eixos[eixoKey]
    for (const trilha of eixo.trilhas || []) {
      const curso = (trilha.cursos || []).find(c => c.id === id)
      if (curso) return { curso, eixoKey, eixoNome: eixo.nome }
    }
  }
  return null
}

function buildNotFound(id) {
  return `
    <section class="page-banner" aria-labelledby="page-title">
      <div class="page-banner__bg page-banner__bg--eixos" aria-hidden="true"></div>
      <div class="container">
        <nav class="breadcrumb" aria-label="Você está em">
          <a href="../index.html">Início</a>
          <i class="fas fa-chevron-right" aria-hidden="true"></i>
          <a href="eixos.html">Eixos e Cursos</a>
          <i class="fas fa-chevron-right" aria-hidden="true"></i>
          <span>Curso não encontrado</span>
        </nav>
        <h1 id="page-title">Curso não encontrado</h1>
        <p>Não localizamos um curso com o identificador <strong>${escapeHtml(id || "(vazio)")}</strong>.</p>
      </div>
    </section>
    <section class="section-content">
      <div class="container">
        <div class="back-link">
          <a href="eixos.html"><i class="fas fa-arrow-left"></i> Voltar para Eixos e Cursos</a>
        </div>
      </div>
    </section>
  `
}

function eixoSlug(eixoKey) {
  // Mapa simples para o banner-bg do eixo
  const known = ["governanca", "licitacoes", "atendimento", "planejamento", "controle-interno", "governo-digital", "protecao-dados", "lideranca", "sustentabilidade"]
  return known.includes(eixoKey) ? eixoKey : "eixos"
}

function buildPage({ curso, eixoKey, eixoNome }) {
  const d = curso.detalhe || {}
  const flyer = d.flyer ? `../${d.flyer}` : ""
  const modalidade = curso.modalidade === "ead" ? "EAD" : "Presencial"
  const inscricaoBtn = curso.inscricaoUrl
    ? `<a class="curso-detalhe__cta curso-detalhe__cta--primary" href="${curso.inscricaoUrl}" target="_blank" rel="noopener">
         <i class="fas fa-ticket-alt"></i> ${escapeHtml(curso.inscricaoLabel || "Inscrever-se no Sympla")}
       </a>`
    : ""

  const eixoHref = `${eixoKey}.html`
  const bannerBg = eixoSlug(eixoKey)

  const galeria = d.galeria && Array.isArray(d.galeria.fotos) && d.galeria.fotos.length ? d.galeria : null

  function renderItem(f, indexNoLightbox, isClone, eager) {
    const loadAttr = eager ? `loading="eager" fetchpriority="high"` : `loading="lazy"`
    return `
      <button type="button" class="curso-detalhe__mural-item${isClone ? " curso-detalhe__mural-item--clone" : ""}"
              data-mural-item data-index="${indexNoLightbox}"
              aria-label="Ampliar foto${f.alt ? `: ${escapeHtml(f.alt)}` : ""}"${isClone ? " tabindex=\"-1\"" : ""}>
        <img src="../${encodeURI(f.src)}" alt="${escapeHtml(f.alt || "")}" ${loadAttr} decoding="async" draggable="false" />
      </button>`
  }

  function renderRow(fotos, startIdx, direction) {
    // Primeiras 8 fotos eager (preenchem viewport instantaneamente), resto lazy.
    const originais = fotos.map((f, i) => renderItem(f, startIdx + i, false, i < 8)).join("")
    const clones = fotos.map((f, i) => renderItem(f, startIdx + i, true, false)).join("")
    return `
      <div class="curso-detalhe__mural-row">
        <div class="curso-detalhe__mural-track" data-mural-track data-direction="${direction}">${originais}${clones}</div>
      </div>`
  }

  let galeriaHtml = ""
  if (galeria) {
    const fotos = galeria.fotos
    const meio = Math.ceil(fotos.length / 2)
    const linha1 = fotos.slice(0, meio)
    const linha2 = fotos.slice(meio)
    galeriaHtml = `
      <section class="curso-detalhe__galeria" aria-labelledby="galeria-titulo">
        <header class="curso-detalhe__galeria-header">
          <h2 id="galeria-titulo"><i class="fas fa-images" aria-hidden="true"></i> ${escapeHtml(galeria.titulo || "Mural de fotos")}</h2>
          ${galeria.descricao ? `<p>${escapeHtml(galeria.descricao)}</p>` : ""}
        </header>
        <div class="curso-detalhe__mural" data-mural>
          ${renderRow(linha1, 0, "right")}
          <button type="button" class="curso-detalhe__mural-nav curso-detalhe__mural-nav--left" data-mural-nav="left" aria-label="Voltar fotos">
            <i class="fas fa-chevron-left" aria-hidden="true"></i>
          </button>
          <button type="button" class="curso-detalhe__mural-nav curso-detalhe__mural-nav--right" data-mural-nav="right" aria-label="Avançar fotos">
            <i class="fas fa-chevron-right" aria-hidden="true"></i>
          </button>
          ${renderRow(linha2, linha1.length, "left")}
        </div>
      </section>`
  }

  return `
    <section class="page-banner page-banner--eixo" aria-labelledby="page-title">
      <div class="page-banner__bg page-banner__bg--${bannerBg}" aria-hidden="true"></div>
      <div class="container">
        <nav class="breadcrumb" aria-label="Você está em">
          <a href="../index.html">Início</a>
          <i class="fas fa-chevron-right" aria-hidden="true"></i>
          <a href="eixos.html">Eixos e Cursos</a>
          <i class="fas fa-chevron-right" aria-hidden="true"></i>
          <a href="${eixoHref}">${escapeHtml(eixoNome || "Eixo")}</a>
          <i class="fas fa-chevron-right" aria-hidden="true"></i>
          <span>${escapeHtml(curso.titulo)}</span>
        </nav>
        <div class="page-banner__eixo-header">
          <div class="page-banner__icon">
            <i class="${curso.icone || "fas fa-book"}" aria-hidden="true"></i>
          </div>
          <div>
            <h1 id="page-title">${escapeHtml(curso.titulo)}</h1>
            <p>${escapeHtml(curso.descricao || "")}</p>
          </div>
        </div>
        <div class="page-banner__meta">
          <span><i class="fas fa-chalkboard" aria-hidden="true"></i> ${escapeHtml(modalidade)}</span>
          ${curso.responsavel ? `<span><i class="fas fa-building" aria-hidden="true"></i> ${escapeHtml(curso.responsavel)}</span>` : ""}
          ${d.dataExtenso ? `<span><i class="fas fa-calendar-day" aria-hidden="true"></i> ${escapeHtml(d.dataExtenso)}</span>` : ""}
        </div>
      </div>
    </section>

    <section class="section-content curso-detalhe">
      <div class="container">
        <div class="curso-detalhe__grid">
          <aside class="curso-detalhe__aside">
            ${flyer ? `<div class="curso-detalhe__flyer"><img src="${flyer}" alt="Cartaz do curso ${escapeHtml(curso.titulo)}" loading="lazy" decoding="async" /></div>` : ""}
            ${inscricaoBtn ? `<div class="curso-detalhe__actions">${inscricaoBtn}</div>` : ""}
          </aside>

          <article class="curso-detalhe__content">
            ${
              curso.descricao
                ? `<div class="curso-detalhe__ementa">
                     <span class="curso-detalhe__ementa-label"><i class="fas fa-bookmark" aria-hidden="true"></i> Ementa Sintética</span>
                     <p>${escapeHtml(curso.descricao)}</p>
                   </div>`
                : ""
            }
          </article>
        </div>

        ${galeriaHtml}

        <div class="back-link">
          <a href="${eixoHref}"><i class="fas fa-arrow-left"></i> Voltar para ${escapeHtml(eixoNome || "o eixo")}</a>
        </div>
      </div>
    </section>
  `
}

export async function initCursoDetalhe() {
  const root = document.querySelector("[data-curso-detalhe]")
  if (!root) return

  const params = new URLSearchParams(window.location.search)
  const id = params.get("id") || ""

  let data
  try {
    const res = await fetch(DATA_URL)
    if (!res.ok) throw new Error("HTTP " + res.status)
    data = await res.json()
  } catch (err) {
    console.error("Falha ao carregar cursos.json", err)
    root.innerHTML = buildNotFound(id)
    return
  }

  // Mídias auto-detectadas a partir das pastas em assets/img/cursos/<curso-id>/.
  // Arquivo gerado em build time por scripts/gerar-galerias.mjs.
  let midias = {}
  try {
    const res = await fetch(MIDIAS_URL)
    if (res.ok) midias = await res.json()
  } catch {
    /* opcional */
  }

  const match = findCurso(data, id)
  if (!match) {
    root.innerHTML = buildNotFound(id)
    return
  }

  // Mescla: o auto-detectado preenche apenas o que não está hardcoded no JSON.
  const auto = midias[match.curso.id]
  if (auto) {
    const d = (match.curso.detalhe = match.curso.detalhe || {})
    if (!d.flyer && auto.flyer) d.flyer = auto.flyer
    if (!d.flyerCarrossel && auto.flyerCarrossel) d.flyerCarrossel = auto.flyerCarrossel
    if (!d.galeria && auto.galeria) d.galeria = auto.galeria
  }

  root.innerHTML = buildPage(match)
  document.title = `${match.curso.titulo} · Escola de Governo Pedro Leopoldo`

  const galeriaAtual = match.curso.detalhe && match.curso.detalhe.galeria
  initMuralAutoScroll(root)
  initMuralLightbox(root, galeriaAtual)
}

function initMuralAutoScroll(root) {
  const tracks = Array.from(root.querySelectorAll("[data-mural-track]"))
  if (!tracks.length) return
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  // Velocidade base do auto-scroll (px por frame ≈ 60fps).
  // dir = +1: scrollLeft cresce → conteúdo desliza p/ esquerda → fotos vão p/ esquerda
  // dir = -1: scrollLeft diminui → conteúdo desliza p/ direita → fotos vão p/ direita
  const VELOCIDADE = 1.2

  const controles = tracks.map(track => {
    // direction="right" significa "fotos vão para a direita" → dir = -1
    const dir = track.dataset.direction === "right" ? -1 : 1
    let pausadoAuto = false
    let boostRestante = 0
    let boostSentido = 1
    let half = 0 // cacheado — recalculado em resize / load

    function recalcularHalf() {
      half = track.scrollWidth / 2
      // Renormaliza para garantir que scrollLeft esteja em [0, half)
      if (half > 0) {
        let s = track.scrollLeft
        if (s >= half) s -= half
        if (s < 0) s += half
        track.scrollLeft = s
      }
    }

    // Recalcula quando imagens carregarem (lazy) e quando a tela mudar
    new ResizeObserver(recalcularHalf).observe(track)
    track.querySelectorAll("img").forEach(img => {
      if (!img.complete) img.addEventListener("load", recalcularHalf, { once: true })
    })

    // Pausa só com mouse desktop sobre a track
    track.addEventListener("pointerenter", e => {
      if (e.pointerType === "mouse") pausadoAuto = true
    })
    track.addEventListener("pointerleave", () => { pausadoAuto = false })

    function tick() {
      if (half <= 0) {
        recalcularHalf()
        return
      }
      let proximo = track.scrollLeft

      if (boostRestante > 0) {
        const passo = Math.max(2, Math.min(boostRestante * 0.12, 18))
        proximo += passo * boostSentido
        boostRestante -= passo
        if (boostRestante < 0.5) boostRestante = 0
      } else if (!pausadoAuto) {
        proximo += VELOCIDADE * dir
      } else {
        return
      }

      // Wrap manual: mantém scrollLeft em [0, half). Content é duplicado.
      // Browser proíbe scrollLeft < 0 — wrap antes de atribuir.
      if (proximo >= half) proximo -= half
      else if (proximo < 0) proximo += half
      track.scrollLeft = proximo
    }

    function ativarBoost(sentidoExterno) {
      // sentidoExterno: +1 = fotos vão p/ direita visualmente, -1 = vão p/ esquerda
      // Para mover fotos p/ direita visualmente, scrollLeft diminui → boostSentido = -1
      const item = track.querySelector(".curso-detalhe__mural-item")
      const itemLargura = item ? item.getBoundingClientRect().width : 280
      const gap = 12
      boostRestante = (itemLargura + gap) * 3
      boostSentido = sentidoExterno === 1 ? -1 : 1
    }

    return { tick, ativarBoost }
  })

  // Setas — left/right movem ambas as linhas no mesmo sentido visual
  const navBtns = root.querySelectorAll("[data-mural-nav]")
  navBtns.forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation()
      // "left" = mover fotos para a direita (chevron aponta p/ esquerda = mostrar fotos da esquerda → fotos andam p/ direita)
      // "right" = mover fotos para a esquerda
      const sentido = btn.dataset.muralNav === "left" ? 1 : -1
      controles.forEach(c => c.ativarBoost(sentido))
      document.dispatchEvent(new CustomEvent("cursor:shake"))
    })
  })

  if (!reduceMotion) {
    let rafId
    const loop = () => {
      controles.forEach(c => c.tick())
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
  }
}

function initMuralLightbox(root, galeria) {
  if (!galeria || !Array.isArray(galeria.fotos) || !galeria.fotos.length) return
  const itens = root.querySelectorAll("[data-mural-item]")
  if (!itens.length) return

  const overlay = document.createElement("div")
  overlay.className = "curso-detalhe__lightbox"
  overlay.setAttribute("role", "dialog")
  overlay.setAttribute("aria-modal", "true")
  overlay.setAttribute("aria-label", "Visualizador de foto")
  overlay.hidden = true
  overlay.innerHTML = `
    <button type="button" class="curso-detalhe__lightbox-close" data-lb-close aria-label="Fechar"><i class="fas fa-times" aria-hidden="true"></i></button>
    <button type="button" class="curso-detalhe__lightbox-nav curso-detalhe__lightbox-nav--prev" data-lb-prev aria-label="Foto anterior"><i class="fas fa-chevron-left" aria-hidden="true"></i></button>
    <figure class="curso-detalhe__lightbox-figure">
      <img data-lb-img alt="" />
      <figcaption data-lb-caption></figcaption>
    </figure>
    <button type="button" class="curso-detalhe__lightbox-nav curso-detalhe__lightbox-nav--next" data-lb-next aria-label="Próxima foto"><i class="fas fa-chevron-right" aria-hidden="true"></i></button>
  `
  document.body.appendChild(overlay)

  const imgEl = overlay.querySelector("[data-lb-img]")
  const capEl = overlay.querySelector("[data-lb-caption]")
  let idx = 0

  function render() {
    const f = galeria.fotos[idx]
    if (!f) return
    imgEl.src = "../" + encodeURI(f.src)
    imgEl.alt = f.alt || ""
    capEl.textContent = f.alt || ""
  }
  function open(i) {
    idx = i
    render()
    overlay.hidden = false
    document.body.style.overflow = "hidden"
  }
  function close() {
    overlay.hidden = true
    document.body.style.overflow = ""
  }
  function prev() {
    idx = (idx - 1 + galeria.fotos.length) % galeria.fotos.length
    render()
  }
  function next() {
    idx = (idx + 1) % galeria.fotos.length
    render()
  }

  itens.forEach(btn => {
    btn.addEventListener("click", () => open(parseInt(btn.dataset.index, 10) || 0))
  })
  overlay.querySelector("[data-lb-close]").addEventListener("click", close)
  overlay.querySelector("[data-lb-prev]").addEventListener("click", prev)
  overlay.querySelector("[data-lb-next]").addEventListener("click", next)
  overlay.addEventListener("click", e => {
    if (e.target === overlay) close()
  })
  document.addEventListener("keydown", e => {
    if (overlay.hidden) return
    if (e.key === "Escape") close()
    else if (e.key === "ArrowLeft") prev()
    else if (e.key === "ArrowRight") next()
  })
}
