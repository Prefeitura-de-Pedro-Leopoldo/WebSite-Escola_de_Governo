/* ========================================
   Cursos Render
   Le assets/data/cursos.json e renderiza os cards
   nos containers <div class="cursos-grid" data-cursos-eixo="..."></div>
   ======================================== */

import { openFormModal } from './form-modal.js';

const DATA_URL = new URL('../../data/cursos.json', import.meta.url);

const FORM_BASE = 'https://docs.google.com/forms/d/e/';

function buildModalidadeTag(modalidade) {
  const isEad = modalidade === 'ead';
  const label = isEad ? 'EAD' : 'Presencial';
  const cls = isEad ? 'curso-card__modalidade--ead' : 'curso-card__modalidade--presencial';
  return `<span class="curso-card__modalidade ${cls}">${label}</span>`;
}

let formsDefault = {};

function buildFooter(curso) {
  if (curso.modalidade === 'presencial') {
    const customLabel = curso.inscricaoLabel;
    const url = curso.inscricaoUrl;

    // Sem URL: badge informativo nao-clicavel (ex: "Convocação", "Encerrado")
    if (!url) {
      const label = customLabel || 'Em breve';
      return `
        <span class="curso-card__cta curso-card__cta--soon" aria-disabled="true">
          ${escapeHtml(label)}
        </span>
      `;
    }

    const label = customLabel || 'Inscrever-se no Sympla';
    return `
      <a class="curso-card__btn curso-card__btn--primary" href="${url}" target="_blank" rel="noopener">
        <i class="fas fa-ticket-alt"></i> ${escapeHtml(label)}
      </a>
    `;
  }

  if (curso.modalidade === 'ead') {
    const inscricaoFormId = curso.inscricaoFormId || formsDefault.inscricaoFormId || '';
    const inscricaoSrc = inscricaoFormId ? FORM_BASE + inscricaoFormId + '/viewform?embedded=true' : '';
    const certUrl = curso.certificadoUrl || formsDefault.certificadoUrl || '';
    const acesso = curso.acessoCursoUrl || '';
    return `
      <button type="button" class="curso-card__btn curso-card__btn--primary"
              data-form-open data-src="${inscricaoSrc}"
              data-title="Inscrição - ${escapeHtml(curso.titulo)}"
              data-acesso="${escapeHtml(acesso)}">
        <i class="fas fa-edit"></i> Inscrever-se
      </button>
      <a class="curso-card__btn curso-card__btn--secondary"
         href="${certUrl || '#'}" target="_blank" rel="noopener"
         title="Abre em nova aba — exige login Google para anexar o PDF">
        <i class="fas fa-file-upload"></i> Entregar certificado
      </a>
    `;
  }
  return '';
}

function buildCard(curso) {
  const mes = curso.mes ? capitalize(curso.mes) : '';
  return `
    <div class="curso-card" data-modalidade="${curso.modalidade}">
      <div class="curso-card__header">
        <span class="curso-card__mes">${mes}</span>
        ${buildModalidadeTag(curso.modalidade)}
      </div>
      <div class="curso-card__body">
        <div class="curso-card__icon"><i class="${curso.icone || 'fas fa-book'}"></i></div>
        <h3>${escapeHtml(curso.titulo)}</h3>
        <p>${escapeHtml(curso.descricao || '')}</p>
      </div>
      <div class="curso-card__footer">
        ${buildFooter(curso)}
      </div>
    </div>
  `;
}

function buildEmptyState() {
  return `
    <div class="cursos-empty">
      <i class="fas fa-calendar-alt cursos-empty__icon" aria-hidden="true"></i>
      <h3>Nenhum curso disponivel no momento</h3>
      <p>Os proximos cursos deste eixo serao liberados conforme o cronograma 2026.</p>
      <a href="eixos.html" class="cursos-empty__link">Ver cronograma completo <i class="fas fa-arrow-right"></i></a>
    </div>
  `;
}

function renderTrilha(trilha) {
  const cardsHtml = trilha.cursos.map(buildCard).join('');
  if (!trilha.nome) return cardsHtml;
  return `
    <div class="trilha-group">
      <h3 class="trilha-group__title">${escapeHtml(trilha.nome)}</h3>
      <div class="trilha-group__cards">${cardsHtml}</div>
    </div>
  `;
}

function bindFormButtons(container) {
  container.querySelectorAll('[data-form-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openFormModal({
        src: btn.dataset.src,
        title: btn.dataset.title,
        aviso: btn.dataset.aviso || '',
        acessoUrl: btn.dataset.acesso || ''
      });
    });
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function initCursosRender() {
  const containers = document.querySelectorAll('[data-cursos-eixo]');
  if (!containers.length) return;

  let data;
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    data = await res.json();
    formsDefault = data.formsDefault || {};
  } catch (err) {
    console.error('Falha ao carregar cursos.json', err);
    containers.forEach((c) => { c.innerHTML = buildEmptyState(); });
    return;
  }

  containers.forEach((container) => {
    const eixoKey = container.dataset.cursosEixo;
    const eixo = data.eixos && data.eixos[eixoKey];
    if (!eixo) {
      container.innerHTML = buildEmptyState();
      return;
    }

    const allCursos = eixo.trilhas.flatMap((t) => t.cursos);
    if (!allCursos.length) {
      container.innerHTML = buildEmptyState();
      return;
    }

    container.innerHTML = eixo.trilhas
      .filter((t) => t.cursos.length > 0)
      .map(renderTrilha)
      .join('');

    bindFormButtons(container);
  });
}
