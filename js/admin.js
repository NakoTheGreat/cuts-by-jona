/* ============================================================
   CUTS BY JONA — admin.js
   Password gate · Dashboard · Messages · Search · Export CSV
   ============================================================ */

const PASS_KEY  = 'cbj_admin_auth';
const MSGS_KEY  = 'cbj_messages';
const PASS_HASH = 'jonasadmin'; // change this to update password

document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem(PASS_KEY) === '1') {
    showPanel();
  } else {
    showLogin();
  }
});

/* ── Login ──────────────────────────────────────────────── */
function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-panel').style.display  = 'none';

  const form  = document.getElementById('login-form');
  const error = document.getElementById('login-error');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const pw = form.elements['password'].value;
    if (pw === PASS_HASH) {
      sessionStorage.setItem(PASS_KEY, '1');
      showPanel();
    } else {
      error.style.display = 'block';
      form.elements['password'].value = '';
      form.elements['password'].focus();
      setTimeout(() => error.style.display = 'none', 3000);
    }
  });
}

/* ── Panel ──────────────────────────────────────────────── */
function showPanel() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-panel').style.display  = 'block';

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem(PASS_KEY);
    location.reload();
  });

  renderDashboard();
  renderMessages();

  document.getElementById('search-input')?.addEventListener('input', renderMessages);
  document.getElementById('filter-select')?.addEventListener('change', renderMessages);
  document.getElementById('export-btn')?.addEventListener('click', exportCSV);
}

/* ── Dashboard stats ────────────────────────────────────── */
function renderDashboard() {
  const msgs = getMessages();
  const now  = new Date();
  const weekAgo = new Date(now - 7 * 24 * 3600 * 1000);

  const total   = msgs.length;
  const unread  = msgs.filter(m => !m.read).length;
  const thisWeek = msgs.filter(m => new Date(m.timestamp) > weekAgo).length;

  // Most mentioned service (scan messages for keywords)
  const svcKeywords = {
    'Haircut & Beard': ['beard','haircut and beard','cut with beard'],
    'Haircut':         ['haircut','hair cut','cut'],
    'Kids 12+':        ['kids','child','son','daughter','young','12']
  };
  const counts = { 'Haircut & Beard': 0, 'Haircut': 0, 'Kids 12+': 0 };
  msgs.forEach(m => {
    const txt = (m.message + ' ' + m.name).toLowerCase();
    Object.entries(svcKeywords).forEach(([svc, words]) => {
      words.forEach(w => { if (txt.includes(w)) counts[svc]++; });
    });
  });
  const topSvc = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  set('stat-total',    total);
  set('stat-unread',   unread);
  set('stat-week',     thisWeek);
  set('stat-top-svc',  topSvc[1] > 0 ? topSvc[0] : '—');

  function set(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
}

/* ── Messages table ─────────────────────────────────────── */
function getMessages() {
  return JSON.parse(localStorage.getItem(MSGS_KEY) || '[]');
}
function saveMessages(msgs) {
  localStorage.setItem(MSGS_KEY, JSON.stringify(msgs));
}

function renderMessages() {
  const query  = (document.getElementById('search-input')?.value || '').toLowerCase();
  const filter = document.getElementById('filter-select')?.value || 'all';
  let msgs = getMessages();

  if (query) msgs = msgs.filter(m =>
    m.name.toLowerCase().includes(query) || m.email.toLowerCase().includes(query)
  );
  if (filter === 'unread') msgs = msgs.filter(m => !m.read);
  if (filter === 'read')   msgs = msgs.filter(m => m.read);

  const tbody = document.getElementById('messages-tbody');
  if (!tbody) return;

  if (msgs.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted);">
        No messages found.
      </td></tr>`;
    return;
  }

  tbody.innerHTML = msgs.map(m => {
    const d = new Date(m.timestamp);
    const date = d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' });
    return `
      <tr class="${m.read ? '' : 'unread'}" data-id="${m.id}">
        <td><strong>${esc(m.name)}</strong></td>
        <td>${esc(m.email)}</td>
        <td class="msg-cell">${esc(m.message)}</td>
        <td style="white-space:nowrap;color:var(--text-muted);font-size:12px;">${date}<br>${time}</td>
        <td>
          <div class="row-actions">
            <button class="action-btn read-btn" data-id="${m.id}">
              ${m.read ? '<i class="fa fa-envelope-open"></i> Read' : '<i class="fa fa-envelope"></i> Unread'}
            </button>
            <button class="action-btn del-btn" data-id="${m.id}">
              <i class="fa fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('.read-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleRead(+btn.dataset.id));
  });
  tbody.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteMsg(+btn.dataset.id));
  });
}

function toggleRead(id) {
  const msgs = getMessages().map(m => m.id === id ? { ...m, read: !m.read } : m);
  saveMessages(msgs);
  renderDashboard();
  renderMessages();
}

function deleteMsg(id) {
  if (!confirm('Delete this message?')) return;
  saveMessages(getMessages().filter(m => m.id !== id));
  renderDashboard();
  renderMessages();
}

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

/* ── Export CSV ─────────────────────────────────────────── */
function exportCSV() {
  const msgs = getMessages();
  if (!msgs.length) return alert('No messages to export.');
  const header = ['ID','Name','Email','Message','Date','Read'];
  const rows = msgs.map(m => [
    m.id,
    `"${m.name.replace(/"/g,'""')}"`,
    `"${m.email.replace(/"/g,'""')}"`,
    `"${m.message.replace(/"/g,'""')}"`,
    new Date(m.timestamp).toLocaleString(),
    m.read ? 'Yes' : 'No'
  ].join(','));
  const csv  = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `cbj-messages-${Date.now()}.csv`;
  a.click(); URL.revokeObjectURL(url);
}
