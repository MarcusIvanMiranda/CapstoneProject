// ========= historical_records.js =========
// Shorthand for document.querySelector and document.querySelectorAll.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

// Defines API endpoints for fetching cat details, owner details, and heartbeat records.
const API = {
  cat: (id) => fetch(`../API/CAT/display.php?id=${encodeURIComponent(id)}`).then(r => r.json()),
  owner: (id) => fetch(`../API/OWNER/display.php?id=${encodeURIComponent(id)}`).then(r => r.json()),
  records: (cat_id) => fetch(`../API/RECORD/display.php?cat_id=${encodeURIComponent(cat_id)}`).then(r => r.json()),
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

// --- UTILITY FUNCTIONS ---

// Formats an ISO date string into a long date format (e.g., 'October 17, 2025').
const fmtDate = (iso) => {
  const d = new Date(iso);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('en-US', options);
};

// Formats an ISO date string into a long date and time format (e.g., 'October 17, 2025 : 10:15 AM').
const fmtDateTime = (iso) => {
  const d = new Date(iso);
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
  const dateStr = d.toLocaleDateString('en-US', dateOptions);
  const timeStr = d.toLocaleTimeString('en-US', timeOptions);
  return `${dateStr} : ${timeStr}`;
};

// Generates initials from a name string (up to two words).
const initials = (name) => name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('');

// Calculates the age in years from a birthdate string (YYYY-MM-DD).
const ageFromBirthdate = (yyyy_mm_dd) => {
  const b = new Date(yyyy_mm_dd);
  if (Number.isNaN(b.getTime())) return '-';
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) years--;
  return `${years}y`;
};

// Extracts the cat ID from the URL query parameters.
const params = new URLSearchParams(location.search);
const CAT_ID = params.get('id');

/**
 * Fetches cat and owner details, then renders them in the information panel.
 * @returns {Object|null} The cat data object, or null on failure.
 */
async function getDetails() {
  if (!CAT_ID) {
    showToast({
      title: 'Missing cat id',
      type: 'error'
    });
    return;
  }

  const catRes = await API.cat(CAT_ID);
  if (!catRes.success) {
    showToast({
      title: 'Failed to load cat',
      message: catRes.message || '',
      type: 'error'
    });
    return;
  }
  const c = catRes.data;

  let ownerName = '—',
    ownerEmail = '—';
  if (c.owner_id) {
    const ownerRes = await API.owner(c.owner_id);
    if (ownerRes.success && ownerRes.data) {
      ownerName = ownerRes.data.name;
      ownerEmail = ownerRes.data.email;
    }
  }
  const infoPane = $('#infoPanel');
  let diseaseNote = '';
  if (c.disease) {
    if (c.disease.toLowerCase() === 'normal') {
      diseaseNote = `<div class="info-note"><b>Disease:</b> No Existing Disease</div>`;
    } else {
      diseaseNote = `<div class="info-note"><b>Disease:</b> ${c.disease}</div>`;
    }
  }

  infoPane.innerHTML = `
    <div class="cat-head">
      ${c.image ? `<img class="avatar" src="../${c.image}" alt="${c.name}">`
                : `<div class="initials">${initials(c.name)}</div>`}
      <div>
        <div class="info-name">${c.name}</div>
        <div class="badges">
          <span class="badge">🐾 ${c.breed}</span>
          <span class="badge">🎂 ${fmtDate(c.birthdate)} • ${ageFromBirthdate(c.birthdate)}</span>
          <span class="badge">🔌 ${c.device_name || '—'}</span>
          <span class="badge">❤️ ${c.normal_heartbeat || '—'} bpm</span>
          <span class="badge">📅 ${fmtDate(c.created_at)}</span>
        </div>
      </div>
    </div>
    <div class="info-row"><b>Owner:</b> ${ownerName}</div>
    <div class="info-row"><b>Contact:</b> ${ownerEmail}</div>
    ${diseaseNote}
  `;
  return c;
}

/**
 * Creates and returns an HTML element representing a single heartbeat record card.
 * It determines if the record is 'Normal' or 'Abnormal' based on the cat's normal heart rate.
 * @param {Object} record - The heartbeat record object.
 * @param {string} normal_heartbeat - The cat's normal BPM range (e.g., '140-220 bpm').
 * @returns {HTMLElement} The created record card element.
 */
function createRecordCard(record, normal_heartbeat) {
    const [minBPM, maxBPM] = normal_heartbeat.split('-').map(s => parseInt(s.trim()));
    const status = (record.heartbeat >= minBPM && record.heartbeat <= maxBPM) ? 'Normal' : 'Abnormal';
    
    const item = document.createElement('div');
    item.className = 'record-item';
    item.innerHTML = `
        <div class="time">${fmtDateTime(record.recorded_at)}</div>
        <div class="bpm">${record.heartbeat} BPM</div>
        <div class="status ${status.toLowerCase()}">${status}</div>
    `;
    return item;
}

/**
 * Fetches all historical heartbeat records for a cat, sorts them by date, and renders them in a list.
 * @param {number} cat_id - The ID of the cat.
 */
async function getRecords(cat_id) {
  const res = await API.records(cat_id);
  const catRes = await API.cat(cat_id);
  const normal_heartbeat = catRes.data.normal_heartbeat;
  const recordsList = $('#recordsList');
  recordsList.innerHTML = ''; 

  if (!res.success || res.data.length === 0) {
    recordsList.innerHTML = '<div style="text-align: center; color: #9ca3af; padding: 20px;">No records found.</div>';
    showToast({
      title: 'No records found',
      message: 'No heartbeat data available for this cat.',
      type: 'info'
    });
    return;
  }

  // Sort records from newest to oldest
  const records = res.data.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at)); 

  records.forEach(record => {
    recordsList.appendChild(createRecordCard(record, normal_heartbeat));
  });
}

// Immediately Invoked Function Expression (IIFE) to initialize the page by loading details and records.
(async function init() {
  const cat = await getDetails();
  if (cat) {
    getRecords(cat.id);
  }
})();