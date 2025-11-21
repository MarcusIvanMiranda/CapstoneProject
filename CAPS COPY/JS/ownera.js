// ===================================
// ownerssss.js - Single Owner/Cat Management
// ===================================

// --- Shorthands ---
// Shorthand for document.querySelector.
const $  = (s, r=document)=>r.querySelector(s);
// Shorthand for document.querySelectorAll and converting to an Array.
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

// --- API Endpoints ---
const API = {
  // Endpoint to fetch single owner details.
  owner: {
    show: (id)=> fetch(`../API/OWNER/display.php?id=${encodeURIComponent(id)}`).then(r=>r.json())
  },
  // Endpoints for Cat CRUD operations and listing by owner ID.
  cats: {
    list  : (owner_id)=> fetch(`../API/CAT/display.php?owner_id=${encodeURIComponent(owner_id)}`).then(r=>r.json()),
    show  : (id)=> fetch(`../API/CAT/display.php?id=${encodeURIComponent(id)}`).then(r=>r.json()),
    create: (fd)      => fetch(`../API/CAT/create.php`, {method:'POST', body:fd}).then(r=>r.json()),
    update: (fd)      => fetch(`../API/CAT/update.php`, {method:'POST', body:fd}).then(r=>r.json()),
    delete: (id)      => fetch(`../API/CAT/delete.php`, {method:'POST', body:new URLSearchParams({id})}).then(r=>r.json())
  }
};

// --- Toasts ---
const toastArea = $('#toastArea');

// Displays a temporary notification (toast) on the screen.
function showToast({ title='Success', message='', type='success', timeout=2600 } = {}){
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `
    <div class="row"><div class="title">${title}</div><button aria-label="Dismiss">✕</button></div>
    ${message ? `<div class="msg">${message}</div>` : '' }
  `;
  const close = () => { t.style.animation='toast-out .18s ease forwards'; setTimeout(()=>t.remove(),180) };
  t.querySelector('button').addEventListener('click', close);
  toastArea.appendChild(t);
  if (timeout) setTimeout(close, timeout);
}

// --- Confirm dialog ---
const confirmModal  = $('#confirmModal');
const confirmMsg    = $('#confirmMessage');
const confirmOk     = $('#confirmOk');
const confirmCancel = $('#confirmCancel');

// Shows a modal confirmation dialog and returns a Promise that resolves to true/false.
function askConfirm(message, {title='Please Confirm', okText='Yes, Continue', cancelText='Cancel'} = {}) {
  return new Promise(resolve=>{
    $('#confirmTitle').textContent=title;
    confirmMsg.textContent=message;
    confirmOk.textContent=okText;
    $('#confirmCancel').textContent=cancelText;
    const close=(v)=>{ confirmModal.classList.remove('open'); confirmOk.removeEventListener('click',onOk); confirmCancel.removeEventListener('click',onCancel); resolve(v); };
    const onOk=()=>close(true), onCancel=()=>close(false);
    confirmOk.addEventListener('click', onOk); confirmCancel.addEventListener('click', onCancel);
    confirmModal.classList.add('open');
  });
}

// --- State & elements ---
// Extracts the OWNER_ID from the URL query parameters.
const params = new URLSearchParams(location.search);
const OWNER_ID = params.get('id');

const ownerCard = $('#ownerCard');
const catsGrid  = $('#catsGrid');

const catModal = $('#catModal');
const catForm  = $('#catForm');
const catModalTitle = $('#catModalTitle');

// NEW: Sidebar elements
const sidebar     = $('aside.sidebar');
const menuBtn     = $('#menuBtn');
const closeSidebarBtn = $('#closeSidebar');

let editingCatId = null; // Stores the ID of the cat currently being edited.

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
const fmtDate = (iso) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
};
// Generates initials from a name string (up to two words).
const initials = (name) => name.split(' ').filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('');

/**
 * Calculates the age in years and months from a birthdate string (YYYY-MM-DD).
 * The difference is calculated relative to the current date.
 * @param {string} yyyy_mm_dd - The birthdate string.
 * @returns {string} The formatted age (e.g., "3 years 5 months" or "1 year").
 */
