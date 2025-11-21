// ===================================
// records.js - List All Cats for Historical Records
// ===================================

// Shorthand for document.querySelector.
const $  = (s, r=document)=>r.querySelector(s);
// Shorthand for document.querySelectorAll and converting to an Array.
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

// --- API Endpoints ---
const API = { 
  // Endpoint to fetch a list of all cats.
  cats: { 
    listAll: ()=> fetch(`../API/CAT/display.php`).then(r=>r.json()) 
  } 
};
const toastArea = $('#toastArea');

// Displays a temporary notification (toast) on the screen.
function showToast({ title='Notice', message='', type='info', timeout=2200 } = {}){
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<div class="row"><div class="title">${title}</div><button aria-label="Dismiss">✕</button></div>${message ? `<div class="msg">${message}</div>` : '' }`;
  const close = () => { t.style.animation='toast-out .18s ease forwards'; setTimeout(()=>t.remove(),180); };
  t.querySelector('button').addEventListener('click', close);
  toastArea.appendChild(t);
  if (timeout) setTimeout(close, timeout);
}

// --- State & elements (NEW) ---
const sidebar     = $('aside.sidebar');
const menuBtn     = $('#menuBtn');
const closeSidebarBtn = $('#closeSidebar');

// --- Sidebar Toggle Logic (NEW) ---
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

// --- Utils ---
// Formats an ISO date string into DD/MM/YYYY format.
const fmtDate=(iso)=>{ 
  const d=new Date(iso); 
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; 
};
// Generates initials from a name string (up to two words), defaulting to '?' if no name is provided.
const initials = (name) => name?.split(' ').filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('') || '?';

const catsGrid = $('#catsGrid');

// Creates and returns the HTML article element for a single cat card.
function catCard(c){
  const hasImg = !!c.image;
  const el = document.createElement('article');
  el.className = 'card';
  // Set click handler to navigate to the historical records page for this cat.
  el.onclick = () => { window.location.href = `historical_records.html?id=${c.id}`; };

  el.innerHTML = `
    <div>${hasImg
      ? `<img class="avatar" src="../${c.image}" alt="${c.name}">`
      : `<div class="initials">${initials(c.name)}</div>`}</div>
    <div style="flex:1">
      <h4>${c.name}</h4>
      <div class="row">🐾 ${c.breed || '—'}</div>
      <div class="badge">👤 ${c.owner_name || 'Unknown'}</div>
      <div class="badge">🎂 ${fmtDate(c.birthdate)}</div>
    </div>
  `;
  return el;
}

// Fetches all cats and renders them as clickable cards in the grid.
async function load(){
  const res = await API.cats.listAll();
  if(!res.success){ 
    showToast({title:'Failed to load', message:res.message||'', type:'error'}); 
    return; 
  }
  catsGrid.innerHTML = '';
  res.data.forEach(c => catsGrid.appendChild(catCard(c)));
}

// Initialize the data load upon script execution.
load();