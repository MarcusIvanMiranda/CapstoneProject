// diagnostic_graph.js (Dedicated to Heartbeat Graph and Comparison)

// Shorthand for document.querySelector and document.querySelectorAll.
const $  = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));

// --- API ENDPOINTS ---
const API = { 
    cats: { 
        listAll: ()=> fetch(`../API/CAT/display.php`).then(r=>r.json()) 
    },
    // Heartbeat API endpoint for the graph and comparison data.
    heartbeat: {
        list: (catId, startDate, timeUnit)=> fetch(`../API/RECORD/display.php?cat_id=${catId}&start_date=${startDate}&time_unit=${timeUnit}`).then(r=>r.json()),
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

// --- Confirm dialog (Kept for consistency, though less likely needed here) ---
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
      confirmModal.style.display = 'none';
      confirmOk.removeEventListener('click', onOk);
      confirmCancel.removeEventListener('click', onCancel);
      resolve(val);
    };
    const onOk = () => close(true);
    const onCancel = () => close(false);
    confirmOk.addEventListener('click', onOk);
    confirmCancel.addEventListener('click', onCancel);
    confirmModal.style.display = 'flex';
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

/**
 * Formats a given ISO timestamp string for display based on a time unit and view mode.
 */
function fmtLogTimestamp(iso, timeUnit, isCondensed = false) {
    const d = new Date(iso);
    const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const monthDayPart = `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
    const yearPart = `${d.getFullYear()}`;

    if (isCondensed) {
        if (timeUnit === 'day') return d.getHours() + ':00'; // Only show the hour for X-axis labels on 'day' view
        return monthDayPart; // Show month/day for week/month/year
    }
    
    switch (timeUnit) {
        case 'day':
            return timePart;
        case 'week':
        case 'month':
            return `${monthDayPart} ${timePart}`;
        case 'year':
            return `${monthDayPart}/${yearPart} ${timePart}`;
        default:
            return `${monthDayPart}/${yearPart} ${timePart}`; 
    }
}

/**
 * Gets a key string for log aggregation based on the time unit.
 */
function getAggregationKey(date, timeUnit, anchorDate) {
    const start = new Date(anchorDate);
    start.setHours(0, 0, 0, 0);

    switch (timeUnit) {
        case 'day':
            return pad(date.getHours()); 
        case 'week': {
            const diffTime = date.getTime() - start.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            // Key must be non-negative and based on day difference from anchor date.
            // Using Math.max to prevent negative day keys if the log is slightly before the start date.
            return pad(Math.max(0, diffDays)); 
        }
        case 'month': {
            const weekNumber = Math.ceil(date.getDate() / 7);
            return weekNumber.toString();
        }
        case 'year':
            return pad(date.getMonth() + 1);
        default:
            return 'Other';
    }
}


/**
 * Calculates the average heartbeat for each time interval within the logs.
 */
function aggregateLogs(logs, timeUnit, anchorDate) {
    const groups = {};

    logs.forEach(log => {
        const date = new Date(log.recorded_at);
        const key = getAggregationKey(date, timeUnit, anchorDate);
        const heartbeat = log.heartbeat;

        if (!groups[key]) {
            groups[key] = { sum: 0, count: 0 };
        }
        groups[key].sum += heartbeat;
        groups[key].count += 1;
    });

    // Convert to array and sort by key
    return Object.keys(groups).sort().map(key => ({
        key: key,
        average: groups[key].count > 0 ? parseFloat((groups[key].sum / groups[key].count).toFixed(1)) : 0
    }));
}


/**
 * Renders the aggregated average heartbeat data as an HTML table for display.
 */
function renderAverageTable(averages, timeUnit) {
    const container = document.createElement('div');
    container.className = 'average-table-container';
    container.style.marginTop = '20px';
    container.style.borderTop = '1px solid var(--border)';
    container.style.paddingTop = '10px';
    
    let keyLabel;
    let keyDisplayFunc;
    
    switch (timeUnit) {
        case 'day': 
            keyLabel = 'Hour'; 
            keyDisplayFunc = (key) => `${parseInt(key)}:00`; 
            break;
        case 'week': 
            keyLabel = 'Day'; 
            keyDisplayFunc = (key) => { 
                // key is 0-indexed difference in days from the anchor date (Day 0 = Day 1)
                return `Day ${parseInt(key) + 1}`;
            };
            break;
        case 'month': 
            keyLabel = 'Week'; 
            keyDisplayFunc = (key) => `Week ${key}`;
            break;
        case 'year': 
            keyLabel = 'Month'; 
            keyDisplayFunc = (key) => {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return months[parseInt(key) - 1]; 
            };
            break;
        default: 
            keyLabel = 'Period';
            keyDisplayFunc = (key) => key;
    }

    container.innerHTML = `
        <h5 style="margin-top: 5px; margin-bottom: 10px; font-weight: bold; color: var(--text);">Average Heartbeats by ${keyLabel}</h5>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
            <thead style="background-color: var(--panel);">
                <tr>
                    <th style="padding: 8px; text-align: left; border: 1px solid var(--border); color: var(--text);">${keyLabel}</th>
                    <th style="padding: 8px; text-align: left; border: 1px solid var(--border); color: var(--text);">Avg. BPM</th>
                </tr>
            </thead>
            <tbody id="avg-table-body">
            </tbody>
        </table>
    `;
    
    const tbody = container.querySelector('#avg-table-body');

    if (averages.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="padding: 8px; text-align: center; color: var(--muted); border: 1px solid var(--border);">No data to calculate averages.</td></tr>`;
    } else {
        averages.forEach(avg => {
            const row = tbody.insertRow();
            row.style.backgroundColor = 'transparent';
            row.innerHTML = `
                <td style="padding: 8px; border: 1px solid var(--border);">${keyDisplayFunc(avg.key)}</td>
                <td style="padding: 8px; font-weight: bold; border: 1px solid var(--border); color: var(--brand);">${avg.average}</td>
            `;
        });
    }

    return container;
}

