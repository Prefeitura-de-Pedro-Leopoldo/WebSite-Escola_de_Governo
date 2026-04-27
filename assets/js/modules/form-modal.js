/* ========================================
   Form Modal
   Modal reutilizavel que carrega um Google Form
   embedado via <iframe>. Usado para inscricao
   e entrega de certificado de cursos EAD.

   Pos-submit: detecta o reload do iframe (navegacao
   para a tela de confirmacao do Google Forms) e troca
   o iframe por um card de sucesso com o link de acesso
   ao curso (acessoUrl), vindo do cursos.json.
   ======================================== */

let modalEl = null;
let lastFocused = null;
let armed = false;
let armTimer = null;
let currentAcessoUrl = '';

// Tempo (ms) de "silencio" do iframe que precisamos observar antes de
// considerar o form pronto. Google Forms pode disparar varios load events
// durante o render inicial; so depois disso qualquer load novo = submit.
const ARM_DELAY_MS = 2500;

function ensureModal() {
  if (modalEl) return modalEl;

  modalEl = document.createElement('div');
  modalEl.className = 'form-modal';
  modalEl.setAttribute('aria-hidden', 'true');
  modalEl.setAttribute('role', 'dialog');
  modalEl.setAttribute('aria-modal', 'true');
  modalEl.innerHTML = `
    <div class="form-modal__backdrop" data-form-close></div>
    <div class="form-modal__panel" role="document">
      <header class="form-modal__header">
        <h2 class="form-modal__title" data-form-title></h2>
        <button type="button" class="form-modal__close" data-form-close aria-label="Fechar">
          <i class="fas fa-times"></i>
        </button>
      </header>
      <div class="form-modal__aviso" data-form-aviso hidden></div>
      <div class="form-modal__body" data-form-body>
        <iframe data-form-iframe title="Formulario" loading="lazy"
                src="about:blank" frameborder="0" marginheight="0" marginwidth="0">
          Carregando...
        </iframe>
      </div>
      <div class="form-modal__success" data-form-success hidden>
        <div class="form-modal__success-icon"><i class="fas fa-check-circle"></i></div>
        <h3 data-form-success-title>Inscrição recebida!</h3>
        <p data-form-success-msg>Sua inscrição foi enviada com sucesso.</p>
        <a data-form-success-link href="#" target="_blank" rel="noopener" class="form-modal__acesso-btn" hidden>
          <i class="fas fa-external-link-alt"></i> Acessar curso EAD
        </a>
        <button type="button" class="form-modal__success-close" data-form-close>Fechar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modalEl);

  modalEl.querySelectorAll('[data-form-close]').forEach((el) => {
    el.addEventListener('click', closeFormModal);
  });

  const iframe = modalEl.querySelector('[data-form-iframe]');
  iframe.addEventListener('load', handleIframeLoad);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl.classList.contains('is-open')) {
      closeFormModal();
    }
  });

  return modalEl;
}

function handleIframeLoad() {
  // Enquanto nao "armado", cada load reinicia o timer de quietude.
  // Quando o iframe ficar 2.5s sem disparar load, consideramos o form pronto
  // e armamos. Apos isso, qualquer novo load = submissao do usuario.
  if (!armed) {
    clearTimeout(armTimer);
    armTimer = setTimeout(() => { armed = true; }, ARM_DELAY_MS);
    return;
  }
  showSuccess();
}

function showSuccess() {
  const body = modalEl.querySelector('[data-form-body]');
  const success = modalEl.querySelector('[data-form-success]');
  const link = modalEl.querySelector('[data-form-success-link]');
  const msg = modalEl.querySelector('[data-form-success-msg]');

  if (currentAcessoUrl) {
    link.href = currentAcessoUrl;
    link.hidden = false;
    msg.textContent = 'Sua inscrição foi enviada. Acesse o curso EAD pelo botão abaixo.';
  } else {
    link.hidden = true;
    msg.textContent = 'Recebemos seu envio. Você pode fechar esta janela.';
  }

  body.hidden = true;
  success.hidden = false;
}

export function openFormModal({ src, title, aviso, acessoUrl }) {
  const modal = ensureModal();

  modal.querySelector('[data-form-title]').textContent = title || 'Formulario';

  const avisoEl = modal.querySelector('[data-form-aviso]');
  if (aviso) {
    avisoEl.textContent = aviso;
    avisoEl.hidden = false;
  } else {
    avisoEl.hidden = true;
    avisoEl.textContent = '';
  }

  const isValidUrl = acessoUrl && acessoUrl !== '#' && !acessoUrl.startsWith('#TODO');
  currentAcessoUrl = isValidUrl ? acessoUrl : '';

  // Reset estados de sucesso/iframe
  modal.querySelector('[data-form-body]').hidden = false;
  modal.querySelector('[data-form-success]').hidden = true;
  armed = false;
  clearTimeout(armTimer);

  const iframe = modal.querySelector('[data-form-iframe]');
  iframe.src = src || 'about:blank';

  lastFocused = document.activeElement;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  modal.querySelector('.form-modal__close').focus();
}

export function closeFormModal() {
  if (!modalEl) return;
  modalEl.classList.remove('is-open');
  modalEl.setAttribute('aria-hidden', 'true');
  modalEl.querySelector('[data-form-iframe]').src = 'about:blank';
  modalEl.querySelector('[data-form-body]').hidden = false;
  modalEl.querySelector('[data-form-success]').hidden = true;
  armed = false;
  clearTimeout(armTimer);
  currentAcessoUrl = '';
  document.body.style.overflow = '';
  if (lastFocused && typeof lastFocused.focus === 'function') {
    lastFocused.focus();
  }
}
