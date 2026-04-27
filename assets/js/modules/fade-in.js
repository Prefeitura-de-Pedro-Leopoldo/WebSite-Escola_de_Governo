/* ========================================
   Scroll Fade-in Animations com stagger
   - Aplica delay incremental por irmao no mesmo container
   - Respeita prefers-reduced-motion
   ======================================== */
const SELECTOR =
    '.eixo-card, .eixo-card-v2, .curso-card, .quick-card, .noticia-card, .suporte-card, .sobre-stat-card, .principio, .crono-month, .aula-magna-highlight';

const STAGGER_MS = 70;   // espaco entre cards consecutivos
const MAX_STAGGER_MS = 420; // teto para listas longas

export function initFadeIn() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fadeElements = document.querySelectorAll(SELECTOR);
    if (fadeElements.length === 0) return;

    if (reduceMotion) {
        // Sem animacao — apenas garante visibilidade
        fadeElements.forEach((el) => {
            el.style.opacity = '1';
            el.style.transform = 'none';
        });
        return;
    }

    fadeElements.forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1)';
        el.style.willChange = 'opacity, transform';
    });

    const fadeObserver = new IntersectionObserver((entries) => {
        // Agrupa entradas pelo container pai para calcular stagger relativo
        const byParent = new Map();
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const parent = entry.target.parentElement;
            if (!byParent.has(parent)) byParent.set(parent, []);
            byParent.get(parent).push(entry.target);
        });

        byParent.forEach((targets) => {
            targets.forEach((el, idx) => {
                const delay = Math.min(idx * STAGGER_MS, MAX_STAGGER_MS);
                el.style.transitionDelay = `${delay}ms`;
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
                fadeObserver.unobserve(el);
                // Remove will-change apos animacao para liberar GPU
                setTimeout(() => { el.style.willChange = 'auto'; }, 600 + delay);
            });
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    fadeElements.forEach((el) => fadeObserver.observe(el));
}
