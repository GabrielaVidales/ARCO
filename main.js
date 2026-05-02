/* ═══════════════════════════════════════════════════
   ARCO — main.js
   Navigation · Tab switching · Simulated results
═══════════════════════════════════════════════════ */

'use strict';

/* ── Nav scroll shadow ── */
const siteNav = document.querySelector('.site-nav');
if (siteNav) {
  window.addEventListener('scroll', () => {
    siteNav.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });
}

/* ── Mobile burger menu ── */
const burger = document.getElementById('nav-burger');
const mobileMenu = document.getElementById('nav-mobile');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    mobileMenu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
}

function closeMobileMenu() {
  if (burger) burger.classList.remove('open');
  if (mobileMenu) mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── Page routing ── */
const PAGES = ['home', 'publications', 'tutorials', 'about'];

function showPage(name) {
  // Hide all, show target
  PAGES.forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) el.classList.toggle('active', p === name);
  });

  // Sync nav active states across all navs
  document.querySelectorAll('[data-page]').forEach(link => {
    link.classList.toggle('active', link.dataset.page === name);
  });

  closeMobileMenu();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// Wire all nav links
document.querySelectorAll('[data-page]').forEach(link => {
  link.addEventListener('click', () => showPage(link.dataset.page));
});

/* ── Tab switching ── */
function switchTab(tab) {
  const isIR = tab === 'ir';

  const btnIR   = document.getElementById('tab-ir');
  const btnFrag = document.getElementById('tab-frag');
  const panelIR   = document.getElementById('panel-ir');
  const panelFrag = document.getElementById('panel-frag');

  if (btnIR)   btnIR.className   = 'tab-btn' + (isIR  ? ' active-ir'   : '');
  if (btnFrag) btnFrag.className = 'tab-btn' + (!isIR ? ' active-frag' : '');
  if (panelIR)   panelIR.classList.toggle('active', isIR);
  if (panelFrag) panelFrag.classList.toggle('active', !isIR);
}

document.getElementById('tab-ir')?.addEventListener('click', () => switchTab('ir'));
document.getElementById('tab-frag')?.addEventListener('click', () => switchTab('frag'));