// Extracts the cat ID integer from the URL query parameters.
function getCatIdFromUrl(){
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('id'));
}

let CURRENT_CAT_ID = null;
let CURRENT_CAT_NAME = null; 
let CURRENT_NORMAL_HEARTBEAT = null; 


/**
 * Renders the aggregated average heartbeat data as an SVG line graph, following the screenshot style.
 * **The Normal Range Band has been removed as requested by the user.**
 * @param {Array<{key: string, average: number}>} averages - Aggregated average heartbeats.
 * @param {number|null} minBpm - Minimum normal BPM for range visualization.
 * @param {number|null} maxBpm - Maximum normal BPM for range visualization.
 * @param {string} timeUnit - 'day', 'week', 'month', or 'year'.
 */
function renderHeartbeatGraph(averages, minBpm, maxBpm, timeUnit) {
    const container = document.createElement('div');
    container.className = 'line-chart-container';
    
    if (averages.length === 0) return container;
    
    const svgWidth = 550; 
    const svgHeight = 250; 
    // Increased padding to account for Y-axis labels and X-axis labels
    const padding = { top: 15, right: 10, bottom: 40, left: 45 }; 
    const innerWidth = svgWidth - padding.left - padding.right;
    const innerHeight = svgHeight - padding.top - padding.bottom;

    const allBPMs = averages.map(d => d.average);
    
    // Determine the max value for the Y-axis scale (add buffer for high readings)
    const maxVal = Math.max(...allBPMs, maxBpm || 0) * 1.15; 
    const minVal = 0; // Always start at 0 BPM
    
    // Scaling functions
    const scaleY = (value) => innerHeight - (value - minVal) / (maxVal - minVal) * innerHeight;
    // Fix: Handle single data point to prevent division by zero and center the point
    const scaleX = (index) => {
        if (averages.length === 1) {
            return innerWidth / 2;
        }
        return index / (averages.length - 1) * innerWidth;
    }
    
    let points = "";
    // Build the line path string
    averages.forEach((d, i) => {
        const x = scaleX(i) + padding.left;
        const y = scaleY(d.average) + padding.top;
        points += `${x},${y} `;
    });

    // Helper function to format X-axis labels (must match table logic)
    let keyDisplayFunc;
    switch (timeUnit) {
        case 'day': 
            keyDisplayFunc = (key) => `${parseInt(key)}:00`;
            break;
        case 'week': 
            keyDisplayFunc = (key) => {
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                // Since key is 0-indexed day difference from anchor date
                // We'll use the day index to find the day of the week, assuming the anchor date's day of the week is known or the index is what matters.
                // For simplicity and consistency with the table, we'll use a 0-indexed day of the week based on the key.
                return days[parseInt(key) % 7];
            };
            break;
        case 'month': 
            keyDisplayFunc = (key) => `Wk ${key}`;
            break;
        case 'year': 
            keyDisplayFunc = (key) => {
                const months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
                return months[parseInt(key) - 1];
            };
            break;
        default: 
            keyDisplayFunc = (key) => key;
    }
    
    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.classList.add('heartbeat-svg');

    let svgContent = '';

    // NOTE: Normal Range Band drawing section has been removed as requested.

    // 2. Draw Y-Axis Grid Lines & Labels
    const yTicks = [minVal, Math.round(maxVal / 2), Math.round(maxVal)].filter((v, i, a) => a.indexOf(v) === i);
    yTicks.forEach((tick) => {
        const y = scaleY(tick) + padding.top;
        // Grid Line
        svgContent += `<line x1="${padding.left}" y1="${y}" x2="${svgWidth - padding.right}" y2="${y}" class="grid-line" />`;
        // Label
        svgContent += `<text x="${padding.left - 5}" y="${y + 3}" class="y-axis-label">${tick}</text>`;
    });

    // 3. Draw the Line
    svgContent += `<polyline class="data-line" fill="none" points="${points}" />`;

    // 4. Draw Data Points (Circles) and add tooltips
    averages.forEach((d, i) => {
        const x = scaleX(i) + padding.left;
        const y = scaleY(d.average) + padding.top;
        
        let colorClass = 'normal';
        if (minBpm !== null && maxBpm !== null) {
             if (d.average < minBpm) colorClass = 'low';
             else if (d.average > maxBpm) colorClass = 'high';
        }
        
        const keyText = keyDisplayFunc(d.key);

        svgContent += `
        <g class="data-point-group">
            <circle cx="${x}" cy="${y}" r="4" class="data-point ${colorClass}" data-bpm="${d.average}" data-time="${keyText}"/>
            <text x="${x}" y="${y - 8}" class="data-point-label" text-anchor="middle" visibility="hidden" fill="var(--text)">${d.average}</text>
        </g>`;
    });

    // 5. Draw X-Axis Labels (Keys)
    const labelIndices = [];
    const step = Math.ceil(averages.length / 8); // Max 8 labels
    for (let i = 0; i < averages.length; i += step) {
        labelIndices.push(i);
    }
    
    averages.forEach((d, i) => {
        if (!labelIndices.includes(i) && averages.length > 8) return; // Skip drawing intermediate labels if too many points

        const x = scaleX(i) + padding.left;
        const labelText = keyDisplayFunc(d.key);
        // X-Axis Label
        svgContent += `<text x="${x}" y="${svgHeight - padding.bottom + 15}" class="x-axis-label">${labelText}</text>`;
        
        // Vertical Grid Line for Label
        svgContent += `<line x1="${x}" y1="${padding.top}" x2="${x}" y2="${svgHeight - padding.bottom}" class="grid-line x-axis-grid" />`;
    });
    
    svg.innerHTML = svgContent;
    container.appendChild(svg);
    
    // Add interactivity (Tooltip display)
    const pointGroups = container.querySelectorAll('.data-point-group');
    pointGroups.forEach(group => {
        const circle = group.querySelector('.data-point');
        const label = group.querySelector('.data-point-label');
        
        group.addEventListener('mouseenter', () => {
            label.setAttribute('visibility', 'visible');
            circle.setAttribute('r', '6'); // Increase radius on hover
        });
        group.addEventListener('mouseleave', () => {
            label.setAttribute('visibility', 'hidden');
            circle.setAttribute('r', '4');
        });
    });
    
    return container;
}


