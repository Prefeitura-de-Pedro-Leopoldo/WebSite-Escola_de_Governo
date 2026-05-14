/**
 * app.js - controller principal: roteamento entre views, sidebar,
 * comparacao, filtros e tela de certificados com upload dinamico.
 */

import { loadData, getEvento } from "./data.js";
import {
  resumoGlobal,
  rankingSecretarias,
  comparativoEventos,
  taxaPresenca,
  participacaoPorSecretaria,
  distribuicaoPorTurma,
} from "./metrics.js";
import {
  barInscritosVsPresentes,
  barTaxaPresenca,
  donutPresenca,
  barSecretarias,
  pieTurmas,
  lineTimeline,
  radarComparativo,
  barGrupoComparativo,
  barGroupedByCategory,
  destroyAll,
  PALETTE,
} from "./charts.js";
import {
  fmt,
  pct,
  escapeHtml,
  formatDateBR,
  renderKPIs,
  renderEventCard,
  renderEventDetail,
  renderInsights,
  renderParticipantsTable,
  renderEventsTable,
  renderSecretariasTable,
  renderComparativeTable,
} from "./ui.js";
import { gerarInsightsGlobais, gerarInsightsEvento } from "./insights.js";

// ================ Auth gate ================
const session = sessionStorage.getItem("egov_admin_session");
if (!session) window.location.replace("login.html");
const userData = (() => {
  try { return JSON.parse(session); } catch { return { email: "admin", name: "Admin" }; }
})();

// ================ State ================
const state = {
  data: null,
  view: "dashboard",
  selectedEventId: null,
  compareIds: new Set(),
  reportFilters: { eventoId: "", secretaria: "", turma: "", busca: "" },
  certEventId: null,
  certSource: "evento", // 'evento' ou 'planilha'
  certUploaded: null,   // dados de planilha enviada
  templateImg: null,    // Image do modelo.png
};

const VIEW_TITLES = {
  dashboard: ["Dashboard", "Visão consolidada e análise de cada evento."],
  eventos: ["Análise por Evento", "Detalhamento operacional e demográfico."],
  comparar: ["Comparar Eventos", "Compare dois ou mais eventos lado a lado."],
  participantes: ["Participantes", "Busca e filtros sobre todos os inscritos."],
  secretarias: ["Secretarias", "Ranking e participação por pasta."],
  relatorios: ["Relatórios", "Relatórios por evento, consolidado e exportação."],
  certificados: ["Emitir Certificados", "Upload dinâmico de planilha gera a lista de elegíveis."],
};

// ================ Bootstrap ================
(async function init() {
  setupSidebar();
  setupUserChrome();
  setupThemeToggle();
  setupNavigation();
  preloadTemplate();
  await reloadData();
})();

