// CyberCerts – Certification Detail Page
'use strict';

var DOMAIN_META_C = {
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

function dColorC(d) { return (DOMAIN_META_C[d]||{}).color || '#00f5ff'; }
function dLabelC(d) { return (DOMAIN_META_C[d]||{}).label || d; }
function lvlLabelC(l) { return l ? l.charAt(0).toUpperCase()+l.slice(1) : ''; }

function getProgressC() {
  try { return JSON.parse(localStorage.getItem('ccProgress')||'{}'); } catch(e) { return {}; }
}
function setProgressC(id, val) {
  var p = getProgressC(); p[id] = val;
  try { localStorage.setItem('ccProgress', JSON.stringify(p)); } catch(e) {}
}

function initCertPage() {
  var params = new URLSearchParams(window.location.search);
  var id = params.get('id');

  var loadingEl  = document.getElementById('loadingState');
  var errorEl    = document.getElementById('errorState');
  var contentEl  = document.getElementById('certDetailContent');

  function hideLoading() { if (loadingEl) loadingEl.hidden = true; }

  if (!id) { hideLoading(); if (errorEl) errorEl.hidden = false; return; }
  var cert = CERTS.find(function(c) { return c.id === id; });
  if (!cert) { hideLoading(); if (errorEl) errorEl.hidden = false; return; }

  hideLoading();
  if (contentEl) contentEl.hidden = false;

  document.title = cert.name + ' | CyberCerts';

  var domain = cert.domains && cert.domains[0] || 'vendor';
  var accent = dColorC(domain);

  // Breadcrumb
  var bc = document.getElementById('breadcrumbCert');
  if (bc) bc.textContent = cert.code;

  // Issuer badge
  var issuerBadge = document.getElementById('certIssuerBadge');
  if (issuerBadge) {
    issuerBadge.textContent = (cert.issuer||'').toUpperCase();
    issuerBadge.style.background = accent + '22';
    issuerBadge.style.color = accent;
    issuerBadge.style.border = '1px solid ' + accent + '44';
    issuerBadge.style.padding = '0.3rem 0.75rem';
    issuerBadge.style.borderRadius = '6px';
    issuerBadge.style.fontWeight = '700';
    issuerBadge.style.fontSize = '0.85rem';
  }

  // Code, name, level badge
  var codeEl = document.getElementById('certCode');
  if (codeEl) codeEl.textContent = cert.code;

  var nameEl = document.getElementById('certName');
  if (nameEl) nameEl.textContent = cert.name;

  var levelBadge = document.getElementById('certLevelBadge');
  if (levelBadge) {
    levelBadge.className = 'cert-level-badge badge badge-level-' + (cert.level||'');
    levelBadge.textContent = lvlLabelC(cert.level);
  }

  var aiBadge = document.getElementById('aiSecurityBadge');
  if (aiBadge) aiBadge.hidden = !cert.isAISecurity;

  // Domain tags
  var domainTags = document.getElementById('certDomainTags');
  if (domainTags) {
    domainTags.innerHTML = (cert.domains||[]).map(function(d) {
      return '<span class="tag tag-' + d + '">' + dLabelC(d) + '</span>';
    }).join('');
  }

  // Detail header border
  var headerEl = document.getElementById('certDetailHeader');
  if (headerEl) headerEl.style.borderLeft = '5px solid ' + accent;

  // Quick stats
  var e = cert.examDetails || {};
  setText('qsCost',     '$' + (e.cost || '?'));
  setText('qsValidity', e.validity || '?');
  setText('qsLevel',    lvlLabelC(cert.level));

  // Progress toggle
  var progress = getProgressC();
  var progressCheck = document.getElementById('progressCheck');
  if (progressCheck) {
    progressCheck.checked = !!progress[cert.id];
    progressCheck.addEventListener('change', function() {
      setProgressC(cert.id, progressCheck.checked);
    });
  }

  // Tab switching
  document.querySelectorAll('.cert-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.cert-tab').forEach(function(t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected','false');
      });
      document.querySelectorAll('.tab-panel').forEach(function(p) {
        p.classList.remove('active');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected','true');
      var panelId = 'tab' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
      var panel = document.getElementById(panelId);
      if (panel) panel.classList.add('active');
    });
  });

  // Populate all tabs
  populateOverview(cert);
  populateSkills(cert, accent);
  populatePrerequisites(cert);
  populateExam(cert);
  populateCareer(cert, accent);
  populateResources(cert, accent);
  populateNext(cert);
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

function populateOverview(cert) {
  setText('tabOverviewDesc', cert.description || '');
  setText('tabOverviewWho',  cert.whoIsItFor  || '');
  setText('tabOverviewWhy',  cert.whyGetIt    || '');
}