// --- HELPER: Renders the heartbeat logs as a simple bulleted list. ---
function renderHeartbeatList(logs, minBpm, maxBpm, timeUnit) {
    const ul = document.createElement('ul');
    ul.className = 'log-list log-list-scrollable'; // ADDED CLASS for fixed height and hidden scrollbar
    ul.style.listStyle = 'none';
    ul.style.padding = '0';
    
    logs.forEach(log => {
        const li = document.createElement('li');
        let color = 'var(--text)'; 
        
        if (minBpm !== null && maxBpm !== null) {
            if (log.heartbeat < minBpm) {
                color = 'var(--brand)'; 
            } else if (log.heartbeat > maxBpm) {
                color = 'var(--red)'; 
            } else {
                color = 'lightgreen'; 
            }
        }
        
        const formattedTime = fmtLogTimestamp(log.recorded_at, timeUnit, false);
        
        li.innerHTML = `
            <span style="font-weight: bold; color: ${color};">${log.heartbeat} BPM</span> 
            <span style="font-size: 0.8em; color: var(--muted);">at ${formattedTime}</span>
        `;
        ul.appendChild(li);
    });

    return ul;
}


// --- HEARTBEAT LOGIC (Unchanged) ---

/**
 * Function to render heartbeat data, possible diseases, and average table into their respective containers.
 */