async function reloadData() {
  try {
    state.data = await loadData();
    renderAll();
  } catch (err) {
    document.getElementById("mainContent").innerHTML = `
      <div class="empty-state">
        <i class="fas fa-circle-exclamation"></i>
        <h3>Não foi possível carregar os dados</h3>
        <p>${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

// ================ Chrome ================
function setupSidebar() {
  const shell = document.getElementById("appShell");
  document.getElementById("sidebarToggle").addEventListener("click", () => {
    if (window.matchMedia("(max-width: 768px)").matches) {
      shell.classList.toggle("is-mobile-open");
    } else {
      shell.classList.toggle("is-collapsed");
      try {
        localStorage.setItem("egov_sidebar_collapsed", shell.classList.contains("is-collapsed") ? "1" : "0");
      } catch (_) {}
    }
  });
  try {
    if (localStorage.getItem("egov_sidebar_collapsed") === "1") shell.classList.add("is-collapsed");
  } catch (_) {}
}

function setupUserChrome() {
  document.getElementById("userName").textContent = userData.name || "Administrador";
  document.getElementById("userEmail").textContent = userData.email;
  document.getElementById("avatarLetter").textContent = (userData.email || "?")[0].toUpperCase();
  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("egov_admin_session");
    window.location.replace("login.html");
  });
  document.getElementById("refreshBtn").addEventListener("click", reloadData);
}

function setupThemeToggle() {
  const btn = document.getElementById("themeToggle");
  btn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") || "light";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("egovpl-theme", next); } catch (_) {}
    renderAll();
  });
}

function setupNavigation() {
  document.querySelectorAll("[data-nav]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(el.dataset.nav);
    });
  });
}

function navigate(view) {
  state.view = view;
  document.querySelectorAll(".nav-link").forEach((n) => n.classList.toggle("is-active", n.dataset.nav === view));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("is-active", v.id === `view-${view}`));
  const [t, s] = VIEW_TITLES[view] || ["", ""];
  document.getElementById("topbarTitle").textContent = t;
  document.getElementById("topbarSub").textContent = s;
  document.getElementById("appShell").classList.remove("is-mobile-open");
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderAll();
}

// ================ Render orchestrator ================
function renderAll() {
  destroyAll();
  if (!state.data) return;
  if (state.view === "dashboard") renderDashboard();
  else if (state.view === "eventos") renderViewEventos();
  else if (state.view === "comparar") renderViewComparar();
  else if (state.view === "participantes") renderViewParticipantes();
  else if (state.view === "secretarias") renderViewSecretarias();
  else if (state.view === "relatorios") renderViewRelatorios();
  else if (state.view === "certificados") renderViewCertificados();
}

// ================ DASHBOARD ================
function renderDashboard() {
  const { data } = state;
  const eventos = data.eventos;
  const resumo = resumoGlobal(eventos);
  const ranking = rankingSecretarias(eventos);

  document.getElementById("kpisGlobal").innerHTML = renderKPIs(resumo);

  // Insights particionados por severidade
  const insights = gerarInsightsGlobais(data);
  const alerts = insights.filter((i) => i.type === "danger" || i.type === "warn");
  const highlights = insights.filter((i) => i.type === "positive" || i.type === "neutral");

  const alertStrip = document.getElementById("alertStrip");
  if (alerts.length) {
    alertStrip.innerHTML = renderInsights(alerts.slice(0, 3), { variant: "alert" });
    alertStrip.hidden = false;
  } else {
    alertStrip.hidden = true;
    alertStrip.innerHTML = "";
  }

  const highlightsBlock = document.getElementById("highlightsBlock");
  const highlightsGrid = document.getElementById("highlightsGrid");
  if (highlights.length) {
    highlightsGrid.innerHTML = renderInsights(highlights, { variant: "compact", limit: 4 });
    highlightsBlock.hidden = false;
  } else {
    highlightsBlock.hidden = true;
    highlightsGrid.innerHTML = "";
  }

  document.getElementById("eventGrid").innerHTML = eventos.map(renderEventCard).join("");

  document.querySelectorAll(".event-card").forEach((card) =>
    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-action]")) return;
      state.selectedEventId = card.dataset.event;
      navigate("eventos");
    })
  );
  document.querySelectorAll('[data-action="detalhe"]').forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      state.selectedEventId = b.dataset.event;
      navigate("eventos");
    })
  );
  document.querySelectorAll('[data-action="certificados"]').forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      state.certEventId = b.dataset.event;
      state.certSource = "evento";
      navigate("certificados");
    })
  );

  // Charts globais: passamos somente realizados onde faz sentido
  const realizados = eventos.filter((e) => e.status === "realizado");
  barInscritosVsPresentes("chartGlobalBar", realizados);
  barTaxaPresenca("chartGlobalTaxa", realizados);
  barSecretarias("chartGlobalSec", ranking);
  donutPresenca("chartGlobalDonut", resumo.totalPresentes, resumo.totalAusentes);
}

// ================ ANÁLISE POR EVENTO ================
function renderViewEventos() {
  const { data } = state;
  const eventos = data.eventos;
  if (!state.selectedEventId && eventos.length) state.selectedEventId = eventos[0].id;
  const ev = getEvento(data, state.selectedEventId);

  const view = document.getElementById("view-eventos");
  view.innerHTML = `
    <div class="filters">
      <div class="filter">
        <label for="evSelect">Selecionar evento</label>
        <select id="evSelect">
          ${eventos.map((e) => `<option value="${e.id}" ${e.id === state.selectedEventId ? "selected" : ""}>${escapeHtml(e.title)} ${e.date ? "(" + formatDateBR(e.date) + ")" : ""}</option>`).join("")}
        </select>
      </div>
    </div>
    <div id="eventDetailBlock"></div>
  `;
  document.getElementById("evSelect").addEventListener("change", (e) => {
    state.selectedEventId = e.target.value;
    renderViewEventos();
  });
  if (ev) renderEventBlock(ev);
}

function renderEventBlock(ev) {
  const block = document.getElementById("eventDetailBlock");
  block.innerHTML = `
    ${renderEventDetail(ev)}

    <div class="grid-3">
      <div class="card">
        <div class="card__header"><div><h3>Presença</h3><p>Compareceram vs Faltaram.</p></div></div>
        <div class="chart-wrap"><canvas id="chartEvDonut"></canvas></div>
      </div>
      <div class="card">
        <div class="card__header"><div><h3>Distribuição por turma</h3><p>Por tipo de ingresso.</p></div></div>
        <div class="chart-wrap"><canvas id="chartEvTurmas"></canvas></div>
      </div>
      <div class="card">
        <div class="card__header"><div><h3>Top secretarias</h3><p>Inscritos por secretaria.</p></div></div>
        <div class="chart-wrap"><canvas id="chartEvSec"></canvas></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card__header"><div><h3>Curva de inscrições</h3><p>Inscrições por dia até o evento.</p></div></div>
        <div class="chart-wrap"><canvas id="chartEvTimeline"></canvas></div>
      </div>
      <div class="card">
        <div class="card__header"><div><h3>Observações automáticas</h3><p>Insights deste evento.</p></div></div>
        <div class="insights-grid" style="grid-template-columns:1fr;" id="evInsights"></div>
      </div>
    </div>

    <div class="table-wrap">
      <div class="table-wrap__head">
        <h3><i class="fas fa-users"></i> Participantes deste evento</h3>
        <span class="card__header-meta">${ev.participantes.length} pessoa(s)</span>
      </div>
      ${renderParticipantsTable(ev.participantes)}
    </div>
  `;

  donutPresenca("chartEvDonut", ev.totalPresentes, ev.totalAusentes);
  pieTurmas("chartEvTurmas", distribuicaoPorTurma(ev));
  barSecretarias("chartEvSec", participacaoPorSecretaria(ev).sort((a, b) => b.qtd - a.qtd));
  lineTimeline("chartEvTimeline", ev.timelineInscricoes || [], "Inscrições no dia");
  document.getElementById("evInsights").innerHTML = renderInsights(gerarInsightsEvento(ev));
}

// ================ COMPARAR ================
function renderViewComparar() {
  const { data } = state;
  const compareItems = data.eventos
    .map((e) => {
      const checked = state.compareIds.has(e.id);
      return `
        <label class="checkbox ${checked ? "is-checked" : ""}">
          <input type="checkbox" value="${e.id}" ${checked ? "checked" : ""} />
          <span class="checkbox__label">${escapeHtml(e.title)}</span>
        </label>
      `;
    })
    .join("");

  const view = document.getElementById("view-comparar");
  view.innerHTML = `
    <div class="compare-bar">
      <span class="compare-bar__label"><i class="fas fa-scale-balanced"></i> Eventos:</span>
      ${compareItems}
      <button class="btn btn--sm" id="compareClear"><i class="fas fa-rotate-left"></i> Limpar</button>
    </div>
    <div id="compareContent"></div>
  `;

  view.querySelectorAll(".checkbox input").forEach((input) =>
    input.addEventListener("change", () => {
      if (input.checked) state.compareIds.add(input.value);
      else state.compareIds.delete(input.value);
      renderViewComparar();
    })
  );
  document.getElementById("compareClear").addEventListener("click", () => {
    state.compareIds.clear();
    renderViewComparar();
  });
  renderCompareContent();
}

function renderCompareContent() {
  const ids = [...state.compareIds];
  const selected = state.data.eventos.filter((e) => ids.includes(e.id));
  const target = document.getElementById("compareContent");

  if (selected.length < 2) {
    target.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-scale-balanced"></i>
        <h3>Selecione 2 ou mais eventos</h3>
        <p>A comparação ficará disponível ao marcar pelo menos dois eventos acima.</p>
      </div>`;
    return;
  }

  const comparativos = comparativoEventos(selected);
  const allSecs = new Set();
  selected.forEach((e) => Object.keys(e.secretarias || {}).forEach((s) => allSecs.add(s)));
  const secLabels = [...allSecs];
  const allTurmas = new Set();
  selected.forEach((e) => Object.keys(e.turmas || {}).forEach((t) => allTurmas.add(t)));
  const turmaLabels = [...allTurmas];

  target.innerHTML = `
    <div class="grid-2">
      <div class="card">
        <div class="card__header"><div><h3>Volume comparado</h3><p>Inscritos, presentes e ausentes.</p></div></div>
        <div class="chart-wrap lg"><canvas id="cmpBar"></canvas></div>
      </div>
      <div class="card">
        <div class="card__header"><div><h3>Perfil relativo</h3><p>Métricas normalizadas em radar.</p></div></div>
        <div class="chart-wrap lg"><canvas id="cmpRadar"></canvas></div>
      </div>
    </div>

    ${secLabels.length || turmaLabels.length ? `
      <div class="grid-2">
        ${secLabels.length ? `
          <div class="card">
            <div class="card__header"><div><h3>Por secretaria</h3><p>Inscrições por secretaria em cada evento.</p></div></div>
            <div class="chart-wrap lg"><canvas id="cmpSec"></canvas></div>
          </div>` : ""}
        ${turmaLabels.length ? `
          <div class="card">
            <div class="card__header"><div><h3>Por turma</h3><p>Distribuição por turma.</p></div></div>
            <div class="chart-wrap lg"><canvas id="cmpTurma"></canvas></div>
          </div>` : ""}
      </div>` : ""}

    <div class="table-wrap">
      <div class="table-wrap__head">
        <h3><i class="fas fa-table"></i> Quadro comparativo</h3>
        <span class="card__header-meta">${selected.length} eventos</span>
      </div>
      ${renderComparativeTable(comparativos)}
    </div>
  `;

  barGrupoComparativo("cmpBar", comparativos);
  radarComparativo("cmpRadar", comparativos);

  if (secLabels.length) {
    const datasets = selected.map((e, i) => ({
      label: e.title.length > 22 ? e.title.slice(0, 20) + "..." : e.title,
      data: secLabels.map((s) => (e.secretarias || {})[s] || 0),
      backgroundColor: PALETTE.series[i % PALETTE.series.length],
      maxBarThickness: 22,
    }));
    barGroupedByCategory("cmpSec", secLabels, datasets, { indexAxis: "y" });
  }
  if (turmaLabels.length) {
    const datasets = selected.map((e, i) => ({
      label: e.title.length > 22 ? e.title.slice(0, 20) + "..." : e.title,
      data: turmaLabels.map((t) => (e.turmas || {})[t] || 0),
      backgroundColor: PALETTE.series[i % PALETTE.series.length],
      maxBarThickness: 32,
    }));
    barGroupedByCategory("cmpTurma", turmaLabels, datasets, { indexAxis: "x" });
  }
}

