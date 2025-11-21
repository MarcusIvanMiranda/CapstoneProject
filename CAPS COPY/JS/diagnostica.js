// diagnostics.js

// Shorthand for document.querySelector and document.querySelectorAll.
const $  = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

// Defines API endpoints for fetching the list of all cats.
const API = { cats: { listAll: ()=> fetch(`../API/CAT/display.php`).then(r=>r.json()) } };

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

// Formats an ISO date string into DD/MM/YYYY format.
const fmtDate=(iso)=>{ const d=new Date(iso); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; };

// Generates initials from a name string (up to two words).
const initials = (name) => name?.split(' ').filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('') || '?';

const catsGrid = $('#catsGrid');
const selectionModal = $('#selectionModal');
const modalCatName = $('#modalCatName');
const closeSelectionModal = $('#closeSelectionModal');
const goToLogBtn = $('#goToLogBtn');
const goToGraphBtn = $('#goToGraphBtn');
// NEW: Get the new button element
const goToAnalysisBtn = $('#goToAnalysisBtn'); 

// --- Sidebar Toggle Logic (NEW) ---
const sidebar = $('#sidebar');
const menuBtn = $('#menuBtn');
const closeSidebarBtn = $('#closeSidebar');

// Opens the sidebar (for mobile view).
menuBtn.addEventListener('click', () => {
    sidebar.classList.add('open');
});
// Closes the sidebar (for mobile view).
closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('open');
});
// ----------------------------------

let selectedCatId = null;

// Hides the selection modal.
function hideSelectionModal() {
    selectionModal.style.display = 'none';
}

// Opens the selection modal, setting the cat's details and updating button links.
function showSelectionModal(catId, catName) {
    selectedCatId = catId;
    modalCatName.textContent = `Select Action for ${catName}`;
    goToLogBtn.onclick = () => { window.location.href = `diagnostic_log.html?id=${selectedCatId}`; };
    goToGraphBtn.onclick = () => { window.location.href = `diagnostic_graph.html?id=${selectedCatId}`; };
    // NEW: Add click handler for the Analysis button
    goToAnalysisBtn.onclick = () => { window.location.href = `diagnostic_analysis.html?id=${selectedCatId}`; };
    selectionModal.style.display = 'flex'; // This activates the centering CSS
}

// Creates and returns an HTML div element (card) for a cat.
function catCard(c){
  const hasImg = !!c.image;
  // Change from <a> to <div> and add a data attribute for the ID
  const el = document.createElement('div'); 
  el.className = 'card';
  el.setAttribute('data-cat-id', c.id); // Store ID on the element
  el.setAttribute('data-cat-name', c.name); // Store name on the element
  el.innerHTML = `
    <div>${hasImg
      ? `<img class="avatar" src="../${c.image}" alt="${c.name}">`
      : `<div class="initials">${initials(c.name)}</div>`}</div>
    <div style="flex:1">
      <h4>${c.name}</h4>
      <div class="row">🐾 ${c.breed || '—'}</div>
      <div class="badge">👤 ${c.owner_name || 'Unknown'}</div>
      <div class="badge">📅 ${fmtDate(c.created_at)}</div>
    </div>
  `;
  return el;
}

// Fetches all cat data from the API and renders a card for each cat in the grid.
async function load(){
  const res = await API.cats.listAll();
  if(!res.success){ showToast({title:'Failed to load', message:res.message||'', type:'error'}); return; }
  catsGrid.innerHTML = '';
  res.data.forEach(c => catsGrid.appendChild(catCard(c)));
}

// Event delegation to handle card clicks
catsGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card) {
        const catId = parseInt(card.dataset.catId);
        const catName = card.dataset.catName;
        showSelectionModal(catId, catName);
    }
});

// Close modal listeners
closeSelectionModal.addEventListener('click', hideSelectionModal);

window.onclick = function(event) {
    if (event.target === selectionModal) {
        hideSelectionModal();
    }
}

// Initiates the loading and rendering of cat data upon script execution.
load();