// CyberCerts - Certification Detail Page JS

const DOMAIN_COLORS = { 'blue-team':'#00ff41','red-team':'#ff3e3e','cloud':'#0080ff','grc':'#9d4edd','dfir':'#ff6b35','ai-security':'#00f5ff','ics-ot':'#ffd700','privacy':'#ff69b4','vendor':'#adb5bd','appsec':'#20c997','management':'#6c757d','threat-intel':'#fd7e14','malware':'#e83e8c' };
const LEVEL_COLORS = { 'beginner':'#00ff41','intermediate':'#ffd700','advanced':'#ff6b35','expert':'#ff3e3e','specialty':'#00f5ff' };

function levelLabel(l) { return l.charAt(0).toUpperCase()+l.slice(1); }
function domainLabel(d) { const m={'blue-team':'Blue Team','red-team':'Red Team','cloud':'Cloud','grc':'GRC','dfir':'DFIR','ai-security':'AI Security','ics-ot':'ICS/OT','privacy':'Privacy','appsec':'AppSec','management':'Management','threat-intel':'Threat Intel','malware':'Malware'}; return m[d]||d; }

function getProgress() { return JSON.parse(localStorage.getItem('certProgress')||'{}'); }
function setProgress(id, val) { const p=getProgress(); p[id]=val; localStorage.setItem('certProgress',JSON.stringify(p)); }

function initCertPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { document.getElementById('certContent').innerHTML='<p>No certification specified.</p>'; return; }
  
  const cert = CERTS.find(c=>c.id===id);
  if (!cert) { document.getElementById('certContent').innerHTML='<p>Certification not found.</p>'; return; }

  // Set breadcrumb
  const bc = document.getElementById('breadcrumb');
  if (bc) bc.innerHTML = `<a href="index.html">Home</a> / <a href="explore.html">Explore</a> / ${cert.code}`;

  // Set page title
  document.title = `${cert.name} | CyberCerts`;

  // Render header
  const header = document.getElementById('certHeader');
  const domain = cert.domains[0];
  const color = DOMAIN_COLORS[domain] || '#00f5ff';
  const lvlColor = LEVEL_COLORS[cert.level] || '#fff';
  const progress = getProgress();
  if (header) {
    header.innerHTML = `
      <div class="cert-detail-header" style="border-left:5px solid ${color}">
        <div class="cert-detail-meta">
          <div class="cert-detail-code">${cert.code}</div>
          ${cert.isAISecurity ? '<span class="ai-badge-lg">AI Security</span>' : ''}
        </div>
        <h1 class="cert-detail-title">${cert.name}</h1>
        <div class="cert-detail-issuer">${cert.issuer.toUpperCase()}</div>
        <div class="cert-detail-tags">
          ${cert.domains.map(d=>`<span class="tag" style="background:${DOMAIN_COLORS[d]}22;color:${DOMAIN_COLORS[d]};border:1px solid ${DOMAIN_COLORS[d]}44">${domainLabel(d)}</span>`).join('')}
          <span class="tag" style="color:${lvlColor}">${levelLabel(cert.level)}</span>
        </div>
        <div class="cert-detail-stats">
          <div class="stat"><div class="stat-val">$${cert.examDetails.cost}</div><div class="stat-lbl">Exam Cost</div></div>
          <div class="stat"><div class="stat-val">${cert.examDetails.questions||'Practical'}</div><div class="stat-lbl">Questions</div></div>
          <div class="stat"><div class="stat-val">${cert.examDetails.validity}</div><div class="stat-lbl">Validity</div></div>
          <div class="stat"><div class="stat-val">${cert.salaryRange.split('-')[0]}+</div><div class="stat-lbl">Salary Range</div></div>
        </div>
        <label class="progress-toggle">
          <input type="checkbox" id="progressCheck" ${progress[cert.id]?'checked':''} onchange="toggleCertProgress('${cert.id}',this.checked)">
          <span>Mark as completed</span>
        </label>
      </div>`;
  }

  window.toggleCertProgress = (id, val) => { setProgress(id, val); };

  // Render tabs
  renderTab('overview', cert, color);
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      renderTab(btn.dataset.tab, cert, color);
      document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
    });
  });
}

