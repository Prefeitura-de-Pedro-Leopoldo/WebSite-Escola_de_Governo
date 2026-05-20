/* ========================================
   Notícias - Feed dinâmico
   Gera 1 card de notícia para cada curso/evento em cursos.json,
   com texto/CTA/categoria adaptados ao status do curso.
   Imagens vêm de assets/data/midias.json (auto-detectadas).
   ======================================== */

import { getStatus, cursoDate, temDataDefinida, getLinkInscricao } from "./curso-utils.js"

const DATA_URL = new URL("../../data/cursos.json", import.meta.url)
const MIDIAS_URL = new URL("../../data/midias.json", import.meta.url)

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  )
}

const MESES_NUM = {
  janeiro: 0, fevereiro: 1, marco: 2, "março": 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11
}

function isMesPassadoOuAtual(curso) {
  const mes = MESES_NUM[(curso.mes || "").toLowerCase()]
  if (mes == null) return true
  const hoje = new Date()
  return mes <= hoje.getMonth()
}

// getStatus, cursoDate, temDataDefinida e getLinkInscricao importados de ./curso-utils.js

const DOIS_DIGITOS = n => String(n).padStart(2, "0")

function formatarData(date) {
  if (!date) return { iso: "", curto: "" }
  const ano = date.getFullYear()
  const mes = DOIS_DIGITOS(date.getMonth() + 1)
  const dia = DOIS_DIGITOS(date.getDate())
  return { iso: `${ano}-${mes}-${dia}`, curto: `${dia}/${mes}/${ano}` }
}

function tituloPorStatus(curso, status) {
  switch (status) {
    case "abertas":    return `Inscrições abertas: ${curso.titulo}`
    case "convocacao": return `Convocação: ${curso.titulo}`
    case "em-breve":   return `Em breve: ${curso.titulo}`
    case "realizado":  return `${curso.titulo}`
    default:           return curso.titulo
  }
}

function ctaPorStatus(curso, status, opts = {}) {
  const detalheHref = `curso.html?id=${encodeURIComponent(curso.id)}`
  if (status === "abertas") {
    const link = getLinkInscricao(curso)
    if (link && !/docs\.google\.com\/forms/i.test(link)) {
      return { href: link, label: "Inscreva-se", target: "_blank", rel: "noopener" }
    }
    // Forms ou sem link → vai pra página do curso (onde abre o modal)
    return { href: detalheHref, label: "Inscreva-se" }
  }
  if (status === "realizado" && opts.temFotos) return { href: detalheHref, label: "Ver registros" }
  return { href: detalheHref, label: "Saiba mais" }
}

const ROTULOS = {
  abertas: "Inscrições abertas",
  convocacao: "Convocação",
  "em-breve": "Em breve",
  realizado: "Evento realizado"
}

function excerto(curso) {
  const d = curso.detalhe || {}
  if (d.dataExtenso && d.local) {
    return `Realização em ${d.dataExtenso}, ${d.local}. ${curso.descricao || ""}`.trim()
  }
  if (d.dataExtenso) {
    return `Realização em ${d.dataExtenso}. ${curso.descricao || ""}`.trim()
  }
  return curso.descricao || ""
}

function buildCard(curso, status, imgSrc, opts = {}) {
  const data = temDataDefinida(curso) ? formatarData(cursoDate(curso)) : { iso: "", curto: "" }
  const cta = ctaPorStatus(curso, status, opts)
  const titulo = tituloPorStatus(curso, status)
  const rotulo = ROTULOS[status] || "Cursos"
  const targetAttr = cta.target ? ` target="${cta.target}" rel="${cta.rel || "noopener"}"` : ""
  const mediaHtml = imgSrc
    ? `<div class="noticia-card__media noticia-card__media--cursos noticia-card__media--image" aria-hidden="true">
         <span class="noticia-card__frame">
           <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(curso.titulo)}" loading="lazy" decoding="async" />
         </span>
       </div>`
    : `<div class="noticia-card__media noticia-card__media--cursos" aria-hidden="true">
         <div class="noticia-card__media-icon"><i class="${curso.icone || "fas fa-book"}"></i></div>
       </div>`

  return `
    <article class="noticia-card" data-category="cursos" data-status="${status}">
      ${mediaHtml}
      <div class="noticia-card__body">
        <div class="noticia-meta">
          <span class="noticia-kicker">${escapeHtml(rotulo)}</span>
          ${data.iso ? `<time class="noticia-data" datetime="${data.iso}">${data.curto}</time>` : ""}
        </div>
        <h3 class="noticia-card__title">${escapeHtml(titulo)}</h3>
        <p class="noticia-card__excerpt">${escapeHtml(excerto(curso))}</p>
        <a href="${escapeHtml(cta.href)}" class="noticia-card__cta"${targetAttr}>
          ${escapeHtml(cta.label)}
          <i class="fas fa-arrow-right" aria-hidden="true"></i>
        </a>
      </div>
    </article>
  `
}

function coletarCursos(data) {
  const out = []
  for (const eixoKey of Object.keys(data.eixos || {})) {
    for (const trilha of data.eixos[eixoKey].trilhas || []) {
      for (const curso of trilha.cursos || []) out.push(curso)
    }
  }
  return out
}

const ORDEM_STATUS = { abertas: 0, convocacao: 1, "em-breve": 2, realizado: 3 }

export async function initNoticiasFeed() {
  const grid = document.querySelector("[data-noticias-grid]")
  if (!grid) return

  const basePath = grid.dataset.basePath || ""

  let data
  try {
    const res = await fetch(DATA_URL)
    if (!res.ok) throw new Error("HTTP " + res.status)
    data = await res.json()
  } catch (err) {
    console.error("Falha ao carregar cursos.json em noticias-feed", err)
    return
  }

  let midias = {}
  try {
    const res = await fetch(MIDIAS_URL)
    if (res.ok) midias = await res.json()
  } catch {
    /* opcional */
  }

  const cursos = coletarCursos(data).filter(isMesPassadoOuAtual)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const FAR = Number.MAX_SAFE_INTEGER

  const itens = cursos.map(curso => ({
    curso,
    status: getStatus(curso),
    date: cursoDate(curso)
  }))

  itens.sort((a, b) => {
    const diff = (ORDEM_STATUS[a.status] ?? 9) - (ORDEM_STATUS[b.status] ?? 9)
    if (diff !== 0) return diff
    // Futuros: data mais próxima primeiro. Passados: mais recentes primeiro.
    const tA = a.date ? a.date.getTime() : FAR
    const tB = b.date ? b.date.getTime() : FAR
    if (a.status === "realizado") return tB - tA
    return tA - tB
  })

  const html = itens
    .map(({ curso, status }) => {
      const m = midias[curso.id] || {}
      const d = curso.detalhe || {}
      const imgSrc = m.flyerCarrossel || m.flyer || d.flyerCarrossel || d.flyer
      const src = imgSrc ? `${basePath}${imgSrc}` : ""
      const temFotos = Boolean(m.galeria && Array.isArray(m.galeria.fotos) && m.galeria.fotos.length)
      return buildCard(curso, status, src, { temFotos })
    })
    .join("")

  grid.innerHTML = html
}
