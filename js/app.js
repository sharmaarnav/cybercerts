// CyberCerts – Main Application JavaScript
'use strict';

/* ============================================================
   Constants & Helpers
   ============================================================ */
const DOMAIN_META = {
  'blue-team':   { label: 'Blue Team',    color: '#00ff41' },
  'red-team':    { label: 'Red Team',     color: '#ff3e3e' },
  'cloud':       { label: 'Cloud',        color: '#0080ff' },
  'grc':         { label: 'GRC',          color: '#9d4edd' },
  'dfir':        { label: 'DFIR',         color: '#ff6b35' },
  'ai-security': { label: 'AI Security',  color: '#00f5ff' },
  'ics-ot':      { label: 'ICS/OT',       color: '#ffd700' },
  'privacy':     { label: 'Privacy',      color: '#ff69b4' },
  'appsec':      { label: 'AppSec',       color: '#7fff00' },
  'management':  { label: 'Management',   color: '#c084fc' },
  'threat-intel':{ label: 'Threat Intel', color: '#fb923c' },
  'malware':     { label: 'Malware',      color: '#ef4444' },
  'vendor':      { label: 'Vendor',       color: '#94a3b8' },
};

function domainColor(d) { return (DOMAIN_META[d] || {}).color || '#00f5ff'; }
function domainLabel(d) { return (DOMAIN_META[d] || {}).label || d; }
function levelLabel(l)  { return l ? l.charAt(0).toUpperCase() + l.slice(1) : ''; }

function certCardHtml(cert) {
  const domain = cert.domains && cert.domains[0] || 'vendor';
  const accent = domainColor(domain);
  const issuerUC = (cert.issuer || '').toUpperCase();
  const aiTag = cert.isAISecurity
    ? '<span class="ai-badge"><i class="fas fa-robot"></i> AI</span>'
    : '';
  const tags = (cert.domains || []).slice(0, 2).map(d =>
    '<span class="tag tag-' + d + '">' + domainLabel(d) + '</span>'
  ).join('');
  const raw = cert.description || '';
  const desc = raw.length > 110 ? raw.substring(0, 110) + '…' : raw;
  const cost = cert.examDetails ? cert.examDetails.cost : '?';

  return '<article class="cert-card reveal" style="--card-accent:' + accent + '"'
    + ' onclick="location.href=\'certification.html?id=' + cert.id + '\'"'
    + ' role="listitem" tabindex="0"'
    + ' onkeydown="if(event.key===\'Enter\')location.href=\'certification.html?id=' + cert.id + '\'"'
    + ' aria-label="' + cert.name + '">'
    + '<input type="checkbox" class="cert-card-compare" data-id="' + cert.id + '"'
    + ' aria-label="Select for comparison" onclick="event.stopPropagation()">'
    + '<div class="cert-card-header">'
    + '<span class="cert-code">' + cert.code + '</span>'
    + '<span class="cert-issuer-badge" style="background:' + accent + '22;color:' + accent + ';border:1px solid ' + accent + '44">' + issuerUC + '</span>'
    + aiTag
    + '</div>'
    + '<h3 class="cert-name">' + cert.name + '</h3>'
    + '<p class="cert-description">' + desc + '</p>'
    + '<div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:auto">'
    + tags
    + '<span class="badge badge-level-' + cert.level + '">' + levelLabel(cert.level) + '</span>'
    + '</div>'
    + '<div class="cert-card-footer">'
    + '<span class="cert-cost">$' + cost + '</span>'
    + '<a href="certification.html?id=' + cert.id + '" class="btn btn-ghost btn-sm"'
    + ' onclick="event.stopPropagation()">Details &rarr;</a>'
    + '</div>'
    + '</article>';
}

/* ============================================================
   Theme Toggle
   ============================================================ */
