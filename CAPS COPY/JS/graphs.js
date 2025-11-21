// ========= graphsss.js =========
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

// Formats an ISO date string into DD/MM/YYYY format.
const fmtDate = (iso) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

// Formats an ISO date string into DD/MM/YYYY : HH:MM AM/PM format.
const fmtDateTime = (iso) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  return `${dd}/${mm}/${yy} : ${hours}:${minutes} ${ampm}`;
};

// Formats an ISO date string for use as a Chart.js X-axis label (Month Abbr : HH:MM AM/PM).
const fmtChartLabel = (iso) => {
  const d = new Date(iso);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthAbbr = monthNames[d.getMonth()];
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return [`${monthAbbr} :`, `${hours}:${minutes} ${ampm}`];
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

// Global Chart.js instance variable.
let heartbeatChart;

// Data structure defining possible diseases and their associated abnormal BPM ranges.
const possibleDiseases = {
  'Cardiomyopathies': [{
    name: 'Hypertrophic Cardiomyopathy (HCM)',
    range: '>220 bpm'
  }, {
    name: 'Dilated Cardiomyopathy (DCM)',
    range: 'elevated heart rate'
  }, {
    name: 'Restrictive Cardiomyopathy (RCM)',
    range: 'often associated with tachycardia'
  }],
  'Arrhythmias (Abnormal Rhythms)': [{
    name: 'Bradycardia',
    range: '<140 bpm'
  }, {
    name: 'Third-Degree Atrioventricular (AV) Block',
    range: '40-65 bpm'
  }, {
    name: 'Tachycardia',
    range: '>220 bpm'
  }, {
    name: 'Supraventricular Tachycardia (SVT)',
    range: '150-380 bpm'
  }, {
    name: 'Ventricular Tachycardia (VT)',
    range: '>240 bpm'
  }, {
    name: 'Sinus Arrhythmia',
    range: '140-220 bpm'
  }],
  'Congenital Heart Defects': [{
    name: 'Ventricular Septal Defect (VSD)',
    range: 'high-end of the normal range or above'
  }, {
    name: 'Patent Ductus Arteriosus (PDA)',
    range: 'elevated'
  }]
};

/**
 * Compares a given BPM value against predefined disease ranges to find matches (client-side fallback/suggestion).
 * @param {number} bpm - The current heartbeat rate.
 * @param {string} normalRange - The cat's normal BPM range (e.g., '140-220 bpm').
 * @returns {Array<string>} List of matching diseases with their associated ranges.
 */
function getMatchingDiseases(bpm, normalRange) {
  let matchingDiseases = [];
  const [normalMin, normalMax] = normalRange.split('-').map(s => parseInt(s.trim()));

  for (const group in possibleDiseases) {
    let groupMatches = [];
    for (const disease of possibleDiseases[group]) {
      let rangeMatch = false;
      const rangeText = disease.range;

      if (rangeText.includes('<')) {
        const value = parseInt(rangeText.replace(/<|bpm/g, '').trim());
        if (bpm < value) {
          rangeMatch = true;
        }
      } else if (rangeText.includes('>')) {
        const value = parseInt(rangeText.replace(/>|bpm/g, '').trim());
        if (bpm > value) {
          rangeMatch = true;
        }
      } else if (rangeText.includes('-')) {
        const [min, max] = rangeText.replace(/bpm/g, '').split('-').map(s => parseInt(s.trim()));
        if (bpm >= min && bpm <= max) {
          rangeMatch = true;
        }
      } else if (rangeText.includes('elevated') || rangeText.includes('tachycardia')) {
        // Assume these are higher than normal range for a general match
        if (!isNaN(normalMax) && bpm > normalMax) {
          rangeMatch = true;
        }
      } else if (rangeText.includes('normal')) {
        // Skip normal range diseases for abnormal readings
        continue;
      }
      if (rangeMatch) {
        groupMatches.push(`${disease.name}: ${disease.range}`);
      }
    }
    if (groupMatches.length > 0) {
      matchingDiseases.push(`\n${group}:`);
      matchingDiseases = matchingDiseases.concat(groupMatches);
    }
  }
  return matchingDiseases;
}

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
 * Dynamically sets the width of the chart canvas to enable horizontal scrolling.
 * It uses a minimum width of 50px per data point, up to a maximum of 2000px.
 * @param {number} dataCount - The number of data points (records) in the chart.
 */
function setChartWidth(dataCount) {
  const chartCanvas = $('#heartbeatChart');
  const chartWrapper = $('#chartWrapper');
  // Determine the desired width: at least 50px per data point, min 100% of wrapper
  const minWidth = chartWrapper.clientWidth;
  const calculatedWidth = Math.max(dataCount * 50, minWidth);

  // Set the canvas width property for Chart.js
  chartCanvas.style.width = `${calculatedWidth}px`;
  // Important: Set height as well for Chart.js to scale correctly, matching the wrapper height
  chartCanvas.style.height = '100%'; 
}


/**
 * Fetches all heartbeat records, checks the latest reading status, and initializes the Chart.js graph.
 * @param {number} cat_id - The ID of the cat whose records are to be displayed.
 */
async function drawChart(cat_id) {
  const res = await API.records(cat_id);
  const catRes = await API.cat(cat_id);
  const normal_heartbeat = catRes.data.normal_heartbeat;
  const disease = catRes.data.disease;

  if (!res.success || res.data.length === 0) {
    showToast({
      title: 'No records found',
      message: 'No heartbeat data available for this cat.',
      type: 'info'
    });
    $('#bpmValue').textContent = '--';
    $('#bpmUpdated').textContent = '—';
    $('#heartbeatReading').textContent = 'No data available.';
    if (heartbeatChart) heartbeatChart.destroy();
    return;
  }
  const records = res.data;

  // Display the most recent heartbeat value and check status
  const mostRecentRecord = records[records.length - 1];
  $('#bpmValue').textContent = mostRecentRecord.heartbeat;
  const timeString = fmtDateTime(mostRecentRecord.recorded_at);

  const [minBPM, maxBPM] = normal_heartbeat.split('-').map(s => parseInt(s.trim()));
  const currentBPM = parseInt(mostRecentRecord.heartbeat);
  const possibleDiseasesText = mostRecentRecord.possible_diseases; 
  const heartbeatReadingEl = $('#heartbeatReading');

  heartbeatReadingEl.classList.remove('normal', 'abnormal', 'small');
  heartbeatReadingEl.innerHTML = '';

  if (!isNaN(minBPM) && !isNaN(maxBPM) && currentBPM >= minBPM && currentBPM <= maxBPM) {
    heartbeatReadingEl.textContent = 'Normal';
    heartbeatReadingEl.classList.add('normal');
  } else {
    heartbeatReadingEl.classList.add('abnormal');
    let abnormalText = '';
    if (currentBPM < minBPM) {
      abnormalText = `Abnormal Reading: Heartbeat pattern is lower than the normal range.`;
    } else {
      abnormalText = `Abnormal Reading: Heartbeat pattern is higher than the normal range.`;
    }
    heartbeatReadingEl.textContent = abnormalText;

    // Logic for displaying possible diseases based on abnormal reading
    if (disease && disease.toLowerCase() === 'normal') {
      let matchingDiseases = [];

      // Prefer the stored possible_diseases text if available
      if (possibleDiseasesText && possibleDiseasesText.trim().length > 0) {
        // The server-stored text is a newline-separated string, convert it to an array of lines
        matchingDiseases = possibleDiseasesText.trim().split('\n').filter(line => line.trim().length > 0);
      } else {
        // Fallback to client-side calculation if server data is not available
        matchingDiseases = getMatchingDiseases(currentBPM, normal_heartbeat);
      }
      
      if (matchingDiseases.length > 0) {
        let diseasesList = matchingDiseases.map(d => `<li>${d}</li>`).join('');
        heartbeatReadingEl.innerHTML += `
          <div class="diseases-section">
            <h4 class="diseases-title">Possible Related Diseases:</h4>
            <ul class="diseases-list">${diseasesList}</ul>
          </div>
        `;
        heartbeatReadingEl.classList.add('small');
      }
    }
  }

  $('#bpmUpdated').textContent = `Last reading: ${timeString}`;

  const labels = records.map(r => fmtChartLabel(r.recorded_at));
  const data = records.map(r => parseInt(r.heartbeat));

  const ctx = $('#heartbeatChart').getContext('2d');
  if (heartbeatChart) heartbeatChart.destroy();

  // *** SCROLLING LOGIC: Set canvas width before initializing chart ***
  setChartWidth(records.length);

  // Initialize the Chart.js graph instance
  heartbeatChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Heartbeat (BPM)',
        data: data,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1'
      }]
    },
    options: {
      responsive: false, // Set to false for fixed-width/scrollable chart
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'BPM',
            color: '#000000' // UPDATED: Changed color to black
          },
          grid: {
            color: '#334155'
          },
          ticks: {
            color: '#000000' // UPDATED: Changed color to black
          }
        },
        x: {
          title: {
            display: true,
            text: 'Time',
            color: '#000000' // UPDATED: Changed color to black
          },
          grid: {
            color: '#334155'
          },
          ticks: {
            color: '#000000', // UPDATED: Changed color to black
            font: {
              size: 8
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += `${context.parsed.y} BPM`;
              }
              return label;
            }
          }
        }
      }
    }
  });
}