function populateSkills(cert, accent) {
  var container = document.getElementById('skillsList');
  if (!container || !cert.skills) return;
  container.innerHTML = cert.skills.map(function(s) {
    return '<div class="skill-item">'
      + '<div class="skill-item-header">'
      + '<span class="skill-name">' + s.name + '</span>'
      + '<span class="skill-pct">' + s.pct + '%</span>'
      + '</div>'
      + '<div class="skill-bar-bg">'
      + '<div class="skill-bar-fill" style="width:' + s.pct + '%;background:' + accent + '"></div>'
      + '</div>'
      + '</div>';
  }).join('');
}

function populatePrerequisites(cert) {
  var prereq = cert.prerequisites || {};
  setText('prereqExperience', prereq.experience || 'No specific prerequisites listed.');

  var certsEl = document.getElementById('prereqCerts');
  if (!certsEl) return;
  if (!prereq.certs || !prereq.certs.length) {
    certsEl.innerHTML = '<p style="color:var(--text-secondary)">No required prior certifications.</p>';
    return;
  }
  certsEl.innerHTML = prereq.certs.map(function(cid) {
    var c = CERTS.find(function(x) { return x.id === cid; });
    if (!c) return '<span class="role-chip">' + cid + '</span>';
    var color = dColorC(c.domains[0]||'vendor');
    return '<a href="certification.html?id=' + c.id + '" class="btn btn-ghost btn-sm" style="border-color:' + color + ';color:' + color + '">' + c.code + '</a>';
  }).join('');
}

function populateExam(cert) {
  var container = document.getElementById('examDetailsGrid');
  if (!container || !cert.examDetails) return;
  var e = cert.examDetails;
  var items = [
    { label:'Format',       val: e.format        || '?' },
    { label:'Questions',    val: e.questions || 'Practical' },
    { label:'Duration',     val: e.duration      || '?' },
    { label:'Passing Score',val: e.passingScore   || '?' },
    { label:'Cost',         val: '$' + (e.cost || '?') },
    { label:'Validity',     val: e.validity      || '?' },
    { label:'Renewal',      val: e.renewal       || '?' },
    { label:'Languages',    val: (e.languages||[]).join(', ') || '?' },
  ];
  container.innerHTML = items.map(function(item) {
    return '<div class="exam-stat-card">'
      + '<div class="exam-stat-label">' + item.label + '</div>'
      + '<div class="exam-stat-value">' + item.val + '</div>'
      + '</div>';
  }).join('');
}

function populateCareer(cert, accent) {
  var rolesEl = document.getElementById('careerRoles');
  if (rolesEl) {
    rolesEl.innerHTML = (cert.careerRoles||[]).map(function(r) {
      return '<span class="role-chip">' + r + '</span>';
    }).join('');
  }
  var salaryEl = document.getElementById('salaryDisplay');
  if (salaryEl) {
    salaryEl.innerHTML = '<div class="salary-amount" style="color:' + accent + '">' + (cert.salaryRange||'N/A') + '</div>'
      + '<p style="font-size:0.8rem;color:var(--text-secondary);margin-top:0.25rem">Approximate market range. Actual salary varies by location, employer, and experience.</p>';
  }
}

function populateResources(cert, accent) {
  var container = document.getElementById('resourcesList');
  if (!container || !cert.studyResources) return;
  container.innerHTML = cert.studyResources.map(function(r) {
    var isExternal = r.url && r.url !== '#';
    return '<div class="resource-card">'
      + '<div class="resource-type-badge">' + (r.type||'resource').toUpperCase() + '</div>'
      + '<div class="resource-title">' + r.title + '</div>'
      + (isExternal
        ? '<a href="' + r.url + '" class="btn btn-ghost btn-sm" target="_blank" rel="noopener">Visit Resource →</a>'
        : '<span class="btn btn-ghost btn-sm" style="opacity:0.4;cursor:default">Coming Soon</span>')
      + '</div>';
  }).join('');
}

function populateNext(cert) {
  var container = document.getElementById('nextCertsGrid');
  if (!container) return;
  var nextCerts = CERTS.filter(function(c) { return (cert.nextCerts||[]).includes(c.id); });
  if (!nextCerts.length) {
    container.innerHTML = '<p style="color:var(--text-secondary)">This is a top-level certification. Congratulations on reaching the peak!</p>';
    return;
  }
  container.innerHTML = nextCerts.map(function(c) {
    var color = dColorC(c.domains[0]||'vendor');
    return '<a href="certification.html?id=' + c.id + '" class="cert-card" style="--card-accent:' + color + ';text-decoration:none">'
      + '<div class="cert-card-header">'
      + '<span class="cert-code">' + c.code + '</span>'
      + '<span class="cert-issuer-badge" style="background:' + color + '22;color:' + color + ';border:1px solid ' + color + '44">' + (c.issuer||'').toUpperCase() + '</span>'
      + '</div>'
      + '<h3 class="cert-name">' + c.name + '</h3>'
      + '<span class="badge badge-level-' + c.level + '">' + lvlLabelC(c.level) + '</span>'
      + '</a>';
  }).join('');
}

document.addEventListener('DOMContentLoaded', function() {
  // Theme + nav from app.js (loaded before this script on certification.html)
  initCertPage();
});
