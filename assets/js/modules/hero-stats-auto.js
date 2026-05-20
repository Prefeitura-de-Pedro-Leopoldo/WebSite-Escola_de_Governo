/* ========================================
   Hero Stats — preenche os indicadores automaticamente a partir de cursos.json
   Roda ANTES do initCounter para que ele anime os valores já calculados.
   Use o atributo data-auto no <span class="stat-number"> para indicar a fonte:
     data-auto="cursos" -> total de cursos (excluindo ocultarNoEixo)
     data-auto="cursos-todos" -> todos os cursos cadastrados
     data-auto="eixos" -> total de eixos
     data-auto="turmas" -> total de turmas (cursos com data definida)
   ======================================== */

const DATA_URL = new URL("../../data/cursos.json", import.meta.url)

function coletarCursos(data) {
  const out = []
  for (const eixoKey of Object.keys(data.eixos || {})) {
    for (const trilha of data.eixos[eixoKey].trilhas || []) {
      for (const curso of trilha.cursos || []) out.push(curso)
    }
  }
  return out
}

export async function initHeroStatsAuto() {
  const alvos = document.querySelectorAll(".stat-number[data-auto]")
  if (!alvos.length) return

  let data
  try {
    const res = await fetch(DATA_URL)
    if (!res.ok) throw new Error("HTTP " + res.status)
    data = await res.json()
  } catch (err) {
    console.error("Falha ao carregar cursos.json em hero-stats-auto", err)
    return
  }

  const todosCursos = coletarCursos(data)
  const cursosVisiveis = todosCursos.filter(c => !c.ocultarNoEixo)
  const eixos = Object.keys(data.eixos || {})
  const turmas = todosCursos.filter(c => c.data || c.detalhe?.dataExtenso)

  const calc = {
    "cursos": cursosVisiveis.length,
    "cursos-todos": todosCursos.length,
    "eixos": eixos.length,
    "turmas": turmas.length
  }

  alvos.forEach(el => {
    const chave = el.dataset.auto
    const valor = calc[chave]
    if (typeof valor === "number") {
      el.dataset.target = String(valor)
      el.textContent = "0"
    }
  })
}
