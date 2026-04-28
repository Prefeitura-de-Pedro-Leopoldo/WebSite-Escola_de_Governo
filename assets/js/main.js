/* ========================================
   Escola de Governo - Pedro Leopoldo
   JavaScript - Entry Point
   ======================================== */

import { initMobileMenu } from './modules/mobile-menu.js';
import { initScrollEffects } from './modules/scroll-effects.js';
import { initCounter } from './modules/counter.js';
import { initFadeIn } from './modules/fade-in.js';
import { initThemeToggle } from './modules/theme-toggle.js';
import { initNoticiasFilter } from './modules/noticias-filter.js';
import { initCursoFilter } from './modules/curso-filter.js';
import { initCursosRender } from './modules/cursos-render.js';
import { initHeroCarousel } from './modules/hero-carousel.js';

document.addEventListener('DOMContentLoaded', async () => {
    initThemeToggle();
    initMobileMenu();
    initScrollEffects();
    initCounter();
    initFadeIn();
    initNoticiasFilter();
    initHeroCarousel();
    await initCursosRender();
    initCursoFilter();
});
