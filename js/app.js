// CyberCerts - Main Application JS

// Theme toggle
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') document.body.classList.add('light-mode');
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    });
  });
}

// Hamburger nav
function initNav() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('navMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => menu.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!toggle.contains(e.target) && !menu.contains(e.target)) menu.classList.remove('open');
    });
  }
}

// Scroll reveal
function initScrollReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// Particles
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  for (let i = 0; i < 80; i++) {
    particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5, r: Math.random()*2+1, alpha: Math.random()*0.5+0.1 });
  }
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x<0) p.x=canvas.width; if (p.x>canvas.width) p.x=0;
      if (p.y<0) p.y=canvas.height; if (p.y>canvas.height) p.y=0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(0,245,255,${p.alpha})`;
      ctx.fill();
    });
    // Draw lines between close particles
    for (let i=0; i<particles.length; i++) {
      for (let j=i+1; j<particles.length; j++) {
        const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<100) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,245,255,${0.1*(1-dist/100)})`;
          ctx.lineWidth=0.5;
          ctx.moveTo(particles[i].x,particles[i].y);
          ctx.lineTo(particles[j].x,particles[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// Domain color map
const DOMAIN_COLORS = {
  'blue-team': '#00ff41', 'red-team': '#ff3e3e', 'cloud': '#0080ff',
  'grc': '#9d4edd', 'dfir': '#ff6b35', 'ai-security': '#00f5ff',
  'ics-ot': '#ffd700', 'privacy': '#ff69b4', 'vendor': '#adb5bd',
  'appsec': '#20c997', 'management': '#6c757d', 'threat-intel': '#fd7e14',
  'malware': '#e83e8c'
};

const LEVEL_COLORS = {
  'beginner': '#00ff41', 'intermediate': '#ffd700', 'advanced': '#ff6b35',
  'expert': '#ff3e3e', 'specialty': '#00f5ff'
};

function domainLabel(d) {
  const map = { 'blue-team':'Blue Team','red-team':'Red Team','cloud':'Cloud','grc':'GRC','dfir':'DFIR',
    'ai-security':'AI Security','ics-ot':'ICS/OT','privacy':'Privacy','appsec':'AppSec',
    'management':'Management','threat-intel':'Threat Intel','malware':'Malware','vendor':'Vendor' };
  return map[d] || d;
}

function levelLabel(l) {
  return l.charAt(0).toUpperCase()+l.slice(1);
}

function certCard(cert) {
  const domain = cert.domains[0];
  const color = DOMAIN_COLORS[domain] || '#00f5ff';
  const lvlColor = LEVEL_COLORS[cert.level] || '#fff';
  const aiTag = cert.isAISecurity ? '<span class="ai-badge">AI</span>' : '';
  return `<div class="cert-card reveal" data-id="${cert.id}" onclick="location.href='certification.html?id=${cert.id}'">
    <div class="cert-card-header" style="border-left:4px solid ${color}">
      <div class="cert-code">${cert.code}</div>
      <div class="cert-issuer">${cert.issuer.toUpperCase()}${aiTag}</div>
    </div>
    <div class="cert-card-body">
      <h3 class="cert-name">${cert.name}</h3>
      <div class="cert-tags">
        ${cert.domains.map(d=>`<span class="tag" style="background:${DOMAIN_COLORS[d]}22;color:${DOMAIN_COLORS[d]};border:1px solid ${DOMAIN_COLORS[d]}44">${domainLabel(d)}</span>`).join('')}
        <span class="tag level-tag" style="color:${lvlColor}">${levelLabel(cert.level)}</span>
      </div>
      <p class="cert-desc">${cert.description.substring(0,120)}...</p>
      <div class="cert-salary">${cert.salaryRange}</div>
    </div>
  </div>`;
}

// ============ INDEX PAGE ============
function initIndexPage() {
  if (!document.getElementById('pathwayGrid')) return;

  // Finder logic
  const steps = { goal: null, experience: null, domain: null };
  document.querySelectorAll('.finder-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = btn.dataset.step;
      const val = btn.dataset.value;
      steps[step] = val;
      btn.closest('.finder-step').querySelectorAll('.finder-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Show next step
      const next = btn.closest('.finder-step').nextElementSibling;
      if (next) next.classList.add('active');
      // If all filled, show results
      if (steps.goal && steps.experience && steps.domain) {
        showFinderResults(steps);
      }
    });
  });

  // Pathway cards
  renderPathwayCards();
}

