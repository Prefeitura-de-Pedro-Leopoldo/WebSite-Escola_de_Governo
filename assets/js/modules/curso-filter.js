/* ========================================
   Curso Filter
   Esconde cursos cujo mês de execução ainda não chegou.
   Mostra apenas cursos do mês atual e meses passados.
   ======================================== */

const MONTHS = {
  'janeiro': 1, 'fevereiro': 2, 'março': 3, 'marco': 3, 'abril': 4,
  'maio': 5, 'junho': 6, 'julho': 7, 'agosto': 8,
  'setembro': 9, 'outubro': 10, 'novembro': 11, 'dezembro': 12
};

const PROGRAM_YEAR = 2026;

function isAvailable(mesNum, currentYear, currentMonth) {
  if (currentYear > PROGRAM_YEAR) return true;
  if (currentYear < PROGRAM_YEAR) return false;
  return mesNum <= currentMonth;
}

function updateEixosCardsCounts(currentYear, currentMonth) {
  const cards = document.querySelectorAll('.eixo-card-v2[data-meses]');
  let totalDisponiveis = 0;
  let eixosAtivos = 0;

  cards.forEach((card) => {
    const meses = card.dataset.meses
      .split(',')
      .map((m) => parseInt(m.trim(), 10))
      .filter(Boolean);
    const total = meses.length;
    const visible = meses.filter((m) => isAvailable(m, currentYear, currentMonth)).length;

    totalDisponiveis += visible;
    if (visible > 0) eixosAtivos++;

    const countEl = card.querySelector('.eixo-card-v2__count');
    if (!countEl) return;

    const label = visible === 1 ? 'curso disponível' : 'cursos disponíveis';
    countEl.innerHTML = `<i class="fas fa-book-open"></i> ${visible} ${label}`;

    card.dataset.cursosVisible = String(visible);
    card.dataset.cursosTotal = String(total);
  });

  updateSummary('cursos-disponiveis', totalDisponiveis);
  updateSummary('eixos-ativos', eixosAtivos);
}

function updateSummary(key, value) {
  const el = document.querySelector(`[data-summary="${key}"] [data-value]`);
  if (el) el.textContent = String(value);
}

function updateAulaMagnaStatus() {
  const el = document.querySelector('.aula-magna-highlight[data-event-date]');
  if (!el) return;
  const eventDate = new Date(el.dataset.eventDate + 'T23:59:59');
  if (Date.now() <= eventDate.getTime()) return;

  el.classList.add('aula-magna-highlight--realizada');
  const status = el.querySelector('[data-event-status]');
  if (status) status.textContent = 'Evento realizado';

  const future = el.querySelector('[data-event-text-future]');
  const past = el.querySelector('[data-event-text-past]');
  if (future) future.hidden = true;
  if (past) past.hidden = false;
}

function updateCronogramaStatus(currentYear, currentMonth) {
  const months = document.querySelectorAll('.crono-month');
  months.forEach((monthEl) => {
    const label = monthEl.querySelector('.crono-month-label');
    if (!label) return;
    const mesNum = MONTHS[label.textContent.trim().toLowerCase()];
    if (!mesNum) return;

    if (currentYear > PROGRAM_YEAR) {
      monthEl.classList.add('crono-month--past');
    } else if (currentYear < PROGRAM_YEAR) {
      monthEl.classList.add('crono-month--future');
    } else if (mesNum < currentMonth) {
      monthEl.classList.add('crono-month--past');
    } else if (mesNum === currentMonth) {
      monthEl.classList.add('crono-month--current');
    } else {
      monthEl.classList.add('crono-month--future');
    }
  });
}

export function initCursoFilter() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  updateEixosCardsCounts(currentYear, currentMonth);
  updateAulaMagnaStatus();
  updateCronogramaStatus(currentYear, currentMonth);

  const grid = document.querySelector('.cursos-grid');
  if (!grid) return;

  const cards = grid.querySelectorAll('.curso-card');
  let visible = 0;

  cards.forEach((card) => {
    const mesEl = card.querySelector('.curso-card__mes');
    if (!mesEl) return;

    const mesNum = MONTHS[mesEl.textContent.trim().toLowerCase()];
    if (!mesNum) return;

    if (isAvailable(mesNum, currentYear, currentMonth)) {
      visible++;
    } else {
      card.hidden = true;
      card.style.display = 'none';
    }
  });

  const metaCount = document.querySelector('.page-banner__meta span');
  if (metaCount) {
    const label = visible === 1 ? 'curso disponível' : 'cursos disponíveis';
    metaCount.innerHTML = `<i class="fas fa-book-open"></i> ${visible} ${label}`;
  }

  if (visible === 0) {
    grid.hidden = true;
    grid.style.display = 'none';
    const empty = document.createElement('div');
    empty.className = 'cursos-empty';
    empty.innerHTML = `
      <i class="fas fa-calendar-alt cursos-empty__icon" aria-hidden="true"></i>
      <h3>Nenhum curso disponível no momento</h3>
      <p>Os próximos cursos deste eixo serão liberados conforme o cronograma 2026.</p>
      <a href="eixos.html" class="cursos-empty__link">Ver cronograma completo <i class="fas fa-arrow-right"></i></a>
    `;
    grid.insertAdjacentElement('afterend', empty);
  }
}
