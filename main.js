const TABS = ['status', 'equipment', 'lineage', 'grace'];

function showTab(name) {
    if (!TABS.includes(name)) name = 'status';
    document.querySelectorAll('.er-panel').forEach(p => {
        p.classList.toggle('active', p.id === `tab-${name}`);
    });
    document.querySelectorAll('.er-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === name);
    });
    if (location.hash.slice(1) !== name) {
        history.replaceState(null, '', `#${name}`);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderDetail(slot) {
    const detail = document.getElementById('equipDetail');
    if (!detail || !slot || !slot.dataset.name) return;
    const tags = slot.dataset.tags;
    detail.innerHTML = `
        <h3>${slot.dataset.name}</h3>
        ${tags ? `<p class="er-tags">${tags}</p>` : ''}
        <p>${slot.dataset.desc || 'No description yet.'}</p>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.er-tab').forEach(t => {
        t.addEventListener('click', () => showTab(t.dataset.tab));
    });

    window.addEventListener('hashchange', () => showTab(location.hash.slice(1)));

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') showTab('status');
    });

    document.querySelectorAll('.er-equip-slot[data-name]').forEach(slot => {
        slot.addEventListener('mouseenter', () => renderDetail(slot));
        slot.addEventListener('focus', () => renderDetail(slot));
        slot.addEventListener('click', e => { e.preventDefault(); renderDetail(slot); });
    });

    showTab(location.hash.slice(1) || 'status');
});