// ================ PARTICIPANTES ================
function renderViewParticipantes() {
  const { data } = state;
  const allSecs = [...new Set(data.eventos.flatMap((e) => Object.keys(e.secretarias || {})))].sort();
  const allTurmas = [...new Set(data.eventos.flatMap((e) => Object.keys(e.turmas || {})))].sort();
  const f = state.reportFilters;

  const view = document.getElementById("view-participantes");
  view.innerHTML = `
    <div class="filters">
      <div class="filter">
        <label for="pEvento">Evento</label>
        <select id="pEvento">
          <option value="">Todos os eventos</option>
          ${data.eventos.map((e) => `<option value="${e.id}" ${f.eventoId === e.id ? "selected" : ""}>${escapeHtml(e.title)}</option>`).join("")}
        </select>
      </div>
      <div class="filter">
        <label for="pSec">Secretaria</label>
        <select id="pSec">
          <option value="">Todas</option>
          ${allSecs.map((s) => `<option ${f.secretaria === s ? "selected" : ""}>${escapeHtml(s)}</option>`).join("")}
        </select>
      </div>
      <div class="filter">
        <label for="pTurma">Turma</label>
        <select id="pTurma">
          <option value="">Todas</option>
          ${allTurmas.map((t) => `<option ${f.turma === t ? "selected" : ""}>${escapeHtml(t)}</option>`).join("")}
        </select>
      </div>
      <div class="filter">
        <label for="pBusca">Buscar</label>
        <input type="search" id="pBusca" placeholder="nome ou e-mail" value="${escapeHtml(f.busca)}" />
      </div>
    </div>

    <div class="table-wrap">
      <div class="table-wrap__head">
        <h3><i class="fas fa-users"></i> Participantes</h3>
        <span class="card__header-meta" id="pCount">0</span>
      </div>
      <div id="pTable"></div>
    </div>
  `;

  const apply = () => {
    state.reportFilters = {
      eventoId: document.getElementById("pEvento").value,
      secretaria: document.getElementById("pSec").value,
      turma: document.getElementById("pTurma").value,
      busca: document.getElementById("pBusca").value,
    };
    populateParticipantes();
  };
  ["pEvento", "pSec", "pTurma"].forEach((id) => document.getElementById(id).addEventListener("change", apply));
  document.getElementById("pBusca").addEventListener("input", apply);
  populateParticipantes();
}