/* ══════════════════════════════════════════════
   MOLECULE SVG RENDERER
   Draws a simple skeletal structure placeholder
══════════════════════════════════════════════ */
function makeMolSVG(seed, accentColor) {
  const W = 90, H = 78;
  const cx = W / 2, cy = H / 2;
  const R  = 26;

  // Hexagon vertices (benzene-like ring)
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
  });

  const hexPath = hex.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

  // Alternating double-bond ticks (inner ring)
  const innerR = R * 0.62;
  const innerHex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return { x: cx + innerR * Math.cos(a), y: cy + innerR * Math.sin(a) };
  });

  let doubleBonds = '';
  for (let i = 0; i < 6; i += 2) {
    const a = innerHex[i], b = innerHex[(i + 1) % 6];
    doubleBonds += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="${accentColor}" stroke-width=".9" opacity=".55"/>`;
  }

  // Substituent based on seed
  const substituents = [
    /* OH */  `<line x1="${hex[0].x.toFixed(1)}" y1="${hex[0].y.toFixed(1)}" x2="${(hex[0].x + 14).toFixed(1)}" y2="${(hex[0].y - 12).toFixed(1)}" stroke="#8090a0" stroke-width="1.1"/><text x="${(hex[0].x + 15).toFixed(1)}" y="${(hex[0].y - 13).toFixed(1)}" font-size="7" fill="#8090a0" font-family="DM Mono, monospace">OH</text>`,
    /* C=O */ `<line x1="${hex[2].x.toFixed(1)}" y1="${hex[2].y.toFixed(1)}" x2="${(hex[2].x + 16).toFixed(1)}" y2="${(hex[2].y + 4).toFixed(1)}" stroke="#8090a0" stroke-width="1.1"/><text x="${(hex[2].x + 18).toFixed(1)}" y="${(hex[2].y + 7).toFixed(1)}" font-size="7" fill="#8090a0" font-family="DM Mono, monospace">CHO</text>`,
    /* NH2 */ `<line x1="${hex[4].x.toFixed(1)}" y1="${hex[4].y.toFixed(1)}" x2="${(hex[4].x - 15).toFixed(1)}" y2="${(hex[4].y + 10).toFixed(1)}" stroke="#8090a0" stroke-width="1.1"/><text x="${(hex[4].x - 22).toFixed(1)}" y="${(hex[4].y + 18).toFixed(1)}" font-size="7" fill="#8090a0" font-family="DM Mono, monospace">NH₂</text>`,
  ];

  return `<svg viewBox="0 0 ${W} ${H}" class="card-mol" xmlns="http://www.w3.org/2000/svg">
    <path d="${hexPath}" fill="none" stroke="${accentColor}" stroke-width="1.5" stroke-linejoin="round"/>
    ${doubleBonds}
    ${substituents[seed % substituents.length]}
  </svg>`;
}

/* ══════════════════════════════════════════════
   ELUCIDATION (ARCO IR)
══════════════════════════════════════════════ */
function runElucidation() {
  const peaks   = document.getElementById('ir-peaks')?.value.trim();
  const formula = document.getElementById('ir-formula')?.value.trim();
  const model   = document.getElementById('ir-model')?.value;
  const resultsEl = document.getElementById('ir-results');
  if (!resultsEl) return;

  if (!formula) {
    shakeField('ir-formula');
    return;
  }

  resultsEl.innerHTML = `<div class="spinner-wrap"><div class="spinner" style="--spin-color:var(--rose)"></div></div>`;

  const candidates = [
    { name: 'Phenol',         smiles: 'c1ccccc1O',      score: '0.94', rank: 1 },
    { name: 'Benzaldehyde',   smiles: 'O=Cc1ccccc1',    score: '0.76', rank: 2 },
    { name: 'Cyclohexanone',  smiles: 'O=C1CCCCC1',     score: '0.61', rank: 3 },
  ];

  const modelLabel = model
    ? `· <strong>${{ rf:'Random Forest', cnn:'CNN Spectral', transformer:'Transformer' }[model] || model}</strong>`
    : '';

  setTimeout(() => {
    resultsEl.innerHTML = `
      <p class="results-label">
        Top candidates for <strong>${escHtml(formula)}</strong>
        ${modelLabel}
        ${peaks ? `· IR peaks detected` : ''}
      </p>
      <div class="result-grid">
        ${candidates.map((c, i) => `
          <div class="result-card" style="--card-accent:var(--rose-light);" title="Click to copy SMILES">
            ${makeMolSVG(i, '#993366')}
            <div class="card-name">${c.name}</div>
            <div class="card-smiles">${c.smiles}</div>
            <span class="card-score score-rose">Score ${c.score}</span>
          </div>
        `).join('')}
      </div>
    `;
    // Copy SMILES on click
    resultsEl.querySelectorAll('.result-card').forEach((card, i) => {
      card.addEventListener('click', () => copyToClipboard(candidates[i].smiles, card));
    });
  }, 1500);
}

/* ══════════════════════════════════════════════
   GENERATION (ARCO Fragments)
══════════════════════════════════════════════ */
function runGeneration() {
  const formula = document.getElementById('frag-formula')?.value.trim();
  const frag    = document.getElementById('frag-select')?.value;
  const groups  = document.getElementById('frag-groups')?.value.trim();
  const resultsEl = document.getElementById('frag-results');
  if (!resultsEl) return;

  if (!formula) {
    shakeField('frag-formula');
    return;
  }

  resultsEl.innerHTML = `<div class="spinner-wrap"><div class="spinner" style="--spin-color:var(--steel)"></div></div>`;

  const candidates = [
    { name: 'Benzyl alcohol', smiles: 'OCc1ccccc1',   score: '0.88' },
    { name: 'Anisole',        smiles: 'COc1ccccc1',   score: '0.72' },
    { name: '2-Methylphenol', smiles: 'Cc1ccccc1O',   score: '0.65' },
  ];

  setTimeout(() => {
    resultsEl.innerHTML = `
      <p class="results-label">
        Generated structures for <strong>${escHtml(formula)}</strong>
        ${frag ? `· Fragment: <strong>${escHtml(frag)}</strong>` : ''}
        ${groups ? `· Groups: <strong>${escHtml(groups)}</strong>` : ''}
      </p>
      <div class="result-grid">
        ${candidates.map((c, i) => `
          <div class="result-card" style="--card-accent:var(--steel-light);" title="Click to copy SMILES">
            ${makeMolSVG(i + 3, '#467886')}
            <div class="card-name">${c.name}</div>
            <div class="card-smiles">${c.smiles}</div>
            <span class="card-score score-steel">Score ${c.score}</span>
          </div>
        `).join('')}
      </div>
    `;
    resultsEl.querySelectorAll('.result-card').forEach((card, i) => {
      card.addEventListener('click', () => copyToClipboard(candidates[i].smiles, card));
    });
  }, 1300);
}

/* ── Helpers ── */
function shakeField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = 'var(--rose)';
  el.style.animation = 'none';
  requestAnimationFrame(() => {
    el.style.animation = 'shake .35s var(--ease)';
  });
  el.focus();
  el.addEventListener('animationend', () => {
    el.style.animation = '';
    el.style.borderColor = '';
  }, { once: true });
}

function escHtml(str) {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function copyToClipboard(text, card) {
  navigator.clipboard?.writeText(text).then(() => {
    const orig = card.querySelector('.card-smiles').textContent;
    card.querySelector('.card-smiles').textContent = '✓ Copied!';
    setTimeout(() => {
      card.querySelector('.card-smiles').textContent = orig;
    }, 1600);
  });
}

// Add shake keyframe to document
const style = document.createElement('style');
style.textContent = `@keyframes shake {
  0%,100%{transform:translateX(0)}
  20%{transform:translateX(-5px)}
  40%{transform:translateX(5px)}
  60%{transform:translateX(-4px)}
  80%{transform:translateX(4px)}
}`;
document.head.appendChild(style);

/* ── Enter key on inputs ── */
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const active = document.querySelector('#panel-ir.active');
  const activeFrag = document.querySelector('#panel-frag.active');
  if (active && active.contains(e.target)) runElucidation();
  if (activeFrag && activeFrag.contains(e.target)) runGeneration();
});

/* ── Expose globals for inline event use ── */
window.showPage     = showPage;
window.switchTab    = switchTab;
window.runElucidation = runElucidation;
window.runGeneration  = runGeneration;
