/* ========================================
   Cursos Render
   Le assets/data/cursos.json e renderiza os cards
   nos containers <div class="cursos-grid" data-cursos-eixo="..."></div>
   ======================================== */

import { openFormModal } from "./form-modal.js"
import { getStatus, descreverLink, isLinkSympla } from "./curso-utils.js"

const DATA_URL = new URL("../../data/cursos.json", import.meta.url)

function buildModalidadeTag(modalidade) {
  const isEad = modalidade === "ead"
  const label = isEad ? "EAD" : "Presencial"
  const cls = isEad ? "curso-card__modalidade--ead" : "curso-card__modalidade--presencial"
  return `<span class="curso-card__modalidade ${cls}">${label}</span>`
}

let formsDefault = {}

const ROTULOS_STATUS = {
  realizado: "Evento realizado",
  convocacao: "Convocação",
  "em-breve": "Inscrições liberadas em breve"
}

function buildFooter(curso) {
  const status = getStatus(curso)
  const detalheBtn = curso.detalhe
    ? `
      <a class="curso-card__btn curso-card__btn--secondary" href="curso.html?id=${encodeURIComponent(curso.id)}">
        <i class="fas fa-circle-info"></i> Saiba mais
      </a>
    `
    : ""

  // Status não-clicáveis (em-breve, convocação, realizado)
  if (status !== "abertas") {
    const label = curso.inscricaoLabel || ROTULOS_STATUS[status] || "Inscrições liberadas em breve"
    return `
      <span class="curso-card__cta curso-card__cta--soon" aria-disabled="true">
        ${escapeHtml(label)}
      </span>
      ${detalheBtn}
    `
  }

  // Status "abertas" — descobre o tipo de link
  const link = descreverLink(curso, formsDefault)
  if (!link) {
    return `
      <span class="curso-card__cta curso-card__cta--soon" aria-disabled="true">Inscrições liberadas em breve</span>
      ${detalheBtn}
    `
  }

  // Forms → abre em modal embed
  if (link.tipo === "forms") {
    const certUrl = curso.certificadoUrl || formsDefault.certificadoUrl || ""
    const acesso = curso.acessoCursoUrl || ""
    const segundo = curso.modalidade === "ead" && certUrl
      ? `<a class="curso-card__btn curso-card__btn--secondary" href="${certUrl}" target="_blank" rel="noopener"
            title="Abre em nova aba - exige login Google para anexar o PDF">
           <i class="fas fa-file-upload"></i> Entregar certificado
         </a>`
      : detalheBtn
    return `
      <button type="button" class="curso-card__btn curso-card__btn--primary"
              data-form-open data-src="${escapeHtml(link.href)}"
              data-title="Inscrição - ${escapeHtml(curso.titulo)}"
              data-acesso="${escapeHtml(acesso)}">
        <i class="fas fa-edit"></i> Inscrever-se
      </button>
      ${segundo}
    `
  }

  // Externo (Sympla, Enap, etc.)
  const isSympla = isLinkSympla(link.href)
  const label = curso.inscricaoLabel ||
    (isSympla ? "Inscrever-se no Sympla" :
     curso.modalidade === "ead" ? "Acessar curso" :
     "Inscrever-se")
  const icone = isSympla ? "fas fa-ticket-alt" :
    curso.modalidade === "ead" ? "fas fa-external-link-alt" :
    "fas fa-ticket-alt"
  return `
    <a class="curso-card__btn curso-card__btn--primary" href="${escapeHtml(link.href)}" target="_blank" rel="noopener">
      <i class="${icone}"></i> ${escapeHtml(label)}
    </a>
    ${detalheBtn}
  `
}