function showFinderResults(steps) {
  const results = document.getElementById('finderResults');
  if (!results) return;
  let filtered = CERTS;
  if (steps.domain && steps.domain !== 'any') filtered = filtered.filter(c => c.domains.includes(steps.domain));
  if (steps.experience === 'none') filtered = filtered.filter(c => c.level === 'beginner');
  else if (steps.experience === 'some') filtered = filtered.filter(c => ['beginner','intermediate'].includes(c.level));
  if (steps.goal === 'job') filtered = filtered.sort((a,b) => b.careerRoles.length - a.careerRoles.length);
  const top = filtered.slice(0, 3);
  results.innerHTML = `<h3 class="finder-results-title">Recommended for You</h3><div class="finder-results-grid">${top.map(certCard).join('')}</div>`;
  results.classList.add('visible');
  initScrollReveal();
}

function renderPathwayCards() {
  const grid = document.getElementById('pathwayGrid');
  if (!grid) return;
  const pathways = [
    { id:'blue-team', name:'Blue Team / SOC', icon:'🛡️', desc:'Defend networks, analyze threats, and respond to incidents.', color:'#00ff41', count: CERTS.filter(c=>c.domains.includes('blue-team')).length },
    { id:'red-team', name:'Red Team / Pentesting', icon:'⚔️', desc:'Ethical hacking, exploit development, and offensive operations.', color:'#ff3e3e', count: CERTS.filter(c=>c.domains.includes('red-team')).length },
    { id:'cloud', name:'Cloud Security', icon:'☁️', desc:'Secure cloud infrastructure across AWS, Azure, and GCP.', color:'#0080ff', count: CERTS.filter(c=>c.domains.includes('cloud')).length },
    { id:'grc', name:'GRC & Compliance', icon:'📋', desc:'Risk management, governance, and regulatory compliance.', color:'#9d4edd', count: CERTS.filter(c=>c.domains.includes('grc')).length },
    { id:'dfir', name:'Digital Forensics & IR', icon:'🔍', desc:'Investigate incidents and analyze digital evidence.', color:'#ff6b35', count: CERTS.filter(c=>c.domains.includes('dfir')).length },
    { id:'ai-security', name:'AI Security', icon:'🤖', desc:'Secure AI systems and defend against AI-powered attacks.', color:'#00f5ff', count: CERTS.filter(c=>c.domains.includes('ai-security')).length },
    { id:'ics-ot', name:'ICS/OT Security', icon:'🏭', desc:'Protect industrial control systems and critical infrastructure.', color:'#ffd700', count: CERTS.filter(c=>c.domains.includes('ics-ot')).length },
    { id:'privacy', name:'Privacy', icon:'🔒', desc:'Data privacy laws, GDPR compliance, and privacy engineering.', color:'#ff69b4', count: CERTS.filter(c=>c.domains.includes('privacy')).length },
    { id:'appsec', name:'Application Security', icon:'💻', desc:'Secure software development and web application security.', color:'#20c997', count: CERTS.filter(c=>c.domains.includes('appsec')).length },
  ];
  grid.innerHTML = pathways.map(p => `
    <a href="pathway.html?domain=${p.id}" class="pathway-card reveal" style="--card-color:${p.color}">
      <div class="pathway-icon">${p.icon}</div>
      <h3 class="pathway-name">${p.name}</h3>
      <p class="pathway-desc">${p.desc}</p>
      <div class="pathway-count">${p.count} certifications</div>
    </a>`).join('');
  initScrollReveal();
}

