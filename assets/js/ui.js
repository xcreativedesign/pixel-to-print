/**
 * UI Controller — Pixel to Print v2.1
 * XCreativeDesign | MIT License
 * GitHub: https://github.com/xcreativedesign/pixel-to-print
 *
 * All image processing is client-side. No data ever leaves the browser.
 */

'use strict';

// ── State ──────────────────────────────────────────────────
const state = {
  image:          null,
  pixels:         { w: 0, h: 0 },
  exifDpi:        null,
  aspectRatio:    null,
  aspectLocked:   true,
  activePresetTab:'photo',
};

// ── DOM cache ──────────────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

let dom = {};

function cacheDOM() {
  dom = {
    // Upload
    uploadZone:     $('upload-zone'),
    fileInput:      $('file-input'),
    imagePreview:   $('image-preview'),
    previewImg:     $('preview-img'),
    previewRemove:  $('preview-remove'),
    imageStats:     $('image-stats'),
    statW:          $('stat-w'),
    statH:          $('stat-h'),
    statMP:         $('stat-mp'),
    exifBadge:      $('exif-badge'),
    exifText:       $('exif-text'),

    // Calculator inputs
    printWidth:     $('print-width'),
    printHeight:    $('print-height'),
    mediumSelect:   $('medium-select'),
    viewDistSelect: $('view-dist-select'),
    aiSelect:       $('ai-select'),
    aspectLockBtn:  $('aspect-lock-btn'),
    aspectLockLabel:$('aspect-lock-label'),

    // Presets
    presetTabs:     $$('.preset-tab'),
    presetGrid:     $('preset-grid'),

    // Calc button
    calcBtn:        $('calc-btn'),

    // Results
    resultsEmpty:   $('results-empty'),
    scoreCard:      $('score-card'),
    scoreNumber:    $('score-number'),
    scoreBadge:     $('score-badge'),
    scoreBar:       $('score-bar'),
    scoreBarWrap:   document.querySelector('.score-bar-wrap'),
    scoreMessage:   $('score-message'),
    dimInches:      $('dim-inches'),
    dimCm:          $('dim-cm'),
    dimMm:          $('dim-mm'),
    dpiAnalysis:    $('dpi-analysis'),
    rawDpiVal:      $('raw-dpi-val'),
    eDpiVal:        $('edpi-val'),
    minPercVal:     $('min-perc-dpi-val'),
    suggestionsWrap:$('suggestions-wrap'),
    maxPrintInfo:   $('max-print-info'),

    // Sweet spot
    ssWidth:        $('ss-width'),
    ssHeight:       $('ss-height'),
    ssMedium:       $('ss-medium'),
    ssViewDist:     $('ss-view-dist'),
    ssCalcBtn:      $('ss-calc-btn'),
    ssResult:       $('ss-result'),

    // Mode tabs
    modeTabs:       $$('.mode-tab'),
    modePanels:     $$('.mode-panel'),

    // Theme
    themeToggle:    $('theme-toggle'),

    // Mobile nav
    mobileMenuBtn:  $('mobile-menu-btn'),
    mobileNav:      $('mobile-nav'),

    // Goto sweetspot link
    gotoSweetspot:  $('goto-sweetspot'),

    // Toast
    toast:          $('toast'),
  };
}

// ── Theme ──────────────────────────────────────────────────
function initTheme() {
  const saved = (() => {
    try { return localStorage.getItem('p2p-theme') || 'light'; } catch(_) { return 'light'; }
  })();
  applyTheme(saved);

  dom.themeToggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });
}

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  dom.themeToggle.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  try { localStorage.setItem('p2p-theme', t); } catch(_) {}
}

// ── Mobile nav ─────────────────────────────────────────────
function initMobileNav() {
  if (!dom.mobileMenuBtn || !dom.mobileNav) return;

  // Ensure hidden on load
  dom.mobileNav.hidden = true;

  dom.mobileMenuBtn.addEventListener('click', () => {
    const isCurrentlyOpen = !dom.mobileNav.hidden;
    dom.mobileNav.hidden = isCurrentlyOpen;
    dom.mobileMenuBtn.setAttribute('aria-expanded', String(!isCurrentlyOpen));
  });

  // Close on link click
  dom.mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      dom.mobileNav.hidden = true;
      dom.mobileMenuBtn.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!dom.mobileNav.hidden &&
        !dom.mobileNav.contains(e.target) &&
        !dom.mobileMenuBtn.contains(e.target)) {
      dom.mobileNav.hidden = true;
      dom.mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !dom.mobileNav.hidden) {
      dom.mobileNav.hidden = true;
      dom.mobileMenuBtn.setAttribute('aria-expanded', 'false');
      dom.mobileMenuBtn.focus();
    }
  });
}

