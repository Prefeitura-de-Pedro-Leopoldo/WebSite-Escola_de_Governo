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

document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initMobileMenu();
    initScrollEffects();
    initCounter();
    initFadeIn();
    initNoticiasFilter();
});