function initTheme() {
  const saved = localStorage.getItem('cyberTheme');
  if (saved === 'light') {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
  }
  document.querySelectorAll('#themeToggle, .theme-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var isLight = document.body.classList.toggle('light-mode');
      document.body.classList.toggle('dark-mode', !isLight);
      localStorage.setItem('cyberTheme', isLight ? 'light' : 'dark');
      var icon = btn.querySelector('i');
      if (icon) {
        icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
      }
    });
  });
}

/* ============================================================
   Hamburger / Mobile Nav
   ============================================================ */
function initNav() {
  var hamburger = document.querySelector('.hamburger');
  var navMenu   = document.getElementById('nav-menu');
  if (!hamburger || !navMenu) return;

  hamburger.addEventListener('click', function(e) {
    e.stopPropagation();
    var isOpen = navMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', function(e) {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
      navMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });

  navMenu.querySelectorAll('.nav-link').forEach(function(link) {
    link.addEventListener('click', function() {
      navMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ============================================================
   Scroll Reveal
   ============================================================ */
function initScrollReveal() {
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal:not(.visible)').forEach(function(el) {
    obs.observe(el);
  });
}

/* ============================================================
   Particle Canvas
   ============================================================ */
function initParticles() {
  var canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W, H, particles = [];

  function resize() {
    W = canvas.width  = canvas.parentElement ? canvas.parentElement.offsetWidth  : window.innerWidth;
    H = canvas.height = canvas.parentElement ? canvas.parentElement.offsetHeight : window.innerHeight;
    if (!W) W = window.innerWidth;
    if (!H) H = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (var i = 0; i < 70; i++) {
    particles.push({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.6,
      a: Math.random() * 0.45 + 0.1
    });
  }

  (function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(function(p) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,245,255,' + p.a + ')';
      ctx.fill();
    });
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(0,245,255,' + (0.08 * (1 - dist / 110)) + ')';
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  })();
}

/* ============================================================
   Finder (Index Page)
   ============================================================ */
function initFinder() {
  var steps = document.querySelectorAll('.finder-step');
  if (!steps.length) return;

  var currentStep = 0;
  var totalSteps  = steps.length;

  function showStep(idx) {
    if (idx < 0 || idx >= totalSteps) return;
    steps.forEach(function(s, i) { s.classList.toggle('active', i === idx); });
    document.querySelectorAll('.step-dot').forEach(function(d, i) {
      d.classList.toggle('active', i === idx);
      d.setAttribute('aria-selected', String(i === idx));
    });
    var prevBtn = document.getElementById('prevStepBtn');
    var nextBtn = document.getElementById('nextStepBtn');
    if (prevBtn) prevBtn.disabled = (idx === 0);
    if (nextBtn) {
      if (idx === totalSteps - 1) {
        nextBtn.innerHTML = '<i class="fas fa-check"></i> See Results';
      } else {
        nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
      }
      nextBtn.disabled = false;
    }
    currentStep = idx;
  }

  // Option button selection
  document.querySelectorAll('.option-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var parent = btn.closest('.option-grid');
      if (!parent) return;
      parent.querySelectorAll('.option-btn').forEach(function(b) {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
    });
  });

  // Step dots
  document.querySelectorAll('.step-dot').forEach(function(dot, idx) {
    dot.addEventListener('click', function() { showStep(idx); });
  });

  // Prev/Next buttons
  document.getElementById('prevStepBtn')?.addEventListener('click', function() {
    showStep(currentStep - 1);
  });

  document.getElementById('nextStepBtn')?.addEventListener('click', function() {
    if (currentStep < totalSteps - 1) {
      showStep(currentStep + 1);
    } else {
      showFinderResults();
    }
  });

  showStep(0);
}

