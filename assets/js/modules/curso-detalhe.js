/* ========================================
   Curso Detalhe
   Renderiza a pagina pages/curso.html a partir de ?id=<curso.id>
   lendo assets/data/cursos.json.
   ======================================== */

const DATA_URL = new URL("../../data/cursos.json", import.meta.url)

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

  const match = findCurso(data, id)
  if (!match) {
    root.innerHTML = buildNotFound(id)
    return
  }

  root.innerHTML = buildPage(match)
  document.title = `${match.curso.titulo} · Escola de Governo Pedro Leopoldo`
}