// ── Upload ─────────────────────────────────────────────────
function initUpload() {
  // Drag & drop
  dom.uploadZone.addEventListener('dragover', e => {
    e.preventDefault();
    dom.uploadZone.classList.add('drag-over');
  });
  dom.uploadZone.addEventListener('dragleave', e => {
    if (!dom.uploadZone.contains(e.relatedTarget)) {
      dom.uploadZone.classList.remove('drag-over');
    }
  });
  dom.uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    dom.uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  // Keyboard trigger on upload zone
  dom.uploadZone.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      dom.fileInput.click();
    }
  });

  dom.fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  });

  dom.previewRemove.addEventListener('click', clearImage);
}

function handleFile(file) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    showToast('Please upload a JPEG, PNG, or WebP image.');
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    showToast('File is too large. Please use an image under 50 MB.');
    return;
  }

  state.image = file;

  const url = URL.createObjectURL(file);
  const img  = new Image();

  img.onload = () => {
    state.pixels.w   = img.naturalWidth;
    state.pixels.h   = img.naturalHeight;
    state.aspectRatio = img.naturalWidth / img.naturalHeight;

    // Show preview
    dom.previewImg.src = url;
    dom.imagePreview.classList.add('visible');
    dom.uploadZone.style.display = 'none';

    // Stats
    dom.statW.textContent  = img.naturalWidth.toLocaleString();
    dom.statH.textContent  = img.naturalHeight.toLocaleString();
    dom.statMP.textContent = ((img.naturalWidth * img.naturalHeight) / 1_000_000).toFixed(1) + ' MP';
    dom.imageStats.classList.add('visible');

    // EXIF DPI read
    file.arrayBuffer().then(buf => {
      const exif = PPQS.readEXIFDpi(buf, file.type);
      if (exif && exif.xDpi > 0 && exif.xDpi < 12000) {
        state.exifDpi = exif.xDpi;
        dom.exifText.textContent = `EXIF: ${exif.xDpi} DPI detected`;
        dom.exifBadge.classList.add('visible');
      }
    }).catch(() => {});
  };

  img.onerror = () => showToast('Could not read this image. Please try another file.');
  img.src = url;
}

function clearImage() {
  if (dom.previewImg.src) URL.revokeObjectURL(dom.previewImg.src);
  state.image       = null;
  state.pixels      = { w: 0, h: 0 };
  state.exifDpi     = null;
  state.aspectRatio = null;

  dom.imagePreview.classList.remove('visible');
  dom.imageStats.classList.remove('visible');
  dom.exifBadge.classList.remove('visible');
  dom.uploadZone.style.display  = '';
  dom.previewImg.src             = '';
  dom.fileInput.value            = '';
}

// ── Aspect Ratio Lock ───────────────────────────────────────
function initAspectLock() {
  dom.aspectLockBtn.addEventListener('click', () => {
    state.aspectLocked = !state.aspectLocked;
    dom.aspectLockBtn.classList.toggle('locked', state.aspectLocked);
    dom.aspectLockBtn.setAttribute('aria-pressed', String(state.aspectLocked));
    dom.aspectLockLabel.textContent = state.aspectLocked ? 'Aspect ratio locked' : 'Aspect ratio unlocked';
    dom.aspectLockBtn.setAttribute('aria-label',
      state.aspectLocked ? 'Aspect ratio is locked — click to unlock' : 'Aspect ratio is unlocked — click to lock'
    );
  });

  function getAspect() {
    return state.aspectRatio
      || (state.pixels.w && state.pixels.h ? state.pixels.w / state.pixels.h : null);
  }

  dom.printWidth.addEventListener('input', () => {
    if (!state.aspectLocked) return;
    const ratio = getAspect();
    const v = parseFloat(dom.printWidth.value);
    if (ratio && !isNaN(v) && v > 0) {
      dom.printHeight.value = (v / ratio).toFixed(2);
    }
  });

  dom.printHeight.addEventListener('input', () => {
    if (!state.aspectLocked) return;
    const ratio = getAspect();
    const v = parseFloat(dom.printHeight.value);
    if (ratio && !isNaN(v) && v > 0) {
      dom.printWidth.value = (v * ratio).toFixed(2);
    }
  });
}

