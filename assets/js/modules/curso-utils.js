/* ========================================
   Curso Utils — lógica de status e link compartilhada entre os módulos.
   Suporta o esquema simplificado (inscricaoAberta, convocacao, realizado, link)
   e mantém compatibilidade com campos antigos (inscricaoUrl, inscricaoLabel,
   inscricaoFormId, acessoCursoUrl).
   ======================================== */

const MESES_NUM = {
  janeiro: 0, fevereiro: 1, marco: 2, "março": 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11
}

const FORMS_BASE = "https://docs.google.com/forms/d/e/"

export function cursoDate(curso) {
  const d = curso.detalhe || {}
  const ext = d.dataExtenso && d.dataExtenso.match(/^(\d{1,2})\s+de\s+([a-zçãéíóúâêô]+)\s+de\s+(\d{4})/i)
  if (ext) {
    const mes = MESES_NUM[ext[2].toLowerCase()]
    if (mes != null) return new Date(Number(ext[3]), mes, Number(ext[1]))
  }
  if (curso.data) {
    const m = curso.data.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/)
    if (m) {
      const ano = m[3] ? Number(m[3]) : 2026
      return new Date(ano, Number(m[2]) - 1, Number(m[1]))
    }
  }
  if (curso.mes) {
    const mes = MESES_NUM[curso.mes.toLowerCase()]
    if (mes != null) return new Date(2026, mes, 1)
  }
  return null
}

export function temDataDefinida(curso) {
  return Boolean(curso.data || curso.detalhe?.dataExtenso)
}

export function isPast(curso) {
  if (!temDataDefinida(curso)) return false
  const date = cursoDate(curso)
  if (!date) return false
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return date.getTime() < hoje.getTime()
}

/**
 * Retorna o status do curso: "abertas" | "convocacao" | "em-breve" | "realizado"
 * Prioridade: flags explícitas > inferência por data/legado.
 */
export function getStatus(curso) {
  // Explícitas (esquema novo)
  if (curso.realizado === true) return "realizado"
  if (curso.convocacao === true) return "convocacao"
  if (curso.inscricaoAberta === true) return "abertas"
  if (curso.emBreve === true) return "em-breve"

  // Legado / inferência
  if (curso.inscricaoLabel && /encerrad|realizad/i.test(curso.inscricaoLabel)) return "realizado"
  if (isPast(curso)) return "realizado"
  if (curso.inscricaoLabel && /convoca/i.test(curso.inscricaoLabel)) return "convocacao"
  if (curso.inscricaoUrl) return "abertas"
  return "em-breve"
}

/**
 * Retorna o link de inscrição/acesso principal do curso, ou null.
 * Prioridade: curso.link > curso.inscricaoUrl > Forms (a partir de inscricaoFormId).
 */
export function getLinkInscricao(curso, formsDefault = {}) {
  if (curso.link) return curso.link
  if (curso.inscricaoUrl) return curso.inscricaoUrl
  const formId = curso.inscricaoFormId || formsDefault.inscricaoFormId
  if (formId) return FORMS_BASE + formId + "/viewform?embedded=true"
  return null
}

export function isLinkForms(url) {
  return typeof url === "string" && /docs\.google\.com\/forms/i.test(url)
}

export function isLinkSympla(url) {
  return typeof url === "string" && /sympla\.com\.br/i.test(url)
}

/**
 * Conveniência: dado um curso, retorna { tipo, href } onde tipo ∈ {"forms","externo"}.
 * "forms": deve abrir em modal embed.
 * "externo": abre em nova aba.
 */
export function descreverLink(curso, formsDefault = {}) {
  const href = getLinkInscricao(curso, formsDefault)
  if (!href) return null
  return { tipo: isLinkForms(href) ? "forms" : "externo", href }
}