function renderTab(tab, cert, color) {
  const panel = document.getElementById('tab-'+tab);
  if (!panel || panel.dataset.rendered) return;
  panel.dataset.rendered = '1';

  if (tab === 'overview') {
    panel.innerHTML = `
      <div class="tab-grid">
        <div class="tab-section">
          <h3>Description</h3><p>${cert.description}</p>
          <h3>Who Is It For?</h3><p>${cert.whoIsItFor}</p>
          <h3>Why Get It?</h3><p>${cert.whyGetIt}</p>
        </div>
        <div class="tab-section">
          <h3>Key Skills</h3>
          ${cert.skills.map(s=>`<div class="skill-row"><span>${s.name}</span><div class="skill-bar"><div class="skill-fill" style="width:${s.pct}%;background:${color}"></div></div><span>${s.pct}%</span></div>`).join('')}
        </div>
      </div>`;
  }
  else if (tab === 'exam') {
    const e = cert.examDetails;
    panel.innerHTML = `
      <div class="exam-grid">
        ${[
          ['Format',e.format],['Questions',e.questions||'Practical'],['Duration',e.duration],
          ['Passing Score',e.passingScore],['Cost','$'+e.cost],['Validity',e.validity],
          ['Renewal',e.renewal],['Languages',e.languages.join(', ')]
        ].map(([k,v])=>`<div class="exam-card"><div class="exam-label">${k}</div><div class="exam-val">${v}</div></div>`).join('')}
      </div>`;
  }
  else if (tab === 'career') {
    panel.innerHTML = `
      <div class="tab-section">
        <h3>Career Roles</h3>
        <div class="role-list">${cert.careerRoles.map(r=>`<span class="role-chip">${r}</span>`).join('')}</div>
        <h3>Salary Range</h3>
        <div class="salary-display" style="color:${color}">${cert.salaryRange}</div>
      </div>`;
  }
  else if (tab === 'prerequisites') {
    const prevCerts = CERTS.filter(c=>cert.prevCerts.includes(c.id));
    panel.innerHTML = `
      <div class="tab-section">
        <h3>Experience Required</h3><p>${cert.prerequisites.experience}</p>
        ${prevCerts.length ? `<h3>Recommended Prior Certifications</h3><div class="prev-certs">${prevCerts.map(c=>`<a href="certification.html?id=${c.id}" class="cert-chip" style="border-color:${DOMAIN_COLORS[c.domains[0]]}">${c.code}</a>`).join('')}</div>` : ''}
      </div>`;
  }
  else if (tab === 'pathway') {
    const nextCerts = CERTS.filter(c=>cert.nextCerts.includes(c.id));
    panel.innerHTML = `
      <div class="tab-section">
        <h3>What Comes Next</h3>
        ${nextCerts.length ? `<div class="next-certs">${nextCerts.map(c=>`<a href="certification.html?id=${c.id}" class="cert-card-sm">
          <div class="cert-sm-code" style="color:${DOMAIN_COLORS[c.domains[0]]}">${c.code}</div>
          <div class="cert-sm-name">${c.name}</div>
          <div class="cert-sm-level" style="color:${LEVEL_COLORS[c.level]}">${levelLabel(c.level)}</div>
        </a>`).join('')}</div>` : '<p>This is a top-level certification in its path.</p>'}
        <div class="view-pathway-cta">
          <a href="pathway.html?domain=${cert.domains[0]}" class="btn btn-primary">View Full Pathway →</a>
        </div>
      </div>`;
  }
  else if (tab === 'resources') {
    panel.innerHTML = `
      <div class="resources-grid">
        ${cert.studyResources.map(r=>`<div class="resource-card">
          <div class="resource-type">${r.type.toUpperCase()}</div>
          <div class="resource-title">${r.title}</div>
          <a href="${r.url}" class="btn btn-sm btn-outline" ${r.url==='#'?'onclick="return false"':''}>View Resource</a>
        </div>`).join('')}
      </div>`;
  }
  else if (tab === 'salary') {
    panel.innerHTML = `
      <div class="tab-section">
        <h3>Compensation Overview</h3>
        <div class="salary-range-display">
          <div class="salary-bar-container">
            <div class="salary-bar" style="background:${color}22;border:1px solid ${color}44">
              <div class="salary-fill" style="background:${color};width:80%"></div>
            </div>
          </div>
          <div class="salary-numbers">${cert.salaryRange}</div>
        </div>
        <h3>Roles Using This Certification</h3>
        <div class="role-list">${cert.careerRoles.map(r=>`<span class="role-chip">${r}</span>`).join('')}</div>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initCertPage();
  // Init theme toggle
  const saved = localStorage.getItem('theme');
  if (saved === 'light') document.body.classList.add('light-mode');
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    });
  });
  // Hamburger
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => menu.classList.toggle('open'));
  }
});
