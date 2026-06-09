// CyberCerts - Pathway Builder JS

const PATHWAYS = {
  'blue-team': { name:'Blue Team / SOC', color:'#00ff41', icon:'🛡️',
    levels:['beginner','intermediate','advanced','expert'],
    desc:'Start with Security+ or CompTIA CySA+ and build toward CISSP or GCIA.' },
  'red-team': { name:'Red Team / Pentesting', color:'#ff3e3e', icon:'⚔️',
    levels:['beginner','intermediate','advanced','expert'],
    desc:'Begin with eJPT or CEH, advance through OSCP to GXPN or OSCE3.' },
  'cloud': { name:'Cloud Security', color:'#0080ff', icon:'☁️',
    levels:['beginner','intermediate','advanced'],
    desc:'CCSK and cloud provider fundamentals lead to CCSP and specialty certs.' },
  'grc': { name:'GRC & Compliance', color:'#9d4edd', icon:'📋',
    levels:['beginner','intermediate','advanced','expert'],
    desc:'CompTIA Security+ to CISM to CISSP, with CISA for audit focus.' },
  'dfir': { name:'Digital Forensics & IR', color:'#ff6b35', icon:'🔍',
    levels:['intermediate','advanced','expert'],
    desc:'GCIH and GCFE build the foundation; GCFA and GREM for specialization.' },
  'ai-security': { name:'AI Security', color:'#00f5ff', icon:'🤖',
    levels:['beginner','intermediate','advanced','expert'],
    desc:'Start with AIGP or Security AI+, advance to CAISP or GAISA.' },
  'ics-ot': { name:'ICS/OT Security', color:'#ffd700', icon:'🏭',
    levels:['intermediate','advanced'],
    desc:'ISA/IEC 62443 and GICSP form the foundation; GRID for advanced incident response.' },
  'privacy': { name:'Privacy', color:'#ff69b4', icon:'🔒',
    levels:['intermediate','advanced'],
    desc:'CIPP/US or CIPP/E, then CIPM for management or CIPT for technical roles.' },
  'appsec': { name:'Application Security', color:'#20c997', icon:'💻',
    levels:['beginner','intermediate','advanced'],
    desc:'GWEB and eWPT are solid starts; advance to OSWE, GWAPT, or bug bounty certs.' },
  'threat-intel': { name:'Threat Intelligence', color:'#fd7e14', icon:'🕵️',
    levels:['intermediate','advanced'],
    desc:'GCTI and eCTHP for structured threat intelligence careers.' },
};

