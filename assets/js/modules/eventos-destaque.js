/* ========================================
   Eventos em Destaque (home) - carrossel 3D estilo Sympla
   Usa Swiper.js (effect: 'creative') via CDN global.
   ======================================== */

const DATA_URL = new URL("../../data/cursos.json", import.meta.url)

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  )
}

const MESES_NUM = {
  janeiro: 0, fevereiro: 1, marco: 2, "março": 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
}

function cursoDate(curso) {
  const d = curso.detalhe || {}
  // dataExtenso: "23 de abril de 2026"
  const ext = d.dataExtenso && d.dataExtenso.match(/^(\d{1,2})\s+de\s+([a-zçãéíóúâêô]+)\s+de\s+(\d{4})/i)
  if (ext) {
    const mes = MESES_NUM[ext[2].toLowerCase()]
    if (mes != null) return new Date(Number(ext[3]), mes, Number(ext[1]))
  }
  // data: "07/05" + mes contém ano? não. Assumimos ano corrente do cronograma (2026).
  if (curso.data) {
    const m = curso.data.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/)
    if (m) {
      const ano = m[3] ? Number(m[3]) : 2026
      return new Date(ano, Number(m[2]) - 1, Number(m[1]))
    }
  }
  return null
}

function isPast(curso) {
  const date = cursoDate(curso)
  if (!date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}

function getStatus(curso) {
  if (curso.inscricaoLabel && /encerrad|realizad/i.test(curso.inscricaoLabel)) return "realizado"
  if (isPast(curso)) return "realizado"
  if (curso.inscricaoLabel && /convoca/i.test(curso.inscricaoLabel)) return "convocacao"
  if (curso.emBreve) return "em-breve"
  if (curso.inscricaoUrl) return "abertas"
  return null
}

const STATUS_LABEL = {
  abertas: "Inscrições abertas",
  convocacao: "Convocação",
  "em-breve": "Em breve",
  realizado: "Evento realizado",
}

function collectEventos(data) {
  const list = []
  const order = { abertas: 0, convocacao: 1, "em-breve": 2, realizado: 3 }
  for (const eixoKey of Object.keys(data.eixos || {})) {
    const eixo = data.eixos[eixoKey]
    for (const trilha of eixo.trilhas || []) {
      for (const curso of trilha.cursos || []) {
        if (!curso.destaqueHome) continue
        const status = getStatus(curso)
        if (status) list.push({ curso, eixoKey, status })
      }
    }
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const FAR_FUTURE = Number.MAX_SAFE_INTEGER

  // Ordena por status (abertas → convocação → em breve → realizado) e,
  // dentro do mesmo status, pela data mais próxima de hoje (futuras primeiro,
  // ascendente; eventos sem data vão para o fim do grupo).
  list.sort((a, b) => {
    const statusDiff = order[a.status] - order[b.status]
    if (statusDiff !== 0) return statusDiff
    const dA = cursoDate(a.curso)
    const dB = cursoDate(b.curso)
    const keyA = dA ? Math.abs(dA.getTime() - today.getTime()) : FAR_FUTURE
    const keyB = dB ? Math.abs(dB.getTime() - today.getTime()) : FAR_FUTURE
    return keyA - keyB
  })
  return list
}

function formatDateBadge(dataExtenso) {
  if (!dataExtenso) return null
  const m = dataExtenso.match(/^(\d{1,2})\s+de\s+([a-zçãéíóúâêô]+)/i)
  if (!m) return null
  const meses = {
    janeiro: "JAN", fevereiro: "FEV", marco: "MAR", "março": "MAR",
    abril: "ABR", maio: "MAI", junho: "JUN", julho: "JUL",
    agosto: "AGO", setembro: "SET", outubro: "OUT", novembro: "NOV", dezembro: "DEZ"
  }
  return { dia: m[1], mes: meses[m[2].toLowerCase()] || m[2].slice(0, 3).toUpperCase() }
}

function buildSlide({ curso, status }, basePath) {
  const d = curso.detalhe || {}
  const flyerSrc = d.flyerCarrossel || d.flyer
  const flyer = flyerSrc ? encodeURI(`${basePath}${flyerSrc}`) : ""
  const detalheHref = `${basePath}pages/curso.html?id=${encodeURIComponent(curso.id)}`
  const badge = formatDateBadge(d.dataExtenso) || formatDateFromData(curso.data, curso.mes)
  const pillLabel = STATUS_LABEL[status] || "Inscrições abertas"
  // Local/data podem vir do detalhe; se não tiver, mostra mês/responsável como fallback
  const localTxt = d.local || ""
  const dataTxt = d.dataExtenso
    ? `${d.dataExtenso}${d.horario ? ` às ${d.horario}` : ""}`
    : curso.data
      ? `${curso.data}${curso.mes ? `/${curso.mes}` : ""}`
      : curso.mes
        ? curso.mes.charAt(0).toUpperCase() + curso.mes.slice(1)
        : ""

  return `
    <div class="swiper-slide evento-slide" data-status="${status}">
      <a href="${detalheHref}" class="evento-card" data-card aria-label="Saiba mais sobre ${escapeHtml(curso.titulo)}">
        <div class="evento-card__media">
          ${flyer
            ? `<img src="${flyer}" alt="${escapeHtml(curso.titulo)}" loading="lazy" decoding="async" />`
            : `<div class="evento-card__media-fallback"><i class="${curso.icone || "fas fa-book"}"></i></div>`}
          ${badge ? `<div class="evento-card__date"><span class="evento-card__date-dia">${escapeHtml(badge.dia)}</span><span class="evento-card__date-mes">${escapeHtml(badge.mes)}</span></div>` : ""}
          <span class="evento-card__pill evento-card__pill--${status}">${escapeHtml(pillLabel)}</span>
        </div>
      </a>
      <div class="evento-info">
        <h3 class="evento-info__title">${escapeHtml(curso.titulo)}</h3>
        <ul class="evento-info__meta">
          ${localTxt ? `<li><i class="fas fa-map-marker-alt" aria-hidden="true"></i> ${escapeHtml(localTxt)}</li>` : ""}
          ${dataTxt ? `<li><i class="fas fa-calendar-alt" aria-hidden="true"></i> ${escapeHtml(dataTxt)}</li>` : ""}
        </ul>
      </div>
    </div>
  `
}

function formatDateFromData(dataStr, mes) {
  // "07/05" -> { dia: "07", mes: "MAI" }
  if (!dataStr) {
    if (mes) {
      const m = String(mes).toLowerCase()
      const meses = { janeiro: "JAN", fevereiro: "FEV", marco: "MAR", "março": "MAR", abril: "ABR", maio: "MAI", junho: "JUN", julho: "JUL", agosto: "AGO", setembro: "SET", outubro: "OUT", novembro: "NOV", dezembro: "DEZ" }
      return meses[m] ? { dia: "", mes: meses[m] } : null
    }
    return null
  }
  const m = dataStr.match(/^(\d{1,2})\/(\d{1,2})/)
  if (!m) return null
  const mesesNum = { "01": "JAN", "02": "FEV", "03": "MAR", "04": "ABR", "05": "MAI", "06": "JUN", "07": "JUL", "08": "AGO", "09": "SET", "10": "OUT", "11": "NOV", "12": "DEZ" }
  return { dia: m[1].padStart(2, "0"), mes: mesesNum[m[2].padStart(2, "0")] || "" }
}

function buildCarousel(eventos, basePath) {
  // Duplicamos a lista até termos uma quantidade alta de slides — assim:
  //  1) Swiper habilita o loop com folga (precisa de slides suficientes com
  //     slidesPerView: "auto" + effect: "creative").
  //  2) Com `dynamicBullets`, as bolinhas formam uma faixa longa que desliza
  //     conforme o usuário navega, dando a sensação de "track infinito" —
  //     o usuário nunca vê uma "borda" próxima do começo ou fim.
  //  3) Com `limitProgress: 1` (3 cards visíveis), os duplicados ficam a
  //     `eventos.length` posições de distância — nunca aparecem juntos.
  let lista = eventos
  while (lista.length < 16) lista = lista.concat(eventos)
  const slides = lista.map(e => buildSlide(e, basePath)).join("")
  return `
    <div class="eventos-destaque__carousel">
      <div class="swiper eventos-destaque__swiper">
        <div class="swiper-wrapper">
          ${slides}
        </div>
      </div>
      <button class="eventos-destaque__nav eventos-destaque__nav--prev" type="button" aria-label="Eventos anteriores">
        <i class="fas fa-chevron-left" aria-hidden="true"></i>
      </button>
      <button class="eventos-destaque__nav eventos-destaque__nav--next" type="button" aria-label="Próximos eventos">
        <i class="fas fa-chevron-right" aria-hidden="true"></i>
      </button>
      <div class="eventos-destaque__pagination"></div>
    </div>
  `
}

function waitForSwiper(timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    if (window.Swiper) return resolve(window.Swiper)
    const start = Date.now()
    const id = setInterval(() => {
      if (window.Swiper) {
        clearInterval(id)
        resolve(window.Swiper)
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(id)
        reject(new Error("Swiper não carregou"))
      }
    }, 50)
  })
}

