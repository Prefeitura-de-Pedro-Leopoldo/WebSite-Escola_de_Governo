/* ========================================
   Theme Toggle (light/dark)
   Persistência via localStorage.
   Respeita preferência do sistema na primeira visita.
   ======================================== */

const STORAGE_KEY = 'egovpl-theme';

function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function initThemeToggle() {
  const theme = getInitialTheme();
  applyTheme(theme);

  const buttons = document.querySelectorAll('[data-theme-toggle]');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
    });
  });
}

// Aplica o tema antes do DOMContentLoaded para evitar flash.
applyTheme(getInitialTheme());