const ageFromBirthdate = (yyyy_mm_dd) => {
  const b = new Date(yyyy_mm_dd);
  if (Number.isNaN(b.getTime())) return 'N/A';
  
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  let months = now.getMonth() - b.getMonth();
  const days = now.getDate() - b.getDate();

  // Adjust months and years if the current date is before the birth date in the year/month.
  if (months < 0 || (months === 0 && days < 0)) {
    years--;
    months += 12; // Add 12 months to the negative result
  }
  
  // Final adjustment for the day of the month: if the current day is before the birth day,
  // we count the *previous* full month, and the remainder becomes part of the days calculation.
  if (days < 0) {
      months--;
      // If months becomes -1, it means the year needs to be decremented too (handled above),
      // and months should wrap to 11.
      if (months < 0) {
          months = 11;
          // Note: The years decrement is already accounted for above, so no need to do it again here.
      }
  }

  // Handle pluralization and formatting
  const yearStr = (years > 0) ? `${years} year${years > 1 ? 's' : ''}` : '';
  const monthStr = (months > 0) ? `${months} month${months > 1 ? 's' : ''}` : '';

  if (yearStr && monthStr) {
    return `${yearStr} ${monthStr}`;
  } else if (yearStr) {
    return yearStr;
  } else if (monthStr) {
    return monthStr;
  } else {
    // This case means the cat was born today or is less than a month old (and months=0).
    return 'Less than a month';
  }
};


// --- Load Owner Info ---
// Fetches and renders the details of the current owner.
async function loadOwner(){
  if (!OWNER_ID){ showToast({title:'Missing owner id', type:'error'}); return; }
  const res = await API.owner.show(OWNER_ID);
  if (!res.success){ showToast({title:'Load owner failed', message:res.message||'', type:'error'}); return; }
  const o = res.data;
  ownerCard.innerHTML = `
    ${o.image ? `<img class="avatar" src="../${o.image}" alt="${o.name}"/>` : `<div class="initials">${initials(o.name)}</div>`}
    <div style="flex:1">
      <h2>${o.name}</h2>
      <div>
        <span class="badge">📧 ${o.email}</span>
        <span class="badge">☎ ${o.phone}</span>
        <span class="badge">📍 ${o.address}</span>
        <span class="badge">📅 ${fmtDate(o.created_at)}</span>
      </div>
    </div>
  `;
}

// --- Render a cat card ---
// Generates the HTML article element for a single cat record.
function catCard(c){
  const hasImg = !!c.image;
  // Determine status display, defaulting to 'N/A'
  const status = c.current_status || 'N/A';
  const statusIcon = status.toLowerCase() === 'normal' ? '✅' : (status !== 'N/A' ? '⚠️' : '—'); // Use a warning icon for non-normal statuses
  
  const el = document.createElement('article');
  el.className = 'card';
  el.dataset.id = c.id;
  el.innerHTML = `
    <div>${hasImg
      ? `<img class="avatar" src="../${c.image}" alt="${c.name}">`
      : `<div class="initials">${initials(c.name)}</div>`}</div>
    <div style="flex:1">
      <h4>${c.name}</h4>
      <div class="row">🐾 ${c.breed} ${c.disease ? `(${c.disease.replace(/</g,'&lt;')})` : ''}</div>
      
      <div class="badge">🎂 ${fmtDate(c.birthdate)}</div>
      <div class="badge">⏳ ${ageFromBirthdate(c.birthdate)}</div>
      <div class="badge">🔌 ${c.device_name || '—'}</div>
      <div class="badge">❤️ ${c.normal_heartbeat || '—'} bpm</div>
      <div class="badge status-badge">${statusIcon} Status: ${status}</div>
      <div class="badge">📅 ${fmtDate(c.created_at)}</div>
      
    </div>
    <div class="kebab">
      <button class="icon-btn" data-kebab aria-label="Menu">⋯</button>
      <div class="menu">
        <button data-edit>Edit</button>
        <button data-delete>Delete</button>
      </div>
    </div>
  `;
  return el;
}

// --- Load Cats ---
// Fetches and renders all cats belonging to the current owner.
async function loadCats(){
  const res = await API.cats.list(OWNER_ID);
  if (!res.success){ showToast({title:'Load cats failed', message:res.message||'', type:'error'}); return; }
  catsGrid.innerHTML = '';
  res.data.forEach(c => catsGrid.appendChild(catCard(c)));
}

