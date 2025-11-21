// diagnostic_log.js (Simplified for Diagnostic History)

// Shorthand for document.querySelector and document.querySelectorAll.
const $  = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

// --- API ENDPOINTS ---
// Defines API endpoints for fetching cat details, and CRUD operations for diagnostic entries.
const API = { 
    cats: { 
        listAll: ()=> fetch(`../API/CAT/display.php`).then(r=>r.json()) 
    },
    diagnostics: {
        // Saves a new diagnostic entry to the database.
        save: (data)=> fetch(`../API/DIAGNOSTIC/create.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(r=>r.json()),
        // Fetches all diagnostic entries for a specific cat.
        list: (catId)=> fetch(`../API/DIAGNOSTIC/display.php?cat_id=${catId}`).then(r=>r.json()),
        // Updates an existing diagnostic entry.
        update: (data) => fetch(`../API/DIAGNOSTIC/update.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(r=>r.json()),
        // Deletes a specific diagnostic entry by ID.
        remove: (id) => fetch(`../API/DIAGNOSTIC/delete.php?id=${id}`).then(r=>r.json()),
    },
    // Heartbeat API endpoint is removed as it's for the graph page now
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

// --- Confirm dialog ---
const confirmModal  = $('#confirmModal');
const confirmMsg    = $('#confirmMessage');
const confirmOk     = $('#confirmOk');
const confirmCancel = $('#confirmCancel');

// Shows a custom confirmation dialog and returns a Promise that resolves to true or false.
function askConfirm(message, {title='Please Confirm', okText='Yes, Continue', cancelText='Cancel'} = {}) {
  return new Promise(resolve => {
    $('#confirmTitle').textContent = title;
    confirmMsg.textContent = message;
    confirmOk.textContent = okText;
    $('#confirmCancel').textContent = cancelText;
    const close = (val) => {
      confirmModal.classList.remove('open');
      confirmOk.removeEventListener('click', onOk);
      confirmCancel.removeEventListener('click', onCancel);
      resolve(val);
    };
    const onOk = () => close(true);
    const onCancel = () => close(false);
    confirmOk.addEventListener('click', onOk);
    confirmCancel.addEventListener('click', onCancel);
    confirmModal.classList.add('open');
  });
}
// --- END Confirm dialog ---

// Formats an ISO date string into DD/MM/YYYY format.
const fmtDate=(iso)=>{ const d=new Date(iso); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; };

// Generates initials from a name string (up to two words).
const initials = (name) => name?.split(' ').filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('') || '?';

// Helper to pad single-digit numbers with a leading zero.
const pad = (n) => String(n).padStart(2, '0');

// Formats a Date object into an ISO-like date string (YYYY-MM-DD).
const fmtIsoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;


// Removed all Heartbeat/Graph/Aggregation utility functions:
// fmtLogTimestamp, getAggregationKey, aggregateLogs, renderAverageTable, 
// renderHeartbeatList, renderHeartbeatGraph, renderHeartbeatLogs, loadCurrentLogs, 
// loadComparisonLogs, triggerAllLogLoad, and all related event listeners.

// Extracts the cat ID integer from the URL query parameters.
function getCatIdFromUrl(){
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id'));
}

let CURRENT_CAT_ID = null;
let CURRENT_CAT_NAME = null; 
// Removed CURRENT_NORMAL_HEARTBEAT

// --- MODAL HANDLING ---
const diagnosticModal = $('#diagnosticModal');
const createDiagnosticBtn = $('#createDiagnosticBtn');
const closeModalBtn = $('.close-btn', diagnosticModal);
const editModal = $('#editModal');
const editCloseModalBtn = $('.edit-close-btn', editModal);

// Displays the modal for creating a new diagnostic entry.
function showModal() {
    $('#modalCatId').textContent = CURRENT_CAT_NAME;
    // Set a default log_date for the new entry, although it's a hidden field
    const today = new Date();
    $('#diagnostic-date').value = fmtIsoDate(today);
    diagnosticModal.style.display = 'flex';
}

// Hides the new diagnostic entry modal and clears the input.
function hideModal() {
    diagnosticModal.style.display = 'none';
    $('#diagnosticText').value = ''; 
}

// Displays the modal for editing an existing diagnostic entry.
function showEditModal() {
    $('#editModalCatId').textContent = CURRENT_CAT_NAME; 
    editModal.style.display = 'flex';
}

// Hides the edit diagnostic entry modal and clears inputs.
function hideEditModal() {
    editModal.style.display = 'none';
    $('#editDiagnosticId').value = '';
    $('#editDiagnosticText').value = ''; 
}

// Global click handler to close modals and ellipsis menus when clicking outside.
window.onclick = function(event) {
  if (event.target === diagnosticModal || event.target === editModal || event.target === confirmModal) {
    hideModal();
    hideEditModal();
    if (event.target === confirmModal && confirmModal.classList.contains('open')) {
        confirmCancel.click();
    }
  }
  $$('.ellipsis-menu').forEach(menu => menu.classList.remove('active'));
}

// Attach listeners to open/close the main diagnostic creation modal.
createDiagnosticBtn.addEventListener('click', showModal);
closeModalBtn.addEventListener('click', hideModal);
editCloseModalBtn.addEventListener('click', hideEditModal);


// --- ELLIPSIS MENU TOGGLE ---

// Toggles the display of a specific ellipsis menu and hides all others.
function toggleEllipsisMenu(menuId, event) { 
    event.stopPropagation();
    const menu = $(`#${menuId}`);

    $$('.ellipsis-menu.active').forEach(otherMenu => {
        if (otherMenu.id !== menuId) {
            otherMenu.classList.remove('active');
        }
    });

    menu.classList.toggle('active');
}


// --- CRUD IMPLEMENTATIONS ---

// Handles the submission of the form to save a new diagnostic entry via API.
async function saveDiagnostic(e) {
    e.preventDefault();
    const diagnosticText = $('#diagnosticText').value.trim();
    const logDate = $('#diagnostic-date').value; // Hidden field, but should have a value

    if (!diagnosticText) {
        showToast({title:'Error', message:'Please enter diagnostic notes.', type:'warning'});
        return;
    }

    const payload = {
        cat_id: CURRENT_CAT_ID,
        diagnostic_text: diagnosticText,
        log_date: logDate 
    };

    const res = await API.diagnostics.save(payload);

    if (res.success) {
        showToast({title:'Success', message:'Diagnostic saved!', type:'success'});
        hideModal();
        loadDiagnostics(CURRENT_CAT_ID); 
    } else {
        showToast({title:'Save Failed', message:res.message || 'Error saving diagnostic.', type:'error', timeout: 4000});
    }
}
$('#diagnosticForm').addEventListener('submit', saveDiagnostic);


// Pre-fills and shows the edit modal with the data from the selected diagnostic entry.
function editDiagnostic(id, text, logDate, entryDate) { 
    $('#editDiagnosticId').value = id;
    $('#editDiagnosticText').value = text;
    $('#editModalCatId').textContent = CURRENT_CAT_NAME; 
    
    showEditModal();
    $('#editDiagnosticText').focus(); 
    
    $$('.ellipsis-menu').forEach(menu => menu.classList.remove('active'));
}

// Handles the submission of the form to update an existing diagnostic entry via API.
async function updateDiagnostic(e) {
    e.preventDefault();
    const id = $('#editDiagnosticId').value;
    const newText = $('#editDiagnosticText').value.trim();
    
    if (!id || !newText) {
        showToast({title:'Error', message:'Missing required data (ID or text) for update.', type:'warning'});
        return;
    }
    
    const payload = {
        id: id,
        diagnostic_text: newText,
        cat_id: CURRENT_CAT_ID 
    };

    const res = await API.diagnostics.update(payload);
    
    if (res.success) {
        showToast({title:'Success', message:res.message || `Entry ${id} updated!`, type:'success'});
        hideEditModal();
        loadDiagnostics(CURRENT_CAT_ID);
    } else {
        showToast({title:'Update Failed', message:res.message || `Error updating entry ${id}.`, type:'error', timeout: 4000});
    }
}
$('#editDiagnosticForm').addEventListener('submit', updateDiagnostic);


// Prompts for confirmation then deletes a diagnostic entry via API.
async function deleteDiagnostic(id) { 
    const ok = await askConfirm(
        `Are you sure you want to permanently delete Diagnostic Entry #${id}? This action cannot be undone.`,
        { title:'Delete Diagnostic Entry', okText:'Yes, Delete' }
    );
    
    if (!ok) {
        $$('.ellipsis-menu').forEach(menu => menu.classList.remove('active'));
        return;
    }

    const res = await API.diagnostics.remove(id);

    if (res.success) {
        showToast({title:'Success', message:res.message || `Entry ${id} deleted!`, type:'success'});
        loadDiagnostics(CURRENT_CAT_ID); 
    } else {
        showToast({title:'Delete Failed', message:res.message || `Error deleting entry ${id}.`, type:'error', timeout: 4000});
    }
    
    $$('.ellipsis-menu').forEach(menu => menu.classList.remove('active'));
}


// --- RENDER FUNCTION (DIAGNOSTICS) ---

// Creates and returns the HTML structure for a single diagnostic entry, including the edit/delete menu.
function renderDiagnostic(diag) {
    const entry = document.createElement('div');
    entry.className = 'diagnostic-entry';
    
    if (!diag.id) {
        console.error("Diagnostic entry is missing a required 'id' field.");
        return document.createElement('div');
    }

    const menuId = `menu-${diag.id}`;
    const displayLogDate = diag.log_date || 'N/A';

    entry.setAttribute('data-id', diag.id);
    entry.setAttribute('data-text', diag.diagnostic_text || '');
    entry.setAttribute('data-log-date', diag.log_date || '');

    entry.innerHTML = `
        <div style="display:flex; justify-content: flex-end; position:relative;">
            <button class="ellipsis-btn" data-action="toggle-menu" data-target="${menuId}">
                &#x22EE; 
            </button>
            <ul id="${menuId}" class="ellipsis-menu">
                <li>
                    <button data-action="edit">Edit</button>
                </li>
                <li>
                    <button data-action="delete">Delete</button>
                </li>
            </ul>
        </div>
        <div class="diagnostic-entry-content">${diag.diagnostic_text}</div>
        <div style="font-size: 0.8em; color: #aaa; margin-top: 10px;">
            <span style="font-weight: bold;">Log Date:</span> ${displayLogDate}
        </div>
    `;
    return entry;
}

// Fetches all diagnostic entries for the current cat and renders them in the list container.
async function loadDiagnostics(catId) {
    const listContainer = $('#diagnosticsList');
    listContainer.innerHTML = '<p>Fetching history...</p>';

    const res = await API.diagnostics.list(catId);

    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        listContainer.innerHTML = '';
        const sortedData = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        sortedData.forEach(diag => listContainer.appendChild(renderDiagnostic(diag)));
    } else if (res.success && res.data.length === 0) {
        listContainer.innerHTML = '<p>No diagnostic entries found for this cat.</p>';
    } else {
        showToast({title:'Load Failed', message:res.message || 'Failed to load diagnostic history.', type:'error', timeout: 5000});
        listContainer.innerHTML = `<p style="color: red;">Error loading history: ${res.message || 'Check PHP API status.'}</p>`;
    }
}


// --- EVENT DELEGATION LISTENER (DIAGNOSTICS) ---
const diagnosticsList = $('#diagnosticsList');

// Uses event delegation on the diagnostics list to handle click actions (toggle menu, edit, delete).
diagnosticsList.addEventListener('click', function(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    
    if (action === 'toggle-menu') {
        e.stopPropagation(); 
        const menuId = btn.dataset.target;
        toggleEllipsisMenu(menuId, e);
        return;
    }

    const entry = btn.closest('.diagnostic-entry');
    if (!entry) return;

    const id = parseInt(entry.dataset.id);
    const text = entry.dataset.text;
    const logDate = entry.dataset.logDate;
    const entryDate = entry.dataset.createdAt;

    if (action === 'edit') {
        editDiagnostic(id, text, logDate, entryDate);
    } else if (action === 'delete') {
        deleteDiagnostic(id);
    }
});


// --- INITIAL PAGE LOAD ---

// Renders the cat's avatar, name, and details on the page.
function renderCatDetails(cat){
    const avatarContainer = $('#cat-avatar-placeholder');
    const namePlaceholder = $('#cat-name-placeholder');
    const detailsPlaceholder = $('#cat-details-placeholder');

    if(cat.image){
        avatarContainer.className = 'cat-avatar-wrapper'; 
        avatarContainer.innerHTML = `<img class="avatar" src="../${cat.image}" alt="${cat.name}">`;
    } else {
        avatarContainer.className = 'initials';
        avatarContainer.textContent = initials(cat.name);
    }
    
    $('#catInfoContainer h2').textContent = cat.name || 'Unknown Cat'; 

    namePlaceholder.textContent = cat.name || 'Unknown Cat';
    detailsPlaceholder.innerHTML = `
        Breed: <b>${cat.breed || '—'}</b> | 
        Owner: <b>${cat.owner_name || 'Unknown'}</b> | 
        Reg. Date: <b>${fmtDate(cat.created_at)}</b>
    `;
    
    // Default log_date field for save payload (hidden on log.html)
    const today = new Date();
    $('#diagnostic-date').value = fmtIsoDate(today);
}

// Fetches the cat's data based on the URL ID, stores global variables, and triggers diagnostic loading.
async function loadCatData(){
    const catId = getCatIdFromUrl();
    CURRENT_CAT_ID = catId; 

    if(!catId){
        showToast({title:'Error', message:'No Cat ID provided in the URL.', type:'error', timeout: 5000});
        $('#cat-name-placeholder').textContent = 'Error: No ID';
        return;
    }

    const res = await API.cats.listAll();

    if(!res.success || !res.data || !Array.isArray(res.data)){
        showToast({title:'Failed to load', message:res.message || 'Could not retrieve cat list.', type:'error', timeout: 5000});
        $('#cat-name-placeholder').textContent = 'Error: List Failed to Load';
        return;
    }

    const cat = res.data.find(c => c.id === catId);

    if(!cat){
        showToast({title:'Not Found', message:`Cat with ID ${catId} not found in the list.`, type:'error', timeout: 5000});
        $('#cat-name-placeholder').textContent = `Error: Cat ID ${catId} Missing`;
        return;
    }

    CURRENT_CAT_NAME = cat.name;
    // Removed CURRENT_NORMAL_HEARTBEAT assignment

    renderCatDetails(cat);
    loadDiagnostics(catId);
}

// Starts the process of loading data when the page initializes.
loadCatData();