function initSwiper(root) {
  const el = root.querySelector(".eventos-destaque__swiper")
  const prev = root.querySelector(".eventos-destaque__nav--prev")
  const next = root.querySelector(".eventos-destaque__nav--next")
  const pag = root.querySelector(".eventos-destaque__pagination")
  if (!el) return

  // Ao clicar nas setas, dispara evento para o cursor customizado
  // executar uma "balançada" — feedback visual na interação.
  const triggerCursorShake = () => {
    document.dispatchEvent(new CustomEvent("cursor:shake"))
  }
  prev && prev.addEventListener("click", triggerCursorShake)
  next && next.addEventListener("click", triggerCursorShake)

  new window.Swiper(el, {
    effect: "creative",
    grabCursor: true,
    centeredSlides: true,
    loop: true,
    loopAdditionalSlides: 4,
    rewind: false,
    slidesPerView: "auto",
    watchSlidesProgress: true,
    // limitProgress: 3 = até 3 níveis de profundidade visíveis de cada lado
    // (igual Sympla: ativo + 3 cards encadeados em cada direção)
    creativeEffect: {
      limitProgress: 1,
      // Cada nível é interpolado pelo Swiper:
      // nível 1: scale 0.85, translate 60%
      // nível 2: scale 0.7,  translate 120%
      prev: {
        origin: "right center",
        translate: ["-60%", 0, -100],
        scale: 0.7,
        opacity: 1,
      },
      next: {
        origin: "left center",
        translate: ["60%", 0, -100],
        scale: 0.7,
        opacity: 1,
      },
    },
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },
    keyboard: { enabled: true },
    navigation: { prevEl: prev, nextEl: next },
    pagination: {
      el: pag,
      clickable: true,
      dynamicBullets: true,
      dynamicMainBullets: 3,
    },
  })
}

export async function initEventosDestaque() {
  const root = document.querySelector("[data-eventos-destaque]")
  if (!root) return

  const basePath = root.dataset.basePath || ""

  let data
  try {
    const res = await fetch(DATA_URL)
    if (!res.ok) throw new Error("HTTP " + res.status)
    data = await res.json()
  } catch (err) {
    console.error("Falha ao carregar cursos.json em eventos-destaque", err)
    root.remove()
    return
  }

  const eventos = collectEventos(data)
  if (!eventos.length) {
    root.remove()
    return
  }

  const slot = root.querySelector("[data-eventos-destaque-slot]") || root
  slot.innerHTML = buildCarousel(eventos, basePath)

  try {
    await waitForSwiper()
    initSwiper(slot)
  } catch (err) {
    console.error(err)
  }
}
