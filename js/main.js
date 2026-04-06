/* ========================================
   Escola de Governo - Pedro Leopoldo
   JavaScript - Funcionalidades Globais
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {

    // ---- Mobile Menu ----
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('open');
            const icon = menuToggle.querySelector('i');
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        });

        nav.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('open');
                const icon = menuToggle.querySelector('i');
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-times');
            });
        });
    }

    // ---- Header Scroll Effect ----
    const header = document.getElementById('header');
    const backToTop = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        if (header) header.classList.toggle('scrolled', window.scrollY > 20);
        if (backToTop) backToTop.classList.toggle('visible', window.scrollY > 400);
    });

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ---- Animated Counter (Hero page only) ----
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        function animateCounters() {
            document.querySelectorAll('.stat-number[data-target]').forEach(counter => {
                const target = +counter.dataset.target;
                const duration = 2000;
                const start = performance.now();

                function update(now) {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    counter.textContent = Math.round(target * eased);
                    if (progress < 1) {
                        requestAnimationFrame(update);
                    } else {
                        counter.textContent = target > 1 ? target + '+' : target;
                    }
                }
                requestAnimationFrame(update);
            });
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(heroStats);
    }

    // ---- Scroll Fade-in Animations ----
    const fadeElements = document.querySelectorAll(
        '.eixo-card, .eixo-card-v2, .curso-card, .quick-card, .noticia-card, .suporte-card, .sobre-stat-card, .principio, .crono-month, .aula-magna-highlight'
    );

    if (fadeElements.length > 0) {
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
});
