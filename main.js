/* ═══════════════════════════════════════════════════
   ARCO — main.js  v3
═══════════════════════════════════════════════════ */
'use strict';

/* ── Nav scroll shadow ── */
const siteNavs = document.querySelectorAll('.site-nav');
window.addEventListener('scroll', () => {
  siteNavs.forEach(n => n.classList.toggle('scrolled', window.scrollY > 8));
}, { passive: true });

/* ── Mobile burger ── */
const burger = document.getElementById('nav-burger');
const mobileMenu = document.getElementById('nav-mobile');
if (burger && mobileMenu) {
  burger.addEventListener('click', () => {
    const open = burger.classList.toggle('open');
    mobileMenu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
}
function closeMobile() {
  burger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── Page routing ── */
const PAGES = ['home','publications','tutorials','about'];

function showPage(name) {
  PAGES.forEach(p => {
    document.getElementById('page-' + p)?.classList.toggle('active', p === name);
  });
  document.querySelectorAll('[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === name);
  });
  closeMobile();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

document.querySelectorAll('[data-page]').forEach(el => {
  el.addEventListener('click', () => showPage(el.dataset.page));
});

/* ── Tab switching ── */
function switchTab(tab) {
  const isIR = tab === 'ir';
  document.getElementById('tab-ir').className   = 'tab-btn' + (isIR  ? ' active-ir'   : '');
  document.getElementById('tab-frag').className = 'tab-btn' + (!isIR ? ' active-frag' : '');
  document.getElementById('panel-ir').classList.toggle('active', isIR);
  document.getElementById('panel-frag').classList.toggle('active', !isIR);
}
document.getElementById('tab-ir')?.addEventListener('click',   () => switchTab('ir'));
document.getElementById('tab-frag')?.addEventListener('click', () => switchTab('frag'));

/* ── Molecule SVG ── */
function molSVG(seed, color) {
  const cx = 50, cy = 43, R = 28, r = R * .62;
  const hex  = Array.from({length:6}, (_,i) => ({ x: cx + R*Math.cos(Math.PI/3*i - Math.PI/6), y: cy + R*Math.sin(Math.PI/3*i - Math.PI/6) }));
  const hexI = Array.from({length:6}, (_,i) => ({ x: cx + r*Math.cos(Math.PI/3*i - Math.PI/6), y: cy + r*Math.sin(Math.PI/3*i - Math.PI/6) }));
  const path = hex.map((p,i) => `${i?'L':'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';
  let dbl = '';
  for (let i=0;i<6;i+=2) {
    dbl += `<line x1="${hexI[i].x.toFixed(1)}" y1="${hexI[i].y.toFixed(1)}" x2="${hexI[(i+1)%6].x.toFixed(1)}" y2="${hexI[(i+1)%6].y.toFixed(1)}" stroke="${color}" stroke-width=".9" opacity=".5"/>`;
  }
  const subs = [
    `<line x1="${hex[0].x.toFixed(1)}" y1="${hex[0].y.toFixed(1)}" x2="${(hex[0].x+15).toFixed(1)}" y2="${(hex[0].y-13).toFixed(1)}" stroke="#96a8b8" stroke-width="1.1"/><text x="${(hex[0].x+16).toFixed(1)}" y="${(hex[0].y-13).toFixed(1)}" font-size="7.5" fill="#96a8b8" font-family="DM Mono,monospace">OH</text>`,
    `<line x1="${hex[2].x.toFixed(1)}" y1="${hex[2].y.toFixed(1)}" x2="${(hex[2].x+17).toFixed(1)}" y2="${(hex[2].y+5).toFixed(1)}" stroke="#96a8b8" stroke-width="1.1"/><text x="${(hex[2].x+19).toFixed(1)}" y="${(hex[2].y+8).toFixed(1)}" font-size="7.5" fill="#96a8b8" font-family="DM Mono,monospace">CHO</text>`,
    `<line x1="${hex[4].x.toFixed(1)}" y1="${hex[4].y.toFixed(1)}" x2="${(hex[4].x-15).toFixed(1)}" y2="${(hex[4].y+11).toFixed(1)}" stroke="#96a8b8" stroke-width="1.1"/><text x="${(hex[4].x-24).toFixed(1)}" y="${(hex[4].y+19).toFixed(1)}" font-size="7.5" fill="#96a8b8" font-family="DM Mono,monospace">NH₂</text>`,
  ];
  return `<svg viewBox="0 0 100 86" class="card-mol" xmlns="http://www.w3.org/2000/svg">
    <path d="${path}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/>
    ${dbl}${subs[seed % subs.length]}
  </svg>`;
}

/* ── Elucidation ── */
function runElucidation() {
  const formula = document.getElementById('ir-formula')?.value.trim();
  const model   = document.getElementById('ir-model')?.value;
  const resultsEl = document.getElementById('ir-results');
  if (!resultsEl) return;
  if (!formula) { shakeField('ir-formula'); return; }

  resultsEl.innerHTML = `<div class="spinner-wrap"><div class="spinner" style="--spin-c:var(--rose)"></div></div>`;
  const candidates = [
    { name:'Phenol',        smiles:'c1ccccc1O',   score:'0.94' },
    { name:'Benzaldehyde',  smiles:'O=Cc1ccccc1', score:'0.76' },
    { name:'Cyclohexanone', smiles:'O=C1CCCCC1',  score:'0.61' },
  ];
  const modelLabel = model ? `· <strong>${{rf:'Random Forest',cnn:'CNN Spectral',transformer:'Transformer'}[model]||model}</strong>` : '';
  setTimeout(() => {
    resultsEl.innerHTML = `
      <p class="results-label">Top candidates for <strong>${esc(formula)}</strong> ${modelLabel}</p>
      <div class="result-grid">
        ${candidates.map((c,i) => `
          <div class="result-card" style="--card-hover:var(--rose-light)" title="Click to copy SMILES">
            ${molSVG(i,'#7d2455')}
            <div class="card-name">${c.name}</div>
            <div class="card-smiles">${c.smiles}</div>
            <span class="card-score score-rose">Score ${c.score}</span>
          </div>`).join('')}
      </div>`;
    resultsEl.querySelectorAll('.result-card').forEach((card,i) => {
      card.addEventListener('click', () => copySmiles(candidates[i].smiles, card));
    });
  }, 1500);
}

/* ── Generation ── */
function runGeneration() {
  const formula = document.getElementById('frag-formula')?.value.trim();
  const frag    = document.getElementById('frag-select')?.value;
  const resultsEl = document.getElementById('frag-results');
  if (!resultsEl) return;
  if (!formula) { shakeField('frag-formula'); return; }

  resultsEl.innerHTML = `<div class="spinner-wrap"><div class="spinner" style="--spin-c:var(--steel)"></div></div>`;
  const candidates = [
    { name:'Benzyl alcohol', smiles:'OCc1ccccc1',  score:'0.88' },
    { name:'Anisole',        smiles:'COc1ccccc1',  score:'0.72' },
    { name:'2-Methylphenol', smiles:'Cc1ccccc1O',  score:'0.65' },
  ];
  setTimeout(() => {
    resultsEl.innerHTML = `
      <p class="results-label">Generated structures for <strong>${esc(formula)}</strong>${frag?` · Fragment: <strong>${esc(frag)}</strong>`:''}</p>
      <div class="result-grid">
        ${candidates.map((c,i) => `
          <div class="result-card" style="--card-hover:var(--steel-light)" title="Click to copy SMILES">
            ${molSVG(i+3,'#2d6070')}
            <div class="card-name">${c.name}</div>
            <div class="card-smiles">${c.smiles}</div>
            <span class="card-score score-steel">Score ${c.score}</span>
          </div>`).join('')}
      </div>`;
    resultsEl.querySelectorAll('.result-card').forEach((card,i) => {
      card.addEventListener('click', () => copySmiles(candidates[i].smiles, card));
    });
  }, 1300);
}

/* ── Helpers ── */
function esc(s) {
  return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function shakeField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = 'var(--rose)';
  el.animate([{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],{duration:360,easing:'ease'});
  el.focus();
  setTimeout(() => { el.style.borderColor = ''; }, 800);
}
function copySmiles(text, card) {
  navigator.clipboard?.writeText(text).then(() => {
    const el = card.querySelector('.card-smiles');
    const orig = el.textContent;
    el.textContent = '✓ Copied!';
    setTimeout(() => { el.textContent = orig; }, 1600);
  });
}

/* ── Enter key shortcut ── */
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (document.querySelector('#panel-ir.active')?.contains(e.target))   runElucidation();
  if (document.querySelector('#panel-frag.active')?.contains(e.target)) runGeneration();
});

/* ── Globals ── */
window.showPage = showPage;
window.switchTab = switchTab;
window.runElucidation = runElucidation;
window.runGeneration = runGeneration;
