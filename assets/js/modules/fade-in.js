/* ========================================
   Scroll Fade-in Animations
   ======================================== */
export function initFadeIn() {
    const fadeElements = document.querySelectorAll(
        '.eixo-card, .eixo-card-v2, .curso-card, .quick-card, .noticia-card, .suporte-card, .sobre-stat-card, .principio, .crono-month, .aula-magna-highlight'
    );

    if (fadeElements.length === 0) return;

    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });

    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    fadeElements.forEach(el => fadeObserver.observe(el));
}