// ── Presets ─────────────────────────────────────────────────
function initPresets() {
  dom.presetTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      dom.presetTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      state.activePresetTab = tab.dataset.group;
      renderPresets(tab.dataset.group);
    });
  });

  renderPresets(state.activePresetTab);
}

function renderPresets(group) {
  const data = window.PRINT_PRESETS?.[group];
  if (!data) { dom.presetGrid.innerHTML = ''; return; }

  dom.presetGrid.innerHTML = data.items.map(item => `
    <button class="preset-item" type="button" role="option"
      data-w="${item.w}" data-h="${item.h}"
      data-medium="${item.medium}" data-dpi="${item.dpi}"
      aria-label="Apply preset: ${item.label}">
      ${item.label}
    </button>
  `).join('');

  dom.presetGrid.querySelectorAll('.preset-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const w = parseFloat(btn.dataset.w);
      const h = parseFloat(btn.dataset.h);
      dom.printWidth.value   = w;
      dom.printHeight.value  = h;
      dom.mediumSelect.value = btn.dataset.medium;
      if (dom.ssMedium) dom.ssMedium.value = btn.dataset.medium;
      state.aspectRatio = w / h;
      showToast(`Preset: ${btn.textContent.trim()}`);
    });
  });
}

// ── Calculator ───────────────────────────────────────────────
function initCalculator() {
  dom.calcBtn.addEventListener('click', runCalculation);

  // Enter key on dimension fields
  [dom.printWidth, dom.printHeight].forEach(el => {
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') runCalculation();
    });
  });
}

function runCalculation() {
  const pw = state.pixels.w;
  const ph = state.pixels.h;
  const tw = parseFloat(dom.printWidth.value);
  const th = parseFloat(dom.printHeight.value);

  if (!pw || !ph) {
    showToast('Please upload an image first.');
    return;
  }
  if (!tw || !th || tw <= 0 || th <= 0) {
    showToast('Please enter a valid print width and height.');
    return;
  }
  if (tw > 2400 || th > 2400) {
    showToast('Print dimensions seem unusually large. Please check the values.');
    return;
  }

  const result = PPQS.calculate(
    pw, ph, tw, th,
    dom.mediumSelect.value,
    dom.viewDistSelect.value,
    dom.aiSelect.value
  );

  if (result.error) {
    showToast(result.error);
    return;
  }

  renderResults(result);
}

