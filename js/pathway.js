// CyberCerts – Pathway Builder
'use strict';

var DOMAIN_META_P = {
  'blue-team':   { label:'Blue Team',    color:'#00ff41' },
  'red-team':    { label:'Red Team',     color:'#ff3e3e' },
  'cloud':       { label:'Cloud',        color:'#0080ff' },
  'grc':         { label:'GRC',          color:'#9d4edd' },
  'dfir':        { label:'DFIR',         color:'#ff6b35' },
  'ai-security': { label:'AI Security',  color:'#00f5ff' },
  'ics-ot':      { label:'ICS/OT',       color:'#ffd700' },
  'privacy':     { label:'Privacy',      color:'#ff69b4' },
  'appsec':      { label:'AppSec',       color:'#7fff00' },
  'management':  { label:'Management',   color:'#c084fc' },
  'threat-intel':{ label:'Threat Intel', color:'#fb923c' },
  'malware':     { label:'Malware',      color:'#ef4444' },
  'vendor':      { label:'Vendor',       color:'#94a3b8' },
};

var LEVEL_ORDER = ['beginner','intermediate','advanced','expert','specialty'];

function dColor(d) { return (DOMAIN_META_P[d]||{}).color || '#00f5ff'; }
function dLabel(d) { return (DOMAIN_META_P[d]||{}).label || d; }
function lvlLabel(l) { return l ? l.charAt(0).toUpperCase()+l.slice(1) : ''; }

function getProgress() {
  try { return JSON.parse(localStorage.getItem('ccProgress') || '{}'); } catch(e) { return {}; }
}
function setProgressItem(id, val) {
  var p = getProgress(); p[id] = val;
  try { localStorage.setItem('ccProgress', JSON.stringify(p)); } catch(e) {}
}

var wizardState = { experience: null, domain: null, provider: null };

function initPathwayPage() {
  var panels = document.querySelectorAll('.wizard-panel');
  if (!panels.length) return;

  var currentPanel = 0;
  var totalPanels = panels.length;

  function showPanel(idx) {
    panels.forEach(function(p, i) { p.classList.toggle('active', i === idx); });
    var prevBtn = document.getElementById('wizardPrevBtn');
    var nextBtn = document.getElementById('wizardNextBtn');
    if (prevBtn) prevBtn.style.display = idx === 0 ? 'none' : '';
    if (nextBtn) {
      if (idx === totalPanels - 1) {
        nextBtn.innerHTML = '<i class="fas fa-route"></i> Build Pathway';
      } else {
        nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
      }
    }
    // Update wizard step indicators
    document.querySelectorAll('.wizard-step').forEach(function(s, i) {
      s.classList.toggle('active', i === idx);
      s.classList.toggle('completed', i < idx);
    });
    currentPanel = idx;
  }

  // Option buttons in wizard
  panels.forEach(function(panel, panelIdx) {
    panel.querySelectorAll('.option-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        panel.querySelectorAll('.option-btn').forEach(function(b) {
          b.classList.remove('selected');
          b.setAttribute('aria-pressed','false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed','true');
        if (panelIdx === 0) wizardState.experience = btn.dataset.value;
        if (panelIdx === 1) wizardState.domain = btn.dataset.value;
        if (panelIdx === 2) wizardState.provider = btn.dataset.value;
      });
    });
  });

  document.getElementById('wizardPrevBtn')?.addEventListener('click', function() {
    if (currentPanel > 0) showPanel(currentPanel - 1);
  });

  document.getElementById('wizardNextBtn')?.addEventListener('click', function() {
    if (currentPanel < totalPanels - 1) {
      showPanel(currentPanel + 1);
    } else {
      buildPathway();
    }
  });

  // Check URL params
  var params = new URLSearchParams(window.location.search);
  var urlDomain = params.get('domain');
  var urlExp = params.get('exp');
  if (urlDomain) {
    wizardState.domain = urlDomain;
    // Pre-select domain button in panel 2
    var domainBtn = panels[1] ? panels[1].querySelector('[data-value="' + urlDomain + '"]') : null;
    if (domainBtn) {
      domainBtn.classList.add('selected');
      domainBtn.setAttribute('aria-pressed','true');
    }
  }
  if (urlExp) {
    wizardState.experience = urlExp;
    var expBtn = panels[0] ? panels[0].querySelector('[data-value="' + urlExp + '"]') : null;
    if (expBtn) { expBtn.classList.add('selected'); expBtn.setAttribute('aria-pressed','true'); }
  }

  showPanel(0);
  renderProgressDashboard();

  // If both domain and exp pre-selected from URL, auto-build
  if (urlDomain && urlExp) {
    setTimeout(buildPathway, 200);
  }
}

