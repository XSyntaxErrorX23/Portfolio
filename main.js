(function () {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    const lbImg = lightbox.querySelector('.lightbox-img');
    const lbClose = lightbox.querySelector('.lightbox-close');

    const open = (src, alt) => {
        lbImg.src = src;
        lbImg.alt = alt || '';
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const close = () => {
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        lbImg.src = '';
        document.body.style.overflow = '';
    };

    document.querySelectorAll('.project-thumb, .cert-img').forEach(img => {
        img.addEventListener('click', () => open(img.src, img.alt));
    });

    lightbox.addEventListener('click', e => {
        if (e.target === lightbox || e.target === lbClose) close();
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && lightbox.classList.contains('open')) close();
    });
})();

(function () {
    const el = document.getElementById('roleTypewriter');
    if (!el) return;

    const roles = [
        'SOFTWARE ENGINEER',
        'COMPUTER ENGINEER',
        'BACK END DEVELOPER',
        'FULL-STACK DEVELOPER',
        'VIDEO EDITOR',
        'RESEARCHER'
    ];

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        el.textContent = roles[0];
        return;
    }

    let roleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const TYPE_MS = 80;
    const DELETE_MS = 40;
    const HOLD_MS = 1500;
    const PAUSE_MS = 400;

    function step() {
        const word = roles[roleIndex];

        if (!deleting) {
            charIndex++;
            el.textContent = word.slice(0, charIndex);
            if (charIndex === word.length) {
                deleting = true;
                setTimeout(step, HOLD_MS);
                return;
            }
            setTimeout(step, TYPE_MS);
        } else {
            charIndex--;
            el.textContent = word.slice(0, charIndex);
            if (charIndex === 0) {
                deleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                setTimeout(step, PAUSE_MS);
                return;
            }
            setTimeout(step, DELETE_MS);
        }
    }

    el.textContent = '';
    setTimeout(step, 600);
})();