function buildCard(curso) {
  const mes = curso.mes ? capitalize(curso.mes) : ""
  const periodo = curso.data ? `${curso.data} · ${mes}` : mes
  return `
    <div class="curso-card" data-modalidade="${curso.modalidade}" data-mes="${escapeHtml((curso.mes || "").toLowerCase())}">
      <div class="curso-card__header">
        <span class="curso-card__mes">${escapeHtml(periodo)}</span>
        ${buildModalidadeTag(curso.modalidade)}
      </div>
      <div class="curso-card__body">
        <div class="curso-card__icon"><i class="${curso.icone || "fas fa-book"}"></i></div>
        <h3>${escapeHtml(curso.titulo)}</h3>
        <p>${escapeHtml(curso.descricao || "")}</p>
      </div>
      <div class="curso-card__footer">
        ${buildFooter(curso)}
      </div>
    </div>
  `
}

function buildEmptyState() {
  return `
    <div class="cursos-empty">
      <i class="fas fa-calendar-alt cursos-empty__icon" aria-hidden="true"></i>
      <h3>Nenhum curso disponivel no momento</h3>
      <p>Os proximos cursos deste eixo serao liberados conforme o cronograma 2026.</p>
      <a href="eixos.html" class="cursos-empty__link">Ver cronograma completo <i class="fas fa-arrow-right"></i></a>
    </div>
  `
}

const MES_ORDEM = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12
}

function ordemCronologica(curso) {
  const mes = MES_ORDEM[(curso.mes || "").toLowerCase()] || 99
  let dia = 99
  if (curso.data) {
    const m = curso.data.match(/^(\d{1,2})\/(\d{1,2})/)
    if (m) dia = parseInt(m[1], 10)
  }
  return mes * 100 + dia
}

function isMesPassadoOuAtual(curso) {
  const mes = MES_ORDEM[(curso.mes || "").toLowerCase()]
  if (!mes) return true // sem mês definido, mantém visível
  const hoje = new Date()
  return mes <= hoje.getMonth() + 1
}

function renderTrilha(trilha) {
  const cursosVisiveis = trilha.cursos.filter(c => !c.ocultarNoEixo && isMesPassadoOuAtual(c))
  const cursosOrdenados = [...cursosVisiveis].sort((a, b) => ordemCronologica(a) - ordemCronologica(b))
  const cardsHtml = cursosOrdenados.map(buildCard).join("")
  if (!trilha.nome) return cardsHtml
  return `
    <div class="trilha-group">
      <h3 class="trilha-group__title">${escapeHtml(trilha.nome)}</h3>
      <div class="trilha-group__cards">${cardsHtml}</div>
    </div>
  `
}

function bindFormButtons(container) {
  container.querySelectorAll("[data-form-open]").forEach(btn => {
    btn.addEventListener("click", () => {
      openFormModal({
        src: btn.dataset.src,
        title: btn.dataset.title,
        aviso: btn.dataset.aviso || "",
        acessoUrl: btn.dataset.acesso || ""
      })
    })
  })
}

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

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export async function initCursosRender() {
  const containers = document.querySelectorAll("[data-cursos-eixo]")
  if (!containers.length) return

  let data
  try {
    const res = await fetch(DATA_URL)
    if (!res.ok) throw new Error("HTTP " + res.status)
    data = await res.json()
    formsDefault = data.formsDefault || {}
  } catch (err) {
    console.error("Falha ao carregar cursos.json", err)
    containers.forEach(c => {
      c.innerHTML = buildEmptyState()
    })
    return
  }

  containers.forEach(container => {
    const eixoKey = container.dataset.cursosEixo
    const eixo = data.eixos && data.eixos[eixoKey]
    if (!eixo) {
      container.innerHTML = buildEmptyState()
      return
    }

    const allCursos = eixo.trilhas.flatMap(t => t.cursos).filter(c => !c.ocultarNoEixo && isMesPassadoOuAtual(c))
    if (!allCursos.length) {
      container.innerHTML = buildEmptyState()
      return
    }

    container.innerHTML = eixo.trilhas
      .filter(t => t.cursos.some(c => !c.ocultarNoEixo && isMesPassadoOuAtual(c)))
      .map(renderTrilha)
      .join("")

    bindFormButtons(container)
  })
}