function buildPathway() {
  var domain   = wizardState.domain;
  var exp      = wizardState.experience;
  var provider = wizardState.provider;

  if (!domain) { alert('Please select a security domain first.'); return; }

  var domainCerts = CERTS.filter(function(c) { return c.domains.includes(domain); });

  // Filter by experience
  var levelMap = {
    student:      ['beginner'],
    beginner:     ['beginner','intermediate'],
    professional: ['beginner','intermediate','advanced'],
    senior:       ['intermediate','advanced','expert'],
    specialist:   ['advanced','expert'],
    executive:    ['intermediate','advanced','expert'],
  };
  var allowedLevels = exp && levelMap[exp] ? levelMap[exp] : LEVEL_ORDER;

  // Sort by level order
  domainCerts.sort(function(a, b) {
    return LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level);
  });

  // Filter by provider
  if (provider && provider !== 'all') {
    var byProv = domainCerts.filter(function(c) { return c.issuer === provider; });
    if (byProv.length >= 2) domainCerts = byProv;
  }

  // Hide wizard card, show pathway display
  var wizardCard = document.querySelector('.wizard-card');
  if (wizardCard) wizardCard.hidden = true;

  var display = document.getElementById('pathwayDisplay');
  if (!display) return;
  display.hidden = false;

  var titleEl = document.getElementById('pathwayTitle');
  var meta = DOMAIN_META_P[domain] || {};
  if (titleEl) {
    titleEl.innerHTML = '<span style="color:' + (meta.color||'#00f5ff') + '">' + (meta.label||domain) + '</span> Certification Pathway';
  }

  renderPathwayGraph(domainCerts, domain, allowedLevels);

  document.getElementById('exportPathway')?.addEventListener('click', function() { exportPathway(domainCerts); });
  document.getElementById('resetPathway')?.addEventListener('click', function() {
    if (display) display.hidden = true;
    if (wizardCard) wizardCard.hidden = false;
  });
  document.getElementById('closeCertPanel')?.addEventListener('click', function() {
    var panel = document.getElementById('certPanel');
    if (panel) panel.hidden = true;
  });
}