function showFinderResults() {
  var resultsEl   = document.getElementById('finderResults');
  var resultsGrid = document.getElementById('resultsGrid');
  var startBtn    = document.getElementById('startJourneyBtn');
  if (!resultsEl || !resultsGrid) return;

  var experience = null, domain = null, provider = null;
  document.querySelectorAll('.finder-step').forEach(function(stepEl) {
    var sel = stepEl.querySelector('.option-btn.selected');
    if (!sel) return;
    if (stepEl.id === 'step1') experience = sel.dataset.value;
    if (stepEl.id === 'step2') domain     = sel.dataset.value;
    if (stepEl.id === 'step3') provider   = sel.dataset.value;
  });

  var certs = CERTS.slice();

  if (domain && domain !== 'any') {
    certs = certs.filter(function(c) { return c.domains.includes(domain); });
  }

  var levelMap = {
    student:      ['beginner'],
    beginner:     ['beginner', 'intermediate'],
    professional: ['intermediate', 'advanced'],
    senior:       ['advanced', 'expert'],
    specialist:   ['advanced', 'expert'],
    executive:    ['intermediate', 'advanced', 'expert'],
  };
  if (experience && levelMap[experience]) {
    var allowed = levelMap[experience];
    certs = certs.filter(function(c) { return allowed.includes(c.level); });
  }

  if (provider && provider !== 'all') {
    var byProvider = certs.filter(function(c) { return c.issuer === provider; });
    if (byProvider.length) certs = byProvider;
  }

  var top = certs.slice(0, 6);
  resultsGrid.innerHTML = top.map(certCardHtml).join('');

  if (startBtn && domain) {
    startBtn.href = 'pathway.html?domain=' + domain;
  }

  resultsEl.classList.add('active');
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(initScrollReveal, 100);
}

/* ============================================================
   Explore Page
   ============================================================ */