// ── Render Results ───────────────────────────────────────────
function renderResults(r) {
  // Hide empty state
  dom.resultsEmpty.style.display = 'none';

  // Score
  dom.scoreCard.hidden = false;
  dom.scoreNumber.textContent  = r.ppqs.score;
  dom.scoreNumber.style.color  = r.ppqs.color;
  dom.scoreBar.style.width     = r.ppqs.score + '%';
  dom.scoreBar.style.background = r.ppqs.color;
  dom.scoreBarWrap.setAttribute('aria-valuenow', r.ppqs.score);
  dom.scoreBadge.textContent   = r.ppqs.icon + ' ' + r.ppqs.rating;
  dom.scoreBadge.style.background = r.ppqs.color + '1A';
  dom.scoreBadge.style.color   = r.ppqs.color;
  dom.scoreMessage.textContent = r.ppqs.message;

  // Dimensions
  dom.dimInches.textContent = `${r.dimensions.inches.w} × ${r.dimensions.inches.h}`;
  dom.dimCm.textContent     = `${r.dimensions.cm.w} × ${r.dimensions.cm.h}`;
  dom.dimMm.textContent     = `${r.dimensions.mm.w} × ${r.dimensions.mm.h}`;

  // DPI Analysis
  dom.dpiAnalysis.hidden     = false;
  dom.rawDpiVal.textContent  = r.calculation.rawDpi + ' DPI';
  dom.eDpiVal.textContent    = r.calculation.effectiveDpi + ' eDPI';
  dom.minPercVal.textContent = r.calculation.minPerceptibleDpi + ' DPI';

  // Max print
  dom.maxPrintInfo.hidden = false;
  dom.maxPrintInfo.innerHTML = `
    Max safe print at ${r.maxPrint.at_dpi} DPI:
    <strong>${r.maxPrint.inches.w} × ${r.maxPrint.inches.h} in</strong>
    (${r.maxPrint.cm.w} × ${r.maxPrint.cm.h} cm)
  `;

  // Suggestions
  if (r.suggestions.length > 0) {
    dom.suggestionsWrap.hidden = false;
    dom.suggestionsWrap.innerHTML = r.suggestions.map(s => `
      <div class="suggestion-card ${s.priority}" role="alert">
        <div class="suggestion-title">${escHtml(s.title)}</div>
        <div class="suggestion-detail">${escHtml(s.detail)}</div>
        ${s.tools ? `
          <div class="suggestion-tools">
            ${s.tools.map(t => `<span class="suggestion-tool-tag">${escHtml(t)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');
  } else {
    dom.suggestionsWrap.hidden = true;
    dom.suggestionsWrap.innerHTML = '';
  }

  // Scroll results into view on mobile
  if (window.innerWidth < 1024) {
    setTimeout(() => {
      document.getElementById('results-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}

// ── Copy Buttons ─────────────────────────────────────────────
function initCopyButtons() {
  document.querySelectorAll('.dim-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.closest('.dim-card').querySelector('.dim-value').textContent.trim();
      navigator.clipboard.writeText(val).then(() => {
        showToast('Copied to clipboard');
      }).catch(() => {
        showToast('Copy not supported in this browser');
      });
    });
  });
}

// ── Sweet Spot ────────────────────────────────────────────────
function initSweetSpot() {
  if (!dom.ssCalcBtn) return;

  dom.ssCalcBtn.addEventListener('click', () => {
    const w = parseFloat(dom.ssWidth.value);
    const h = parseFloat(dom.ssHeight.value);

    if (!w || !h || w <= 0 || h <= 0) {
      showToast('Please enter a valid print size.');
      return;
    }

    const r = PPQS.sweetSpot(w, h, dom.ssMedium.value, dom.ssViewDist.value);

    dom.ssResult.innerHTML = `
      <div class="suggestion-card positive" role="status">
        <div class="suggestion-title">Sweet Spot Found ✦</div>
        <div class="suggestion-detail">${escHtml(r.interpretation)}</div>
      </div>
      <div style="padding:0;border:none;display:flex;flex-direction:column;gap:0;border:1px solid var(--border-default);border-radius:var(--radius-md);overflow:hidden;">
        ${[
          ['Recommended DPI',   r.sweetSpotDpi + ' DPI'],
          ['Required width',    r.requiredPixels.width.toLocaleString() + ' px'],
          ['Required height',   r.requiredPixels.height.toLocaleString() + ' px'],
          ['Total megapixels',  r.requiredPixels.megapixels + ' MP'],
          ['Min perceptible DPI', r.minPerceptibleDpi + ' DPI'],
        ].map(([label, value]) => `
          <div class="dpi-row" style="padding:10px 16px;background:var(--bg-surface);border-bottom:1px solid var(--border-default);">
            <span class="dpi-row-label">${label}</span>
            <span class="dpi-row-value">${value}</span>
          </div>
        `).join('')}
      </div>
    `;
  });

  // Sync medium between calculator and sweet spot
  if (dom.mediumSelect && dom.ssMedium) {
    dom.mediumSelect.addEventListener('change', () => {
      dom.ssMedium.value = dom.mediumSelect.value;
    });
    dom.ssMedium.addEventListener('change', () => {
      dom.mediumSelect.value = dom.ssMedium.value;
    });
  }
}

// ── Mode Tabs ─────────────────────────────────────────────────
function initModeTabs() {
  dom.modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      dom.modeTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      dom.modePanels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const target = $(tab.dataset.panel);
      if (target) target.classList.add('active');
    });
  });

  // Goto sweetspot button in empty results state
  if (dom.gotoSweetspot) {
    dom.gotoSweetspot.addEventListener('click', () => {
      const ssTab = document.querySelector('[data-panel="panel-sweetspot"]');
      if (ssTab) ssTab.click();
      document.getElementById('main-tool').scrollIntoView({ behavior: 'smooth' });
    });
  }
}

// ── Toast ──────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  dom.toast.textContent = msg;
  dom.toast.classList.add('show');
  toastTimer = setTimeout(() => dom.toast.classList.remove('show'), 2800);
}

// ── Utilities ──────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  cacheDOM();
  initTheme();
  initMobileNav();
  initUpload();
  initAspectLock();
  initPresets();
  initCalculator();
  initCopyButtons();
  initSweetSpot();
  initModeTabs();
});