function renderPathwayGraph(certs, domain, allowedLevels) {
  var graph = document.getElementById('pathwayGraph');
  if (!graph) return;
  var progress = getProgress();
  var accent = dColor(domain);

  // Group by level
  var byLevel = {};
  certs.forEach(function(c) {
    if (!byLevel[c.level]) byLevel[c.level] = [];
    byLevel[c.level].push(c);
  });

  var html = '';
  LEVEL_ORDER.forEach(function(lvl) {
    var group = byLevel[lvl];
    if (!group || !group.length) return;

    html += '<div class="pathway-level-group" style="--level-accent:' + accent + '">'
      + '<div class="pathway-level-label">' + lvlLabel(lvl) + '</div>'
      + '<div class="pathway-nodes-row">';

    group.forEach(function(cert) {
      var done = !!progress[cert.id];
      var cardAccent = dColor(cert.domains[0] || domain);
      html += '<div class="pathway-node-card ' + (done ? 'completed' : '') + '"'
        + ' style="--node-accent:' + cardAccent + '"'
        + ' onclick="showCertPanel(\'' + cert.id + '\')"'
        + ' role="listitem" tabindex="0"'
        + ' aria-label="' + cert.name + (done ? ' - completed' : '') + '">'
        + (cert.isAISecurity ? '<span class="ai-badge" style="position:absolute;top:0.5rem;left:0.5rem;font-size:0.6rem"><i class="fas fa-robot"></i></span>' : '')
        + '<div class="pathway-node-code">' + cert.code + '</div>'
        + '<div class="pathway-node-name">' + (cert.name.length > 35 ? cert.name.substring(0,35)+'…' : cert.name) + '</div>'
        + '<div class="pathway-node-issuer">' + (cert.issuer||'').toUpperCase() + '</div>'
        + '<button class="pathway-node-check ' + (done ? 'done' : '') + '"'
        + ' onclick="event.stopPropagation();toggleCertProgress(\'' + cert.id + '\')"'
        + ' title="' + (done ? 'Mark incomplete' : 'Mark complete') + '" aria-label="' + (done ? 'Mark incomplete' : 'Mark complete') + '">'
        + (done ? '<i class="fas fa-check"></i>' : '<i class="far fa-circle"></i>')
        + '</button>'
        + '</div>';
    });

    html += '</div></div>';
    if (LEVEL_ORDER.indexOf(lvl) < LEVEL_ORDER.length - 1) {
      html += '<div class="pathway-level-arrow"><i class="fas fa-arrow-down"></i></div>';
    }
  });

  // Summary
  var total = certs.length;
  var done = certs.filter(function(c) { return progress[c.id]; }).length;
  var pct = total ? Math.round(done / total * 100) : 0;
  html += '<div class="pathway-progress-bar-wrap">'
    + '<div class="pathway-progress-bar" style="width:' + pct + '%;background:' + accent + '"></div>'
    + '</div>'
    + '<p class="pathway-progress-text">' + done + ' / ' + total + ' completed (' + pct + '%)</p>';

  graph.innerHTML = html;

  // Expose globals for onclick handlers
  window.showCertPanel = function(id) {
    var cert = CERTS.find(function(c) { return c.id === id; });
    if (!cert) return;
    var panel = document.getElementById('certPanel');
    var content = document.getElementById('certPanelContent');
    if (!panel || !content) return;
    var accent2 = dColor(cert.domains[0] || domain);
    content.innerHTML = '<div class="cert-panel-header" style="border-left:4px solid ' + accent2 + '">'
      + '<div class="cert-code">' + cert.code + '</div>'
      + (cert.isAISecurity ? '<span class="ai-badge"><i class="fas fa-robot"></i> AI Security</span>' : '')
      + '</div>'
      + '<h3 style="margin:0.75rem 0 0.25rem">' + cert.name + '</h3>'
      + '<div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:1rem">' + (cert.issuer||'').toUpperCase() + ' · ' + lvlLabel(cert.level) + '</div>'
      + '<p style="font-size:0.9rem;color:var(--text-secondary);line-height:1.6;margin-bottom:1rem">' + (cert.description||'') + '</p>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:1rem;font-size:0.85rem">'
      + '<div><strong>Cost:</strong> $' + (cert.examDetails ? cert.examDetails.cost : '?') + '</div>'
      + '<div><strong>Validity:</strong> ' + (cert.examDetails ? cert.examDetails.validity : '?') + '</div>'
      + '<div><strong>Salary:</strong> ' + (cert.salaryRange || '?') + '</div>'
      + '<div><strong>Format:</strong> ' + (cert.examDetails ? cert.examDetails.format : '?') + '</div>'
      + '</div>'
      + '<a href="certification.html?id=' + cert.id + '" class="btn btn-primary" style="width:100%;text-align:center">View Full Details →</a>';
    panel.hidden = false;
  };

  window.toggleCertProgress = function(id) {
    var p = getProgress();
    setProgressItem(id, !p[id]);
    renderPathwayGraph(certs, domain, allowedLevels);
    renderProgressDashboard();
  };
}

function renderProgressDashboard() {
  var container = document.getElementById('progressTrackers');
  if (!container) return;
  var progress = getProgress();
  var domains = Object.keys(DOMAIN_META_P);

  container.innerHTML = domains.map(function(domain) {
    var domCerts = CERTS.filter(function(c) { return c.domains.includes(domain); });
    var total = domCerts.length;
    if (!total) return '';
    var done = domCerts.filter(function(c) { return progress[c.id]; }).length;
    var pct = Math.round(done / total * 100);
    var color = dColor(domain);
    return '<div class="progress-tracker-item">'
      + '<div style="display:flex;justify-content:space-between;margin-bottom:0.3rem">'
      + '<span style="font-size:0.85rem">' + dLabel(domain) + '</span>'
      + '<span style="font-size:0.8rem;color:var(--text-secondary)">' + done + '/' + total + '</span>'
      + '</div>'
      + '<div style="background:var(--border-color);border-radius:4px;height:6px">'
      + '<div style="width:' + pct + '%;background:' + color + ';border-radius:4px;height:6px;transition:width 0.3s"></div>'
      + '</div>'
      + '</div>';
  }).join('');
}

function exportPathway(certs) {
  var progress = getProgress();
  var lines = ['CyberCerts – Pathway Export', new Date().toLocaleDateString(), ''];
  certs.forEach(function(c) {
    var status = progress[c.id] ? '✓' : '○';
    lines.push(status + ' ' + c.code + ' – ' + c.name + ' (' + lvlLabel(c.level) + ')');
  });
  var blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cybercerts-pathway.txt';
  a.click();
}

document.addEventListener('DOMContentLoaded', function() {
  initPathwayPage();
});