function initExplorePage() {
  var grid = document.getElementById('certsGrid');
  if (!grid) return;

  var filtered = CERTS.slice();
  var compareSelected = {};

  // Pre-filter from URL params
  var params = new URLSearchParams(window.location.search);
  var urlDomain = params.get('domain');
  if (urlDomain) {
    var domainSel = document.getElementById('domainFilter');
    if (domainSel) domainSel.value = urlDomain;
  }

  function applyFilters() {
    var searchEl  = document.getElementById('searchInput');
    var issuerEl  = document.getElementById('issuerFilter');
    var levelEl   = document.getElementById('levelFilter');
    var domainEl  = document.getElementById('domainFilter');
    var search = searchEl  ? searchEl.value.toLowerCase().trim()  : '';
    var issuer = issuerEl  ? issuerEl.value  : '';
    var level  = levelEl   ? levelEl.value   : '';
    var domain = domainEl  ? domainEl.value  : '';

    filtered = CERTS.filter(function(c) {
      if (search && !c.name.toLowerCase().includes(search)
        && !c.code.toLowerCase().includes(search)
        && !(c.issuer || '').toLowerCase().includes(search)) return false;
      if (issuer && c.issuer !== issuer) return false;
      if (level  && c.level !== level)  return false;
      if (domain && !c.domains.includes(domain)) return false;
      return true;
    });
    renderGrid();
    updateCount();
  }

  function renderGrid() {
    var emptyState = document.getElementById('emptyState');
    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
    } else {
      if (emptyState) emptyState.hidden = true;
      grid.innerHTML = filtered.map(certCardHtml).join('');
      Object.keys(compareSelected).forEach(function(id) {
        var cb = grid.querySelector('[data-id="' + id + '"]');
        if (cb) cb.checked = true;
      });
      setTimeout(initScrollReveal, 50);
    }
  }

  function updateCount() {
    var el = document.getElementById('resultsCount');
    if (el) el.textContent = filtered.length + ' certification' + (filtered.length !== 1 ? 's' : '');
    var total = document.getElementById('totalCount');
    if (total) total.textContent = filtered.length;
  }

  ['searchInput','issuerFilter','levelFilter','domainFilter'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', applyFilters);
  });

  var clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      var si = document.getElementById('searchInput'); if (si) si.value = '';
      ['issuerFilter','levelFilter','domainFilter'].forEach(function(id) {
        var el = document.getElementById(id); if (el) el.value = '';
      });
      applyFilters();
    });
  }

  var resetBtn = document.getElementById('resetFilters');
  if (resetBtn) resetBtn.addEventListener('click', function() { if (clearBtn) clearBtn.click(); });

  // Compare checkboxes
  grid.addEventListener('change', function(e) {
    var cb = e.target.closest ? e.target.closest('.cert-card-compare') : null;
    if (!cb) return;
    var id = cb.dataset.id;
    if (cb.checked) {
      if (Object.keys(compareSelected).length >= 3) { cb.checked = false; return; }
      compareSelected[id] = true;
    } else {
      delete compareSelected[id];
    }
    updateCompareBar();
  });

  function updateCompareBar() {
    var bar     = document.getElementById('compareBar');
    var countEl = document.getElementById('compareCount');
    var cmpBtn  = document.getElementById('compareBtn');
    if (!bar) return;
    var n = Object.keys(compareSelected).length;
    bar.hidden = (n === 0);
    if (countEl) countEl.textContent = n + ' selected';
    if (cmpBtn)  cmpBtn.disabled = (n < 2);
  }

  var compareBtn = document.getElementById('compareBtn');
  if (compareBtn) compareBtn.addEventListener('click', openCompareModal);

  var clearCmp = document.getElementById('clearCompare');
  if (clearCmp) {
    clearCmp.addEventListener('click', function() {
      compareSelected = {};
      grid.querySelectorAll('.cert-card-compare:checked').forEach(function(cb) { cb.checked = false; });
      updateCompareBar();
    });
  }

  function openCompareModal() {
    var modal = document.getElementById('compareModal');
    if (!modal) return;
    var ids   = Object.keys(compareSelected);
    var certs = ids.map(function(id) { return CERTS.find(function(c) { return c.id === id; }); }).filter(Boolean);
    var head  = document.getElementById('compareHead');
    var body  = document.getElementById('compareBody');
    if (!head || !body || !certs.length) return;

    head.innerHTML = '<th>Feature</th>' + certs.map(function(c) {
      return '<th>' + c.code + '<br><small>' + c.name + '</small></th>';
    }).join('');

    var rows = [
      ['Issuer',        function(c) { return (c.issuer || '').toUpperCase(); }],
      ['Level',         function(c) { return levelLabel(c.level); }],
      ['Domain',        function(c) { return (c.domains || []).map(domainLabel).join(', '); }],
      ['Exam Cost',     function(c) { return '$' + (c.examDetails ? c.examDetails.cost : '?'); }],
      ['Questions',     function(c) { return (c.examDetails && c.examDetails.questions) || 'Practical'; }],
      ['Duration',      function(c) { return (c.examDetails && c.examDetails.duration)  || '?'; }],
      ['Passing Score', function(c) { return (c.examDetails && c.examDetails.passingScore) || '?'; }],
      ['Validity',      function(c) { return (c.examDetails && c.examDetails.validity)   || '?'; }],
      ['Salary',        function(c) { return c.salaryRange || '?'; }],
    ];

    body.innerHTML = rows.map(function(row) {
      return '<tr><td><strong>' + row[0] + '</strong></td>' + certs.map(function(c) {
        return '<td>' + row[1](c) + '</td>';
      }).join('') + '</tr>';
    }).join('');

    modal.hidden = false;
  }

  var closeModal = document.getElementById('closeCompareModal');
  if (closeModal) closeModal.addEventListener('click', function() {
    document.getElementById('compareModal').hidden = true;
  });

  var overlay = document.getElementById('compareModal');
  if (overlay) overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.hidden = true;
  });

  // Initial render
  applyFilters();
}

/* ============================================================
   Init
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  initNav();
  initScrollReveal();
  initParticles();
  initFinder();
  initExplorePage();

  // Update live cert count from data
  var totalEl = document.getElementById('totalCerts');
  if (totalEl && typeof CERTS !== 'undefined') {
    totalEl.textContent = CERTS.length;
  }
});
