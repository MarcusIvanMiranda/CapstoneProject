// alertss.js
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

// Defines API endpoints for fetching cat and record data.
const API = {
  cats: {
    listAll: () => fetch(`../API/CAT/display.php`).then(r => r.json())
  },
  records: {
    list: (cat_id) => fetch(`../API/RECORD/display.php?cat_id=${encodeURIComponent(cat_id)}`).then(r => r.json())
  }
};

const toastArea = $('#toastArea');

// Displays a temporary notification (toast) on the screen.
function showToast({
  title = 'Notice',
  message = '',
  type = 'info',
  timeout = 2200
} = {}) {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `
    <div class="row"><div class="title">${title}</div><button aria-label="Dismiss">✕</button></div>
    ${message ? `<div class="msg">${message}</div>` : ''}
  `;
  const close = () => {
    t.style.animation = 'toast-out .18s ease forwards';
    setTimeout(() => t.remove(), 180);
  };
  t.querySelector('button').addEventListener('click', close);
  toastArea.appendChild(t);
  if (timeout) setTimeout(close, timeout);
}

// Formats an ISO date string into DD/MM/YYYY format.
const fmtDate = (iso) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

// Generates initials from a name string (up to two words).
const initials = (name) => name?.split(' ').filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('') || '?';

const catsGrid = $('#catsGrid');
const navAlertIcon = $('#navAlertIcon');

// --- Sidebar Toggle Logic (NEW) ---
const sidebar     = $('aside.sidebar');
const menuBtn     = $('#menuBtn');
const closeSidebarBtn = $('#closeSidebar');

// Opens the sidebar (for mobile view).
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
    });
}
// Closes the sidebar (for mobile view).
if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });
}
// --- End Sidebar Toggle Logic ---

// Creates and returns an HTML article element (card) for a cat.
function catCard(c, isAbnormal = false) {
  const hasImg = !!c.image;
  // Determine status display
  const status = c.current_status || 'N/A';
  const statusIcon = status !== 'N/A' ? '✅' : '—';
  
  const el = document.createElement('article');
  el.className = 'card';
  el.dataset.id = c.id;
  el.innerHTML = `
    <div>${hasImg
      ? `<img class="avatar" src="../${c.image}" alt="${c.name}">`
      : `<div class="initials">${initials(c.name)}</div>`}</div>
    <div style="flex:1">
      <h4>${c.name}</h4>
      <div class="row">🐾 ${c.breed || '—'}</div>
      <div class="badge">👤 ${c.owner_name || 'Unknown'}</div>
      <div class="badge status-badge">${statusIcon} Status: ${status}</div>
      <div class="badge">📅 ${fmtDate(c.created_at)}</div>
      <div class="badge ${isAbnormal ? 'heartbeat-alert' : ''}">
        ❤️
        ${isAbnormal ? '<span class="abnormal-icon">⚠️</span>' : ''}
      </div>
    </div>
  `;
  return el;
}

// Fetches all cat data, checks the most recent heartbeat against the normal range, and renders the cards.
async function load() {
  const allCatsRes = await API.cats.listAll();
  if (!allCatsRes.success) {
    showToast({
      title: 'Failed to load',
      message: allCatsRes.message || '',
      type: 'error'
    });
    return;
  }
  catsGrid.innerHTML = '';
  let hasAbnormal = false;
  for (const cat of allCatsRes.data) {
    let isAbnormal = false;
    if (cat.normal_heartbeat) {
      const catRecordsRes = await API.records.list(cat.id);
      if (catRecordsRes.success && catRecordsRes.data.length > 0) {
        // The last record in the array is the most recent record
        const mostRecentRecord = catRecordsRes.data[catRecordsRes.data.length - 1]; 
        const [minBPM, maxBPM] = cat.normal_heartbeat.split('-').map(s => parseInt(s.trim()));
        const currentBPM = parseInt(mostRecentRecord.heartbeat);
        if ((!isNaN(minBPM) && currentBPM < minBPM) || (!isNaN(maxBPM) && currentBPM > maxBPM)) {
          isAbnormal = true;
          hasAbnormal = true;
        }
      }
    }
    catsGrid.appendChild(catCard(cat, isAbnormal));
  }
  if (hasAbnormal) {
    navAlertIcon.style.display = 'inline-block';
    // Fix: Ensure the icon content is set.
    navAlertIcon.textContent = '⚠️';
  } else {
    navAlertIcon.style.display = 'none';
  }
}

// Initiates the loading and rendering of cat data upon script execution.
load();

// Adds an event listener to navigate to the graph page when a cat card is clicked.
catsGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  const id = card.dataset.id;
  window.location.href = `graph.html?id=${encodeURIComponent(id)}`;
});