function renderHeartbeatLogs(logContainerElement, diseaseContainerElement, logs, anchorDate, timeUnit) {
    
    // Ensure the container is clean before adding content
    logContainerElement.innerHTML = '';
    
    const dateDisplay = `Displaying logs for <b>${anchorDate}</b> using a <b>${timeUnit}</b> range.`;
    
    const logContentDiv = document.createElement('div');
    logContentDiv.innerHTML = `
        <div style="font-size: 0.9em; color: var(--muted); margin-bottom: 10px;">
            ${dateDisplay}
            <br>Normal Range: <b style="color: lightgreen;">${CURRENT_NORMAL_HEARTBEAT || 'N/A'} BPM</b>
        </div>
    `;
    
    diseaseContainerElement.innerHTML = '';
    
    const [minBpm, maxBpm] = CURRENT_NORMAL_HEARTBEAT ? CURRENT_NORMAL_HEARTBEAT.split(' - ').map(n => parseInt(n.trim())) : [null, null];
    const uniqueDiseases = new Set();
    
    if (logs && logs.length > 0) {
        logs.forEach(log => {
            if (log.possible_diseases) {
                log.possible_diseases.split(',').map(d => d.trim()).filter(d => d).forEach(disease => uniqueDiseases.add(disease));
            }
        });
    }
    
    const averages = aggregateLogs(logs, timeUnit, anchorDate); 

    if (!logs || logs.length === 0) {
        logContentDiv.innerHTML += '<p style="color: var(--muted);">No heartbeat records found for this period.</p>';
        diseaseContainerElement.innerHTML = '<p style="color: var(--muted);">No records to check for diseases.</p>';
    } else {
        const viewMode = $('#view-mode-select').value;
        let visualizationElement;
        
        if (viewMode === 'graph') {
            // Remove scrollable class from parent for graph view
            logContainerElement.classList.remove('log-list-scrollable'); 
            visualizationElement = renderHeartbeatGraph(averages, minBpm, maxBpm, timeUnit); 
        } else {
            // Add scrollable class to parent for list view to define height/scrolling
            // NOTE: The scrollable class is now applied to the UL element inside renderHeartbeatList, 
            // but we ensure the parent is clear of it just in case.
            logContainerElement.classList.remove('log-list-scrollable'); 
            visualizationElement = renderHeartbeatList(logs, minBpm, maxBpm, timeUnit); 
        }
        
        logContentDiv.appendChild(visualizationElement);
        
        // Render the list of possible diseases
        if (uniqueDiseases.size > 0) {
            const diseaseUl = document.createElement('ul');
            diseaseUl.style.listStyle = 'disc';
            diseaseUl.style.marginLeft = '20px';
            diseaseUl.style.color = 'var(--text)';
            uniqueDiseases.forEach(disease => {
                const diseaseLi = document.createElement('li');
                diseaseLi.textContent = disease;
                diseaseUl.appendChild(diseaseLi);
            });
            diseaseContainerElement.appendChild(diseaseUl);
        } else {
            diseaseContainerElement.innerHTML = '<p style="color: var(--muted);">No specific diseases flagged in the logs for this period.</p>';
        }
        
        // Render average heartbeats table
        logContentDiv.appendChild(renderAverageTable(averages, timeUnit));
    }
    
    logContainerElement.appendChild(logContentDiv);
}

/**
 * Loads heartbeat logs for the Current Log container and renders them.
 */
