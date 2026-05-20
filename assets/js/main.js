/* ========================================
   Escola de Governo - Pedro Leopoldo
   JavaScript - Entry Point
   ======================================== */

import { initMobileMenu } from './modules/mobile-menu.js';
import { initScrollEffects } from './modules/scroll-effects.js';
import { initCounter } from './modules/counter.js';
import { initHeroStatsAuto } from './modules/hero-stats-auto.js';
import { initFadeIn } from './modules/fade-in.js';
import { initThemeToggle } from './modules/theme-toggle.js';
import { initNoticiasFilter } from './modules/noticias-filter.js';
import { initNoticiasFeed } from './modules/noticias-feed.js';
import { initCursoFilter } from './modules/curso-filter.js';
import { initCursosRender } from './modules/cursos-render.js';
import { initCursoDetalhe } from './modules/curso-detalhe.js';
import { initEventosDestaque } from './modules/eventos-destaque.js';
import { initHeroCarousel } from './modules/hero-carousel.js';
import { initCustomCursor } from './modules/custom-cursor.js';

document.addEventListener('DOMContentLoaded', async () => {
    initThemeToggle();
    initMobileMenu();
    initScrollEffects();
    await initHeroStatsAuto();
    initCounter();
    initFadeIn();
    initHeroCarousel();
    await initNoticiasFeed();
    initNoticiasFilter();
    await initCursosRender();
    await initCursoDetalhe();
    await initEventosDestaque();
    initCursoFilter();
    initCustomCursor();
});