// --- Grid actions (kebab, edit, delete, navigate) ---
// Handles all click events within the catsGrid (menu toggle, edit, delete, and card navigation).
catsGrid.addEventListener('click', async (e)=>{
  const card = e.target.closest('.card'); if(!card) return;
  const menu = card.querySelector('.menu');

  // Toggle the kebab menu open/closed, closing others first.
  if (e.target.matches('[data-kebab]')) {
    $$('.menu', catsGrid).forEach(m => { if(m!==menu) m.classList.remove('open'); });
    menu.classList.toggle('open');
    return;
  }

  // Handle Edit cat action.
  if (e.target.matches('[data-edit]')) {
    menu.classList.remove('open');
    const id = card.dataset.id;
    const res = await API.cats.show(id);
    if (!res.success){ showToast({title:'Load cat failed', message:res.message||'', type:'error'}); return; }
    openCatModal(res.data);
    return;
  }

  // Handle Delete cat action with confirmation.
  if (e.target.matches('[data-delete]')) {
    menu.classList.remove('open');
    const id = card.dataset.id;
    const ok = await askConfirm('Delete this cat?', {title:'Delete Cat', okText:'Yes, delete'});
    if (!ok) return;
    const res = await API.cats.delete(id);
    if (!res.success){ showToast({title:'Delete failed', message:res.message||'', type:'error'}); return; }
    showToast({title:'Cat deleted', type:'success'});
    await loadCats();
    return;
  }

  // Navigate to Graph page when clicking the card body (not on menus/buttons).
  if (!e.target.closest('.kebab') && !e.target.closest('.menu')) {
    const id = card.dataset.id;
    window.location.href = `graph.html?id=${encodeURIComponent(id)}`;
  }
});

// --- Cat Modal open/close ---
// Event listener to open the modal for adding a new cat.
$('#addCat').addEventListener('click', ()=> openCatModal());
// Event listeners to close the cat modal.
$('#closeCatModal').addEventListener('click', closeCatModal);
$('#cancelCatModal').addEventListener('click', closeCatModal);

// Opens the cat modal, preparing it for a new cat or pre-filling for editing.
function openCatModal(cat=null){
  editingCatId = null;
  catForm.reset();
  if (cat){
    // Pre-fill form fields for editing.
    editingCatId = cat.id;
    $('#catId').value       = cat.id;
    $('#c_name').value      = cat.name;
    $('#c_breed').value     = cat.breed;
    $('#c_birthdate').value = cat.birthdate;
    $('#c_device').value    = cat.device_name || '';
    $('#c_disease').value   = cat.disease || '';
    $('#c_normal_heartbeat').value = cat.normal_heartbeat || '';
    catModalTitle.textContent = 'Edit Dog';
  } else {
    catModalTitle.textContent = 'Add Dog';
  }
  catModal.classList.add('open');
}
// Closes the cat modal.
function closeCatModal(){ catModal.classList.remove('open'); }

// --- Save Cat (create/update) ---
// Handles the submission of the cat form (creating or updating).
catForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(catForm);
  
  if (editingCatId){
    // Update existing cat.
    const res = await API.cats.update(fd);
    if(!res.success){ showToast({title:'Save failed', message:res.message||'', type:'error'}); return; }
    showToast({title:'Cat updated', type:'success'});
  } else {
    // Create new cat, ensuring owner_id is included.
    fd.append('owner_id', OWNER_ID);
    const res = await API.cats.create(fd);
    if(!res.success){ showToast({title:'Save failed', message:res.message||'', type:'error'}); return; }
    showToast({title:'Cat added', type:'success'});
  }
  
  closeCatModal();
  await loadCats(); // Refresh the list of cats.
});

// --- Global Click Listener ---
// Closes any open kebab menus when the user clicks anywhere outside of a menu button.
document.addEventListener('click', (e)=>{
  if (!e.target.closest('.kebab')) $$('.menu', catsGrid).forEach(m=>m.classList.remove('open'));
});

// --- Init ---
// Immediately Invoked Function Expression (IIFE) to initialize the page load sequence.
(async function init(){
  await loadOwner();
  await loadCats();
})();