async function loadCurrentLogs() {
    if (!CURRENT_CAT_ID) return;
    const currentLogContainer = $('#current-log-container'); 
    const currentDiseaseContainer = $('#current-diseases-container'); 
    
    const logAnchorDate = $('#diagnostic-date').value;
    const timeUnit = $('#time-range-select').value;
    const timeUnitDisplay = timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1);
    
    $('#log-header-text').textContent = `Current Log (${timeUnitDisplay})`;
    
    currentLogContainer.innerHTML = `<p style="color: var(--muted);">Loading heartbeat logs...</p>`;
    currentDiseaseContainer.innerHTML = `<p style="color: var(--muted);">Loading possible diseases...</p>`;

    const logRes = await API.heartbeat.list(CURRENT_CAT_ID, logAnchorDate, timeUnit);
    
    if (logRes.success && Array.isArray(logRes.data)) {
        renderHeartbeatLogs(
            currentLogContainer, 
            currentDiseaseContainer,
            logRes.data, 
            logAnchorDate,
            timeUnit
        );
    } else {
        currentLogContainer.innerHTML = `<p style="color: var(--red);">Error loading logs: ${logRes.message || 'Check API status or logs for this period.'}</p>`;
        currentDiseaseContainer.innerHTML = `<p style="color: var(--red);">Error loading diseases.</p>`;
    }
}

/**
 * Loads heartbeat logs for the Comparison Period container and renders them.
 */
async function loadComparisonLogs() {
    if (!CURRENT_CAT_ID) return;
    const comparisonLogContainer = $('#comparison-log-container'); 
    const comparisonDiseaseContainer = $('#comparison-diseases-container'); 
    
    const compAnchorDate = $('#comparison-period-date').value;
    const timeUnit = $('#time-range-select').value;
    const timeUnitDisplay = timeUnit.charAt(0).toUpperCase() + timeUnit.slice(1);
    
    $('#comp-header-text').textContent = `Comparison Period (${timeUnitDisplay})`;

    comparisonLogContainer.innerHTML = `<p style="color: var(--muted);">Loading comparison logs...</p>`;
    comparisonDiseaseContainer.innerHTML = `<p style="color: var(--muted);">Loading possible diseases...</p>`;
    
    const compRes = await API.heartbeat.list(CURRENT_CAT_ID, compAnchorDate, timeUnit);

    if (compRes.success && Array.isArray(compRes.data)) {
        renderHeartbeatLogs(
            comparisonLogContainer, 
            comparisonDiseaseContainer,
            compRes.data, 
            compAnchorDate,
            timeUnit
        );
    } else {
        comparisonLogContainer.innerHTML = `<p style="color: var(--red);">No data: ${compRes.message || 'Check API status or logs for this period.'}</p>`;
        comparisonDiseaseContainer.innerHTML = `<p style="color: var(--red);">No data in comparison log.</p>`;
    }
}

// Triggers the loading and rendering of logs for both the Current and Comparison periods.
function triggerAllLogLoad() {
    loadCurrentLogs();
    loadComparisonLogs();
}

// Attach listeners to all controls that affect the heartbeat logs for dynamic reloading.
document.addEventListener('DOMContentLoaded', () => {
    $('#diagnostic-date').addEventListener('change', loadCurrentLogs);
    $('#comparison-period-date').addEventListener('change', loadComparisonLogs);
    $('#time-range-select').addEventListener('change', triggerAllLogLoad);
    $('#view-mode-select').addEventListener('change', triggerAllLogLoad);
});


// --- INITIAL PAGE LOAD (Unchanged) ---

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

    // Set default dates and dropdown values for logs.
    const dateInput = $('#diagnostic-date');
    const comparisonInput = $('#comparison-period-date');
    const today = new Date().toISOString().substring(0, 10);
    dateInput.value = today;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    comparisonInput.value = weekAgo.toISOString().substring(0, 10);
    $('#time-range-select').value = 'week';
    $('#view-mode-select').value = 'graph'; // Default to graph view for the Graph page
}

// Fetches the cat's data based on the URL ID, stores global variables, and triggers log loading.
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
    CURRENT_NORMAL_HEARTBEAT = cat.normal_heartbeat; 

    renderCatDetails(cat);
    
    // Initial load of both log containers
    triggerAllLogLoad(); 
}

// Starts the process of loading data when the page initializes.
loadCatData();