function initPathwayPage() {
  const wizard = document.getElementById('wizard');
  if (!wizard) return;

  // Check URL for domain
  const params = new URLSearchParams(window.location.search);
  const domainParam = params.get('domain');

  // Render domain cards
  const domainGrid = document.getElementById('domainGrid');
  if (domainGrid) {
    domainGrid.innerHTML = Object.entries(PATHWAYS).map(([id,p]) => {
      const certCount = CERTS.filter(c=>c.domains.includes(id)).length;
      return `<div class="domain-select-card" data-domain="${id}" style="--card-color:${p.color}">
        <div class="dscard-icon">${p.icon}</div>
        <div class="dscard-name">${p.name}</div>
        <div class="dscard-count">${certCount} certs</div>
      </div>`;
    }).join('');

    domainGrid.addEventListener('click', e => {
      const card = e.target.closest('.domain-select-card');
      if (!card) return;
      domainGrid.querySelectorAll('.domain-select-card').forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
      selectedDomain = card.dataset.domain;
      document.getElementById('nextStep1').disabled = false;
    });

    if (domainParam && PATHWAYS[domainParam]) {
      setTimeout(() => {
        const card = domainGrid.querySelector(`[data-domain="${domainParam}"]`);
        if (card) { card.click(); goToStep(2); }
      }, 100);
    }
  }

  let selectedDomain = domainParam || null;
  let selectedLevel = null;

  // Step navigation
  window.goToStep = (step) => {
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`wizardStep${step}`).classList.add('active');
    if (step === 2 && selectedDomain) renderLevelSelector(selectedDomain);
    if (step === 3 && selectedDomain && selectedLevel) renderPathwayGraph(selectedDomain, selectedLevel);
  };

  document.getElementById('nextStep1').addEventListener('click', () => {
    if (selectedDomain) goToStep(2);
  });

  // Level selector
  function renderLevelSelector(domain) {
    const container = document.getElementById('levelGrid');
    if (!container) return;
    const pathway = PATHWAYS[domain];
    const levels = ['beginner','intermediate','advanced','expert'];
    const domainCerts = CERTS.filter(c=>c.domains.includes(domain));
    container.innerHTML = levels.map(lvl => {
      const count = domainCerts.filter(c=>c.level===lvl).length;
      if (count === 0) return '';
      const active = count > 0 ? '' : 'disabled';
      return `<div class="level-select-card ${active}" data-level="${lvl}" style="--card-color:${LEVEL_COLORS[lvl]}">
        <div class="lscard-name">${levelLabel(lvl)}</div>
        <div class="lscard-desc">${getLevelDesc(lvl)}</div>
        <div class="lscard-count">${count} certs available</div>
      </div>`;
    }).join('');

    container.addEventListener('click', e => {
      const card = e.target.closest('.level-select-card:not(.disabled)');
      if (!card) return;
      container.querySelectorAll('.level-select-card').forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
      selectedLevel = card.dataset.level;
      document.getElementById('nextStep2').disabled = false;
    });
  }

  document.getElementById('nextStep2').addEventListener('click', () => {
    if (selectedLevel) goToStep(3);
  });

  function getLevelDesc(lvl) {
    const map = { beginner:'0-1 years experience', intermediate:'1-3 years experience', advanced:'3-5 years experience', expert:'5+ years experience' };
    return map[lvl] || '';
  }

  // Load progress
  function getProgress() {
    return JSON.parse(localStorage.getItem('certProgress') || '{}');
  }
  function toggleProgress(id) {
    const p = getProgress();
    p[id] = !p[id];
    localStorage.setItem('certProgress', JSON.stringify(p));
  }

  // Pathway graph
  function renderPathwayGraph(domain, startLevel) {
    const container = document.getElementById('pathwayGraph');
    if (!container) return;
    const domainCerts = CERTS.filter(c=>c.domains.includes(domain));
    const progress = getProgress();
    const levels = ['beginner','intermediate','advanced','expert'];
    const startIdx = levels.indexOf(startLevel);
    const visibleLevels = levels.slice(startIdx);

    let html = '<div class="pathway-levels">';
    visibleLevels.forEach(lvl => {
      const lvlCerts = domainCerts.filter(c=>c.level===lvl);
      if (lvlCerts.length === 0) return;
      html += `<div class="pathway-level">
        <div class="level-header" style="color:${LEVEL_COLORS[lvl]}">${levelLabel(lvl)}</div>
        <div class="pathway-nodes">
          ${lvlCerts.map(c => {
            const done = progress[c.id];
            const aiTag = c.isAISecurity ? '<span class="ai-badge-sm">AI</span>' : '';
            return `<div class="pathway-node ${done?'completed':''}" data-id="${c.id}"
              style="--node-color:${DOMAIN_COLORS[c.domains[0]||domain]}"
              onclick="showCertPanel('${c.id}')">
              <div class="node-code">${c.code}${aiTag}</div>
              <div class="node-name">${c.name.length>30?c.name.substring(0,30)+'…':c.name}</div>
              <button class="node-check" onclick="event.stopPropagation();toggleNodeProgress('${c.id}')" title="${done?'Mark incomplete':'Mark complete'}">
                ${done?'✓':'○'}
              </button>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    });
    html += '</div>';

    // Summary bar
    const total = domainCerts.length;
    const done = domainCerts.filter(c=>progress[c.id]).length;
    html += `<div class="pathway-summary">
      <div class="progress-bar"><div class="progress-fill" style="width:${total?Math.round(done/total*100):0}%"></div></div>
      <div class="progress-text">${done}/${total} completed (${total?Math.round(done/total*100):0}%)</div>
      <button class="btn btn-outline" onclick="exportProgress()">Export Progress</button>
    </div>`;

    container.innerHTML = html;

    window.toggleNodeProgress = (id) => {
      toggleProgress(id);
      renderPathwayGraph(domain, startLevel);
    };

    window.showCertPanel = (id) => {
      const cert = CERTS.find(c=>c.id===id);
      if (!cert) return;
      const panel = document.getElementById('certSidePanel');
      if (!panel) return;
      panel.innerHTML = `
        <button class="panel-close" onclick="document.getElementById('certSidePanel').classList.remove('open')">×</button>
        <div class="panel-code">${cert.code}</div>
        <h3 class="panel-name">${cert.name}</h3>
        <div class="panel-issuer">${cert.issuer.toUpperCase()}</div>
        <p class="panel-desc">${cert.description}</p>
        <div class="panel-meta">
          <div><strong>Level:</strong> ${levelLabel(cert.level)}</div>
          <div><strong>Cost:</strong> $${cert.examDetails.cost}</div>
          <div><strong>Salary:</strong> ${cert.salaryRange}</div>
          <div><strong>Validity:</strong> ${cert.examDetails.validity}</div>
        </div>
        <div class="panel-skills">${cert.skills.map(s=>`<div class="skill-bar-row"><span>${s.name}</span><div class="skill-bar"><div style="width:${s.pct}%;background:${DOMAIN_COLORS[cert.domains[0]]}"></div></div></div>`).join('')}</div>
        <a href="certification.html?id=${cert.id}" class="btn btn-primary" style="width:100%;margin-top:1rem">View Full Details →</a>`;
      panel.classList.add('open');
    };
  }

  window.exportProgress = () => {
    const p = getProgress();
    const completed = CERTS.filter(c=>p[c.id]).map(c=>c.name);
    const text = `CyberCerts Progress Export\n${new Date().toLocaleDateString()}\n\nCompleted (${completed.length}):\n${completed.map(n=>'  ✓ '+n).join('\n')}`;
    const blob = new Blob([text],{type:'text/plain'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='cybercerts-progress.txt'; a.click();
  };
}

const LEVEL_COLORS = { 'beginner':'#00ff41','intermediate':'#ffd700','advanced':'#ff6b35','expert':'#ff3e3e','specialty':'#00f5ff' };
const DOMAIN_COLORS = { 'blue-team':'#00ff41','red-team':'#ff3e3e','cloud':'#0080ff','grc':'#9d4edd','dfir':'#ff6b35','ai-security':'#00f5ff','ics-ot':'#ffd700','privacy':'#ff69b4','vendor':'#adb5bd','appsec':'#20c997','management':'#6c757d','threat-intel':'#fd7e14','malware':'#e83e8c' };

function levelLabel(l) { return l.charAt(0).toUpperCase()+l.slice(1); }
function domainLabel(d) { const m={'blue-team':'Blue Team','red-team':'Red Team','cloud':'Cloud','grc':'GRC','dfir':'DFIR','ai-security':'AI Security','ics-ot':'ICS/OT','privacy':'Privacy','appsec':'AppSec','management':'Management','threat-intel':'Threat Intel','malware':'Malware','vendor':'Vendor'}; return m[d]||d; }

document.addEventListener('DOMContentLoaded', () => {
  initPathwayPage();
});