function populateParticipantes() {
  const parts = collectParticipantes();
  document.getElementById("pTable").innerHTML = renderParticipantsTable(parts);
  document.getElementById("pCount").textContent = `${parts.length} pessoa(s)`;
}

function collectParticipantes() {
  const f = state.reportFilters;
  let evs = state.data.eventos;
  if (f.eventoId) evs = evs.filter((e) => e.id === f.eventoId);
  const out = [];
  const busca = (f.busca || "").toLowerCase();
  evs.forEach((e) => {
    e.participantes.forEach((p) => {
      if (f.secretaria && p.secretaria !== f.secretaria) return;
      if (f.turma && p.turma !== f.turma) return;
      if (busca && !(`${p.nome} ${p.email || ""}`.toLowerCase().includes(busca))) return;
      out.push({ ...p, eventoTitle: e.title, eventoId: e.id });
    });
  });
  return out;
}

// ================ SECRETARIAS ================
function renderViewSecretarias() {
  const { data } = state;
  const ranking = rankingSecretarias(data.eventos);

  const view = document.getElementById("view-secretarias");
  view.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi__icon"><i class="fas fa-building"></i></div>
        <div class="kpi__label">Secretarias</div>
        <div class="kpi__value">${ranking.length}</div>
        <div class="kpi__delta">Com participação registrada</div>
      </div>
      <div class="kpi kpi--accent">
        <div class="kpi__icon"><i class="fas fa-medal"></i></div>
        <div class="kpi__label">Líder</div>
        <div class="kpi__value" style="font-size:1.1rem">${escapeHtml(ranking[0]?.nome || "N/A")}</div>
        <div class="kpi__delta">${fmt(ranking[0]?.qtd || 0)} inscrições</div>
      </div>
      <div class="kpi kpi--warn">
        <div class="kpi__icon"><i class="fas fa-chart-pie"></i></div>
        <div class="kpi__label">Concentração no topo</div>
        <div class="kpi__value">${ranking[0] ? Math.round((ranking[0].qtd / ranking.reduce((s, r) => s + r.qtd, 0)) * 100) + "%" : "N/A"}</div>
        <div class="kpi__delta">Participação da secretaria líder</div>
      </div>
      <div class="kpi kpi--danger">
        <div class="kpi__icon"><i class="fas fa-arrow-down-9-1"></i></div>
        <div class="kpi__label">Menor adesão</div>
        <div class="kpi__value" style="font-size:1.1rem">${escapeHtml(ranking[ranking.length - 1]?.nome || "N/A")}</div>
        <div class="kpi__delta">${fmt(ranking[ranking.length - 1]?.qtd || 0)} inscrições</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card__header"><div><h3>Distribuição global</h3><p>Inscrições por secretaria (todos os eventos).</p></div></div>
        <div class="chart-wrap lg"><canvas id="secChart"></canvas></div>
      </div>
      <div class="table-wrap" style="margin-bottom:0;">
        <div class="table-wrap__head">
          <h3><i class="fas fa-list-ol"></i> Ranking detalhado</h3>
          <span class="card__header-meta">${ranking.length} secretaria(s)</span>
        </div>
        ${renderSecretariasTable(ranking)}
      </div>
    </div>
  `;
  barSecretarias("secChart", ranking, { limit: 15 });
}

// ================ RELATÓRIOS ================
function renderViewRelatorios() {
  const { data } = state;
  const f = state.reportFilters;
  const allSecs = [...new Set(data.eventos.flatMap((e) => Object.keys(e.secretarias || {})))].sort();

  const view = document.getElementById("view-relatorios");
  view.innerHTML = `
    <div class="filters">
      <div class="filter">
        <label for="rEvento">Evento</label>
        <select id="rEvento">
          <option value="">Todos</option>
          ${data.eventos.map((e) => `<option value="${e.id}" ${f.eventoId === e.id ? "selected" : ""}>${escapeHtml(e.title)}</option>`).join("")}
        </select>
      </div>
      <div class="filter">
        <label for="rSec">Secretaria</label>
        <select id="rSec">
          <option value="">Todas</option>
          ${allSecs.map((s) => `<option ${f.secretaria === s ? "selected" : ""}>${escapeHtml(s)}</option>`).join("")}
        </select>
      </div>
      <div class="filters__actions">
        <button class="btn btn--sm" id="rClear"><i class="fas fa-rotate-left"></i> Limpar</button>
        <button class="btn btn--sm" id="rCsv"><i class="fas fa-file-csv"></i> Exportar CSV</button>
        <button class="btn btn--sm" disabled title="Em breve"><i class="fas fa-file-pdf"></i> PDF</button>
        <button class="btn btn--sm" disabled title="Em breve"><i class="fas fa-file-excel"></i> Excel</button>
      </div>
    </div>

    <div class="table-wrap">
      <div class="table-wrap__head">
        <h3><i class="fas fa-table-list"></i> Quadro consolidado de eventos</h3>
        <span class="card__header-meta" id="rEvCount">0</span>
      </div>
      <div id="rEvTable"></div>
    </div>

    <div class="table-wrap">
      <div class="table-wrap__head">
        <h3><i class="fas fa-building-columns"></i> Ranking de secretarias</h3>
        <span class="card__header-meta" id="rSecCount">0</span>
      </div>
      <div id="rSecTable"></div>
    </div>

    <div class="table-wrap">
      <div class="table-wrap__head">
        <h3><i class="fas fa-users"></i> Participantes</h3>
        <span class="card__header-meta" id="rPartCount">0</span>
      </div>
      <div id="rPartTable"></div>
    </div>
  `;

  const apply = () => {
    state.reportFilters = {
      eventoId: document.getElementById("rEvento").value,
      secretaria: document.getElementById("rSec").value,
      turma: "",
      busca: "",
    };
    populateRelatorios();
  };
  ["rEvento", "rSec"].forEach((id) => document.getElementById(id).addEventListener("change", apply));
  document.getElementById("rClear").addEventListener("click", () => {
    state.reportFilters = { eventoId: "", secretaria: "", turma: "", busca: "" };
    renderViewRelatorios();
  });
  document.getElementById("rCsv").addEventListener("click", exportCsv);
  populateRelatorios();
}

function populateRelatorios() {
  const f = state.reportFilters;
  let evs = state.data.eventos;
  if (f.eventoId) evs = evs.filter((e) => e.id === f.eventoId);

  document.getElementById("rEvTable").innerHTML = renderEventsTable(evs);
  document.getElementById("rEvCount").textContent = `${evs.length} evento(s)`;

  const secAgg = {};
  evs.forEach((e) => {
    Object.entries(e.secretarias || {}).forEach(([k, v]) => {
      if (f.secretaria && k !== f.secretaria) return;
      secAgg[k] = (secAgg[k] || 0) + v;
    });
  });
  const ranking = Object.entries(secAgg).map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd);
  document.getElementById("rSecTable").innerHTML = renderSecretariasTable(ranking);
  document.getElementById("rSecCount").textContent = `${ranking.length} secretaria(s)`;

  const parts = collectParticipantes();
  document.getElementById("rPartTable").innerHTML = renderParticipantsTable(parts);
  document.getElementById("rPartCount").textContent = `${parts.length} pessoa(s)`;
}

function exportCsv() {
  const parts = collectParticipantes();
  if (!parts.length) {
    alert("Nenhum participante para exportar com os filtros atuais.");
    return;
  }
  const rows = [
    ["Evento", "Nome", "E-mail", "Turma", "Secretaria", "Presente", "Data Check-in"],
    ...parts.map((p) => [
      p.eventoTitle, p.nome, p.email || "", p.turma || "",
      p.secretaria || "", p.presente ? "Sim" : "Não", p.dataCheckin || "",
    ]),
  ];
  const csv = rows.map((r) => r.map((c) => {
    const s = String(c ?? "").replace(/"/g, '""');
    return /[",;\n]/.test(s) ? `"${s}"` : s;
  }).join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-participantes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ================ CERTIFICADOS ================
function preloadTemplate() {
  if (state.templateImg) return;
  const img = new Image();
  img.onload = () => { state.templateImg = img; renderCertPreview(); };
  img.onerror = () => console.warn("Falha ao carregar modelo.png");
  img.src = "../modelo.png";
}

function renderViewCertificados() {
  const { data } = state;
  if (!state.certEventId && data.eventos.length) state.certEventId = data.eventos[0].id;

  const view = document.getElementById("view-certificados");
  view.innerHTML = `
    <div class="cert-layout">
      <!-- Coluna lateral -->
      <div class="cert-side">
        <div class="card">
          <div class="card__header">
            <div><h3>Fonte dos elegíveis</h3><p>Use os check-ins do sistema ou suba uma planilha.</p></div>
          </div>
          <div class="source-tabs">
            <button class="source-tab ${state.certSource === "evento" ? "is-active" : ""}" data-source="evento">
              <i class="fas fa-database"></i> Do sistema
            </button>
            <button class="source-tab ${state.certSource === "planilha" ? "is-active" : ""}" data-source="planilha">
              <i class="fas fa-file-arrow-up"></i> Upload
            </button>
          </div>

          <div id="sourceEvento" ${state.certSource === "evento" ? "" : "hidden"}>
            <div class="filter">
              <label for="certEvento">Evento</label>
              <select id="certEvento">
                ${data.eventos.map((e) => `<option value="${e.id}" ${state.certEventId === e.id ? "selected" : ""}>${escapeHtml(e.title)} (${e.totalPresentes} presente(s))</option>`).join("")}
              </select>
            </div>
          </div>

          <div id="sourcePlanilha" ${state.certSource === "planilha" ? "" : "hidden"}>
            <label class="dropzone" id="certDrop">
              <input type="file" id="certFile" accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
              <div class="dropzone__icon"><i class="fas fa-file-arrow-up"></i></div>
              <div class="dropzone__title" id="certDropTitle">Clique ou arraste a planilha aqui</div>
              <div class="dropzone__sub" id="certDropSub">CSV, XLSX ou XLS &middot; até 5 MB</div>
            </label>
            <div style="margin-top:8px; font-size: var(--fs-xs); color: var(--text-muted);">
              <i class="fas fa-circle-info"></i> O sistema detecta automaticamente as colunas
              <b>Nome</b>, <b>Sobrenome</b>, <b>Email</b>, <b>Secretaria</b>, <b>Check-in</b>, <b>Tipo de ingresso</b>.
              Apenas presentes (check-in = "Sim") são listados como elegíveis.
              Para planilhas no formato simples, use: <b>nome, email, secretaria</b>.
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card__header"><div><h3>Dados do certificado</h3><p>Aplicado a todos os selecionados.</p></div></div>
          <div class="filter" style="margin-bottom:10px;">
            <label for="certCurso">Título do curso</label>
            <input type="text" id="certCurso" placeholder="Ex.: Fundamentos da Gestão Pública" />
          </div>
          <div class="filters" style="margin-bottom:10px; padding:0; background:transparent; border:0;">
            <div class="filter">
              <label for="certDia">Dia</label>
              <input type="number" id="certDia" min="1" max="31" placeholder="14" />
            </div>
            <div class="filter">
              <label for="certMes">Mês</label>
              <select id="certMes">
                <option value="">Selecione</option>
                <option>janeiro</option><option>fevereiro</option><option>março</option><option>abril</option>
                <option>maio</option><option>junho</option><option>julho</option><option>agosto</option>
                <option>setembro</option><option>outubro</option><option>novembro</option><option>dezembro</option>
              </select>
            </div>
            <div class="filter">
              <label for="certAno">Ano</label>
              <input type="number" id="certAno" min="2024" max="2099" placeholder="2026" />
            </div>
          </div>
          <div class="filter">
            <label for="certCarga">Carga horária (horas)</label>
            <input type="number" id="certCarga" min="1" placeholder="8" />
          </div>
        </div>

        <div class="card">
          <div class="card__header"><div><h3>Pré-visualização</h3><p>Atualiza ao digitar.</p></div></div>
          <div class="canvas-frame">
            <canvas id="certCanvas" width="1100" height="820"></canvas>
          </div>
        </div>
      </div>

      <!-- Coluna principal -->
      <div class="cert-main">
        <div class="filters">
          <div class="filter">
            <label for="certBusca">Buscar elegível</label>
            <input type="search" id="certBusca" placeholder="nome ou secretaria" />
          </div>
          <div class="filters__actions">
            <button class="btn btn--sm" id="certSelAll"><i class="fas fa-check-double"></i> Selecionar todos</button>
            <button class="btn btn--sm" id="certSelNone"><i class="fas fa-square"></i> Limpar seleção</button>
            <button class="btn btn--accent btn--sm" id="certEmit" disabled>
              <i class="fas fa-award"></i> Emitir <span id="certEmitCount">(0)</span>
            </button>
          </div>
        </div>

        <div class="table-wrap">
          <div class="table-wrap__head">
            <h3><i class="fas fa-users"></i> Participantes elegíveis</h3>
            <span class="card__header-meta" id="certCount">0</span>
          </div>
          <div id="certTable"></div>
        </div>

        <div class="cert-progress" id="certProgress" hidden>
          <div class="cert-progress__head">
            <span id="certProgressLabel">Gerando</span>
            <strong id="certProgressPct">0%</strong>
          </div>
          <div class="cert-progress__bar"><div class="cert-progress__fill" id="certProgressFill"></div></div>
          <div class="cert-status" id="certStatus"></div>
        </div>
      </div>
    </div>
  `;

  // Source tabs
  view.querySelectorAll(".source-tab").forEach((t) =>
    t.addEventListener("click", () => {
      state.certSource = t.dataset.source;
      renderViewCertificados();
    })
  );

  // Event selector
  const evSel = document.getElementById("certEvento");
  if (evSel) {
    evSel.addEventListener("change", () => {
      state.certEventId = evSel.value;
      populateCertTable();
    });
  }

  // Upload handlers
  setupCertUpload();

  // Form fields
  ["certCurso", "certDia", "certMes", "certAno", "certCarga"].forEach((id) => {
    document.getElementById(id).addEventListener("input", renderCertPreview);
  });
  document.getElementById("certBusca").addEventListener("input", populateCertTable);
  document.getElementById("certSelAll").addEventListener("click", () => {
    document.querySelectorAll(".cert-row-check").forEach((c) => (c.checked = true));
    updateCertEmitCount();
  });
  document.getElementById("certSelNone").addEventListener("click", () => {
    document.querySelectorAll(".cert-row-check").forEach((c) => (c.checked = false));
    updateCertEmitCount();
  });
  document.getElementById("certEmit").addEventListener("click", emitCertificadosLote);

  populateCertTable();
  renderCertPreview();
}

function setupCertUpload() {
  const drop = document.getElementById("certDrop");
  const input = document.getElementById("certFile");
  if (!drop || !input) return;

  input.addEventListener("change", (e) => {
    if (e.target.files[0]) handleCertFile(e.target.files[0]);
  });
  ["dragenter", "dragover"].forEach((ev) =>
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("is-drag"); })
  );
  ["dragleave", "drop"].forEach((ev) =>
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("is-drag"); })
  );
  drop.addEventListener("drop", (e) => {
    if (e.dataTransfer.files[0]) handleCertFile(e.dataTransfer.files[0]);
  });
}

function handleCertFile(file) {
  const drop = document.getElementById("certDrop");
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      let participantes = [];
      const ext = file.name.toLowerCase().split(".").pop();
      if (ext === "csv") {
        participantes = parseCsvParticipantes(e.target.result);
      } else {
        // XLSX/XLS via SheetJS
        const data = new Uint8Array(e.target.result);
        const wb = window.XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        participantes = parseSheetParticipantes(sheet);
      }
      if (!participantes.length) {
        document.getElementById("certDropTitle").textContent = "Nenhum elegível na planilha";
        document.getElementById("certDropSub").textContent = "Esperado: linhas com check-in 'Sim' ou coluna nome";
        drop.classList.remove("has-file");
        state.certUploaded = null;
        populateCertTable();
        return;
      }
      state.certUploaded = { fileName: file.name, participantes };
      drop.classList.add("has-file");
      document.getElementById("certDropTitle").textContent = file.name;
      document.getElementById("certDropSub").textContent = `${participantes.length} elegíveis carregados`;
      populateCertTable();
    } catch (err) {
      console.error(err);
      document.getElementById("certDropTitle").textContent = "Erro ao ler planilha";
      document.getElementById("certDropSub").textContent = err.message;
      drop.classList.remove("has-file");
    }
  };
  if (file.name.toLowerCase().endsWith(".csv")) reader.readAsText(file, "utf-8");
  else reader.readAsArrayBuffer(file);
}

function parseCsvParticipantes(text) {
  text = text.replace(/^﻿/, "");
  const sep = text.split("\n")[0].includes(";") ? ";" : ",";
  const rows = [];
  let row = [], cur = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cur += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === sep) { row.push(cur); cur = ""; }
      else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
      else if (c === "\r") { /* skip */ }
      else cur += c;
    }
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).filter((r) => r.some((v) => v && v.trim())).map((r) => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = (r[i] || "").trim());
    return obj;
  }).map(normalizeParticipante).filter(isElegivel);
}

function parseSheetParticipantes(sheet) {
  const json = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  // Procura linha de cabecalho (contem 'Ordem de inscricao' OU 'Nome')
  let headerIdx = -1;
  for (let i = 0; i < Math.min(15, json.length); i++) {
    const lower = json[i].map((c) => String(c).toLowerCase());
    if (lower.some((c) => c.includes("ordem de"))) { headerIdx = i; break; }
    if (lower.includes("nome") && headerIdx < 0) headerIdx = i;
  }
  if (headerIdx < 0) return [];
  const headers = json[headerIdx].map((h) => String(h).trim().toLowerCase());
  return json.slice(headerIdx + 1)
    .filter((r) => r.some((v) => v && String(v).trim()))
    .map((r) => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = String(r[i] || "").trim());
      return obj;
    })
    .map(normalizeParticipante)
    .filter(isElegivel);
}

function normalizeParticipante(row) {
  // tenta varios nomes de coluna
  const k = Object.keys(row);
  const find = (...patterns) => {
    for (const p of patterns) {
      const hit = k.find((kk) => kk.includes(p));
      if (hit && row[hit]) return row[hit];
    }
    return "";
  };
  const nome = [find("nome"), find("sobrenome")].filter(Boolean).join(" ").trim() ||
               find("nome completo", "participante");
  const checkin = find("check-in", "check in", "checkin", "presente").toLowerCase();
  const presente = checkin === "sim" || checkin === "yes" || checkin === "true" || checkin === "1" ||
                   (!find("check-in", "check in", "checkin", "presente")); // se nao tem coluna, assume elegivel
  return {
    nome: nome || "(sem nome)",
    email: find("email", "e-mail"),
    secretaria: find("secret", "lota"),
    turma: find("tipo de ingresso", "turma"),
    presente,
  };
}

function isElegivel(p) {
  return p.presente && p.nome && p.nome !== "(sem nome)";
}

function getCertParticipantes() {
  if (state.certSource === "planilha") {
    return state.certUploaded ? state.certUploaded.participantes : [];
  }
  const ev = getEvento(state.data, state.certEventId);
  if (!ev) return [];
  return ev.participantes.filter((p) => p.presente);
}

function populateCertTable() {
  const list = getCertParticipantes();
  const busca = (document.getElementById("certBusca")?.value || "").toLowerCase();
  const filtered = busca
    ? list.filter((p) =>
        (p.nome || "").toLowerCase().includes(busca) ||
        (p.secretaria || "").toLowerCase().includes(busca)
      )
    : list;

  document.getElementById("certCount").textContent = `${filtered.length} de ${list.length} elegíveis`;

  if (!filtered.length) {
    document.getElementById("certTable").innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users-slash"></i>
        <h3>Sem elegíveis</h3>
        <p>${state.certSource === "planilha" ? "Faça upload de uma planilha." : "Este evento não possui check-ins, ou tente outro filtro."}</p>
      </div>`;
    document.getElementById("certEmit").disabled = true;
    return;
  }

  const rows = filtered.map((p, i) => `
    <tr>
      <td><input type="checkbox" class="cert-row-check" data-idx="${i}" /></td>
      <td class="cell-name">${escapeHtml(p.nome)}</td>
      <td class="col-hide-sm">${escapeHtml(p.email || "")}</td>
      <td class="col-hide-md">${escapeHtml(p.turma || "")}</td>
      <td>${escapeHtml(p.secretaria || "")}</td>
      <td><span class="cell-status green"><i class="fas fa-check"></i> Elegível</span></td>
      <td><span class="cell-status muted">A emitir</span></td>
    </tr>
  `).join("");

  document.getElementById("certTable").innerHTML = `
    <div class="table-scroll">
      <table class="data">
        <thead>
          <tr>
            <th style="width:36px;"><input type="checkbox" id="certHeadCheck" /></th>
            <th>Participante</th>
            <th class="col-hide-sm">E-mail</th>
            <th class="col-hide-md">Turma</th>
            <th>Secretaria</th>
            <th>Presença</th>
            <th>Certificado</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  document.getElementById("certHeadCheck").addEventListener("change", (e) => {
    document.querySelectorAll(".cert-row-check").forEach((c) => (c.checked = e.target.checked));
    updateCertEmitCount();
  });
  document.querySelectorAll(".cert-row-check").forEach((c) =>
    c.addEventListener("change", updateCertEmitCount)
  );
  // expose for emission
  state._certCurrentList = filtered;
  updateCertEmitCount();
}

function updateCertEmitCount() {
  const n = document.querySelectorAll(".cert-row-check:checked").length;
  document.getElementById("certEmitCount").textContent = `(${n})`;
  document.getElementById("certEmit").disabled = n === 0;
}

// ---------------- Canvas / PDF rendering ----------------

const POS = {
  nome:  { x: 0.54,  y: 0.34 },
  curso: { x: 0.42,  y: 0.389 },
  dia:   { x: 0.371, y: 0.431 },
  mes:   { x: 0.55,  y: 0.431 },
  ano:   { x: 0.715, y: 0.431 },
  carga: { x: 0.26,  y: 0.475 },
};

function getCertFormData(nomeOverride = null) {
  return {
    nome: nomeOverride || "NOME COMPLETO DO PARTICIPANTE",
    curso: (document.getElementById("certCurso")?.value || "").trim() || "TÍTULO DO CURSO",
    dia: document.getElementById("certDia")?.value || "XX",
    mes: document.getElementById("certMes")?.value || "XXXX",
    ano: document.getElementById("certAno")?.value || "XXXX",
    carga: document.getElementById("certCarga")?.value || "XX",
  };
}

function drawCertificateInto(canvas, fields) {
  if (!state.templateImg) return;
  const w = canvas.width, h = canvas.height;
  const c = canvas.getContext("2d");
  c.clearRect(0, 0, w, h);
  c.drawImage(state.templateImg, 0, 0, w, h);
  const fontFamily = "'Calibri', 'Carlito', 'Segoe UI', Arial, sans-serif";
  const baseSize = w * 0.026;
  c.font = `700 ${baseSize}px ${fontFamily}`;
  c.fillStyle = "#000000";
  c.textBaseline = "middle";
  c.textAlign = "center";
  c.fillText(fields.nome, w * POS.nome.x, h * POS.nome.y);
  c.fillText(fields.curso, w * POS.curso.x, h * POS.curso.y);
  c.fillText(String(fields.dia), w * POS.dia.x, h * POS.dia.y);
  c.fillText(fields.mes, w * POS.mes.x, h * POS.mes.y);
  c.fillText(String(fields.ano), w * POS.ano.x, h * POS.ano.y);
  c.fillText(String(fields.carga), w * POS.carga.x, h * POS.carga.y);
}

function renderCertPreview() {
  const canvas = document.getElementById("certCanvas");
  if (!canvas || !state.templateImg) return;
  canvas.width = state.templateImg.naturalWidth;
  canvas.height = state.templateImg.naturalHeight;
  drawCertificateInto(canvas, getCertFormData());
}

function slug(s) {
  return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function emitCertificadosLote() {
  if (!state.templateImg) { alert("Template ainda carregando."); return; }
  const fd = getCertFormData();
  if (!fd.curso || fd.curso === "TÍTULO DO CURSO" || !fd.mes || fd.mes === "XXXX" ||
      !fd.ano || fd.ano === "XXXX" || !fd.dia || fd.dia === "XX") {
    alert("Preencha curso, dia, mês, ano e carga horária antes de emitir.");
    return;
  }
  const checks = [...document.querySelectorAll(".cert-row-check:checked")];
  if (!checks.length) return;
  const list = state._certCurrentList || [];
  const selected = checks.map((c) => list[parseInt(c.dataset.idx, 10)]).filter(Boolean);
  if (!selected.length) return;

  const btn = document.getElementById("certEmit");
  btn.disabled = true;
  const progress = document.getElementById("certProgress");
  const fill = document.getElementById("certProgressFill");
  const pctEl = document.getElementById("certProgressPct");
  const labelEl = document.getElementById("certProgressLabel");
  const statusEl = document.getElementById("certStatus");
  progress.hidden = false;
  statusEl.className = "cert-status";
  statusEl.textContent = "";
  fill.style.width = "0%";

  const { jsPDF } = window.jspdf;
  const zip = new window.JSZip();
  const tmp = document.createElement("canvas");
  tmp.width = state.templateImg.naturalWidth;
  tmp.height = state.templateImg.naturalHeight;

  for (let i = 0; i < selected.length; i++) {
    const p = selected[i];
    const fields = { ...fd, nome: p.nome };
    drawCertificateInto(tmp, fields);
    const imgData = tmp.toDataURL("image/jpeg", 0.92);
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    pdf.addImage(imgData, "JPEG", 0, 0, 297, 210);
    const blob = pdf.output("blob");
    zip.file(`certificado-${slug(p.nome)}-${slug(fd.curso)}.pdf`, blob);
    const pctVal = Math.round(((i + 1) / selected.length) * 100);
    fill.style.width = pctVal + "%";
    pctEl.textContent = pctVal + "%";
    labelEl.textContent = `Gerando ${i + 1} de ${selected.length}`;
    await new Promise((r) => setTimeout(r, 0));
  }

  labelEl.textContent = "Compactando...";
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(zipBlob);
  a.download = `certificados-${new Date().toISOString().slice(0, 10)}.zip`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);

  statusEl.classList.add("is-success");
  statusEl.textContent = `${selected.length} certificado(s) gerado(s) e baixado(s) em ZIP.`;
  btn.disabled = false;
}
