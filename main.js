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