/**
 * Fetches the latest heartbeat records and updates the existing Chart.js graph and status display.
 * This function is intended to be called periodically (every 30 seconds).
 * @param {number} cat_id - The ID of the cat to update records for.
 */
async function updateChart(cat_id) {
  const res = await API.records(cat_id);
  const catRes = await API.cat(cat_id);
  const normal_heartbeat = catRes.data.normal_heartbeat;
  const disease = catRes.data.disease;

  if (res.success && res.data.length > 0) {
    const records = res.data;
    const mostRecentRecord = records[records.length - 1];
    $('#bpmValue').textContent = mostRecentRecord.heartbeat;
    const timeString = fmtDateTime(mostRecentRecord.recorded_at);

    const [minBPM, maxBPM] = normal_heartbeat.split('-').map(s => parseInt(s.trim()));
    const currentBPM = parseInt(mostRecentRecord.heartbeat);
    const possibleDiseasesText = mostRecentRecord.possible_diseases;
    const heartbeatReadingEl = $('#heartbeatReading');

    heartbeatReadingEl.classList.remove('normal', 'abnormal', 'small');
    heartbeatReadingEl.innerHTML = '';

    if (!isNaN(minBPM) && !isNaN(maxBPM) && currentBPM >= minBPM && currentBPM <= maxBPM) {
      heartbeatReadingEl.textContent = 'Normal';
      heartbeatReadingEl.classList.add('normal');
    } else {
      heartbeatReadingEl.classList.add('abnormal');
      let abnormalText = '';
      if (currentBPM < minBPM) {
        abnormalText = `Abnormal Reading: Heartbeat pattern is lower than the normal range.`;
      } else {
        abnormalText = `Abnormal Reading: Heartbeat pattern is higher than the normal range.`;
      }
      heartbeatReadingEl.textContent = abnormalText;

      // Logic for displaying possible diseases based on abnormal reading
      if (disease && disease.toLowerCase() === 'normal') {
        let matchingDiseases = [];

        // Prefer the stored possible_diseases text if available
        if (possibleDiseasesText && possibleDiseasesText.trim().length > 0) {
          // The server-stored text is a newline-separated string, convert it to an array of lines
          matchingDiseases = possibleDiseasesText.trim().split('\n').filter(line => line.trim().length > 0);
        } else {
          // Fallback to client-side calculation if server data is not available
          matchingDiseases = getMatchingDiseases(currentBPM, normal_heartbeat);
        }

        if (matchingDiseases.length > 0) {
          let diseasesList = matchingDiseases.map(d => `<li>${d}</li>`).join('');
          heartbeatReadingEl.innerHTML += `
            <div class="diseases-section">
              <h4 class="diseases-title">Possible Related Diseases:</h4>
              <ul class="diseases-list">${diseasesList}</ul>
            </div>
          `;
          heartbeatReadingEl.classList.add('small');
        }
      }
    }

    $('#bpmUpdated').textContent = `Last reading: ${timeString}`;

    const labels = records.map(r => fmtChartLabel(r.recorded_at));
    const data = records.map(r => parseInt(r.heartbeat));

    // *** SCROLLING LOGIC: Update canvas width before updating chart data ***
    setChartWidth(records.length);

    // Update the existing chart instance
    if (heartbeatChart) {
      heartbeatChart.data.labels = labels;
      heartbeatChart.data.datasets[0].data = data;
      // Also update scales to ensure color is black (though this should be constant)
      heartbeatChart.options.scales.y.title.color = '#000000';
      heartbeatChart.options.scales.y.ticks.color = '#000000';
      heartbeatChart.options.scales.x.title.color = '#000000';
      heartbeatChart.options.scales.x.ticks.color = '#000000';
      
      heartbeatChart.update();
    }
  }
}

// Immediately Invoked Function Expression (IIFE) to initialize the page setup and periodic updates.
(async function init() {
  const cat = await getDetails();
  if (cat) {
    drawChart(cat.id);
    // Set up an interval to refresh the chart data every 30 seconds
    setInterval(() => updateChart(cat.id), 30000);
  }
})();