// ============ EXPLORE PAGE ============
function initExplorePage() {
  const grid = document.getElementById('certsGrid');
  if (!grid) return;

  let filtered = [...CERTS];
  let compareList = [];

  function render() {
    grid.innerHTML = filtered.length ? filtered.map(certCard).join('') : '<p class="no-results">No certifications match your filters.</p>';
    initScrollReveal();
  }

  function applyFilters() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const issuer = document.getElementById('issuerFilter').value;
    const level = document.getElementById('levelFilter').value;
    const domain = document.getElementById('domainFilter').value;
    filtered = CERTS.filter(c => {
      if (search && !c.name.toLowerCase().includes(search) && !c.code.toLowerCase().includes(search) && !c.issuer.toLowerCase().includes(search)) return false;
      if (issuer && c.issuer !== issuer) return false;
      if (level && c.level !== level) return false;
      if (domain && !c.domains.includes(domain)) return false;
      return true;
    });
    document.getElementById('certCount').textContent = `${filtered.length} certifications`;
    render();
  }

  ['searchInput','issuerFilter','levelFilter','domainFilter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', applyFilters);
  });

  // Populate issuer filter
  const issuers = [...new Set(CERTS.map(c=>c.issuer))].sort();
  const issuerSel = document.getElementById('issuerFilter');
  if (issuerSel) {
    issuers.forEach(i => { const o=document.createElement('option'); o.value=i; o.textContent=i.toUpperCase(); issuerSel.appendChild(o); });
  }

  // Compare functionality
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-compare]');
    if (btn) {
      e.stopPropagation();
      const id = btn.dataset.compare;
      const cert = CERTS.find(c=>c.id===id);
      if (!cert) return;
      if (compareList.find(c=>c.id===id)) {
        compareList = compareList.filter(c=>c.id!==id);
      } else if (compareList.length < 3) {
        compareList.push(cert);
      }
      updateCompareBar(compareList);
    }
  });

  function updateCompareBar(list) {
    const bar = document.getElementById('compareBar');
    if (!bar) return;
    if (list.length === 0) { bar.classList.remove('visible'); return; }
    bar.classList.add('visible');
    bar.querySelector('.compare-items').innerHTML = list.map(c=>`<span class="compare-chip">${c.code} <button onclick="removeCompare('${c.id}')">×</button></span>`).join('');
  }

  window.removeCompare = id => {
    compareList = compareList.filter(c=>c.id!==id);
    updateCompareBar(compareList);
  };

  window.openCompare = () => {
    if (compareList.length < 2) return;
    const modal = document.getElementById('compareModal');
    if (!modal) return;
    const fields = [
      {label:'Level', fn: c=>levelLabel(c.level)},
      {label:'Issuer', fn: c=>c.issuer.toUpperCase()},
      {label:'Cost', fn: c=>'$'+c.examDetails.cost},
      {label:'Questions', fn: c=>c.examDetails.questions||'Practical'},
      {label:'Duration', fn: c=>c.examDetails.duration},
      {label:'Salary Range', fn: c=>c.salaryRange},
      {label:'Validity', fn: c=>c.examDetails.validity},
    ];
    modal.querySelector('.compare-table').innerHTML = `
      <table>
        <thead><tr><th>Feature</th>${compareList.map(c=>`<th>${c.code}</th>`).join('')}</tr></thead>
        <tbody>${fields.map(f=>`<tr><td>${f.label}</td>${compareList.map(c=>`<td>${f.fn(c)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>`;
    modal.classList.add('open');
  };

  window.closeCompare = () => { document.getElementById('compareModal').classList.remove('open'); };

  document.getElementById('certCount').textContent = `${CERTS.length} certifications`;
  render();
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
  initScrollReveal();
  initParticles();
  initIndexPage();
  initExplorePage();
});
