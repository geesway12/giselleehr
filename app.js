// ✅ Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(() => {
    console.log('✅ Service Worker Registered');
  });
}

// 🧠 Helper: Calculate Age
function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// 🧠 Helper: Filter by time period
function filterByPeriod(data, period, dateField) {
  const today = new Date();
  return data.filter(item => {
    const date = new Date(item[dateField]);
    switch (period) {
      case "day": return date.toDateString() === today.toDateString();
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return date >= weekStart && date <= weekEnd;
      case "month":
        return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
      case "year":
        return date.getFullYear() === today.getFullYear();
      default: return true;
    }
  });
}

// 🔁 Update dropdown with dynamic registers
async function loadRegistersToDropdown() {
  const db = await getDB();
  const registers = await db.getAll('registers');
  const reportSelect = document.getElementById('reportType');

  registers.forEach(reg => {
    const option = document.createElement('option');
    option.value = `register-${reg.id}`;
    option.textContent = reg.name;
    reportSelect.appendChild(option);
  });
}

// ✅ Summary Generator
function generateSummary() {
  const reportType = document.getElementById("reportType").value;
  const period = document.getElementById("periodFilter").value;

  document.getElementById("summaryCards").innerHTML = "";
  document.getElementById("dataTable").innerHTML = "";
  document.getElementById("summaryChart").innerHTML = "";
  document.getElementById("selectedPeriod").innerHTML = "";

  if (reportType === "patients") {
    generatePatientSummary();
  } else if (reportType === "visits") {
    generateVisitSummary();
  } else if (reportType.startsWith("register-")) {
    const registerId = reportType.split("register-")[1];
    generateRegisterSummary(registerId);
  }
}

// 👤 Patient Summary
function generatePatientSummary() {
  const period = document.getElementById("periodFilter").value;
  const sex = document.getElementById("sexFilter").value;
  const selectedPeriod = document.getElementById("selectedPeriod");

  getAllData("patients", patients => {
    const filtered = sex === "all" ? patients : patients.filter(p => p.sex === sex);
    const filteredByPeriod = filterByPeriod(filtered, period, "registrationDate");

    const ageGroups = {
      "<1": 0, "1-4": 0, "5-9": 0, "10-14": 0, "15-19": 0,
      "20-24": 0, "25-29": 0, "30-34": 0, "35-39": 0,
      "40-44": 0, "45-49": 0, "50+": 0
    };

    filtered.forEach(p => {
      const age = calculateAge(p.dob);
      if (age < 1) ageGroups["<1"]++;
      else if (age <= 4) ageGroups["1-4"]++;
      else if (age <= 9) ageGroups["5-9"]++;
      else if (age <= 14) ageGroups["10-14"]++;
      else if (age <= 19) ageGroups["15-19"]++;
      else if (age <= 24) ageGroups["20-24"]++;
      else if (age <= 29) ageGroups["25-29"]++;
      else if (age <= 34) ageGroups["30-34"]++;
      else if (age <= 39) ageGroups["35-39"]++;
      else if (age <= 44) ageGroups["40-44"]++;
      else if (age <= 49) ageGroups["45-49"]++;
      else ageGroups["50+"]++;
    });

    document.getElementById("summaryCards").innerHTML = `
      <div class="col-md-3"><div class="card text-center"><div class="card-body">
        <h5>Total Patients</h5><p class="display-6">${filtered.length}</p>
      </div></div></div>
      <div class="col-md-3"><div class="card text-center"><div class="card-body">
        <h5>New This Period</h5><p class="display-6">${filteredByPeriod.length}</p>
      </div></div></div>
    `;

    const tbody = Object.entries(ageGroups).map(([age, count]) =>
      `<tr><td>${age}</td><td>${count}</td></tr>`).join('');
    document.getElementById("dataTable").innerHTML = `
      <h4>Age Group Distribution</h4>
      <table class="table table-bordered"><thead><tr><th>Age Group</th><th>Count</th></tr></thead>
      <tbody>${tbody}</tbody></table>
    `;
  });
}

// 🩺 Visit Summary
function generateVisitSummary() {
  const period = document.getElementById("periodFilter").value;

  getAllData("visits", visits => {
    const filtered = filterByPeriod(visits, period, "visitDate");

    document.getElementById("summaryCards").innerHTML = `
      <div class="col-md-3"><div class="card text-center"><div class="card-body">
        <h5>Total Visits</h5><p class="display-6">${visits.length}</p>
      </div></div></div>
      <div class="col-md-3"><div class="card text-center"><div class="card-body">
        <h5>Visits This Period</h5><p class="display-6">${filtered.length}</p>
      </div></div></div>
    `;

    const tableRows = filtered.map(v => `
      <tr>
        <td>${v.patientName || v.patientID}</td>
        <td>${v.visitDate}</td>
        <td>${v.reason || '-'}</td>
        <td>${v.diagnosis || '-'}</td>
      </tr>`).join('');

    document.getElementById("dataTable").innerHTML = `
      <h4>Visit Details</h4>
      <table class="table table-bordered">
        <thead><tr><th>Patient</th><th>Date</th><th>Reason</th><th>Diagnosis</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    `;
  });
}

// 🗂️ Register Summary
async function generateRegisterSummary(registerId) {
  const db = await getDB();
  const register = await db.get('registers', registerId);
  const period = document.getElementById("periodFilter").value;

  if (!register) return;

  getAllData(`register-${registerId}`, entries => {
    const filtered = filterByPeriod(entries, period, 'dateOfService');

    document.getElementById("summaryCards").innerHTML = `
      <div class="col-md-3"><div class="card text-center"><div class="card-body">
        <h5>Total Records</h5><p class="display-6">${entries.length}</p>
      </div></div></div>
      <div class="col-md-3"><div class="card text-center"><div class="card-body">
        <h5>This Period</h5><p class="display-6">${filtered.length}</p>
      </div></div></div>
    `;

    // Build table
    const headers = ['Patient ID', 'Date of Service', ...register.fields.map(f => f.label)];
    const thead = headers.map(h => `<th>${h}</th>`).join('');

    const rows = filtered.map(entry => {
      const cells = [entry.patientID, entry.dateOfService, ...register.fields.map(f => {
        const val = entry[f.name];
        return Array.isArray(val) ? val.join(', ') : val || '-';
      })];
      return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
    }).join('');

    document.getElementById("dataTable").innerHTML = `
      <h4>${register.name} Records</h4>
      <table class="table table-bordered">
        <thead><tr>${thead}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  });
}

// 🧠 Helper: Generate Summary Cards
function generateSummaryCards(data) {
  const summaryCards = document.getElementById('summaryCards');
  summaryCards.innerHTML = '';

  const cardData = [
    { label: 'Total Patients', value: data.totalPatients },
    { label: 'Total Visits', value: data.totalVisits },
    { label: 'New Patients This Period', value: data.newPatients },
    { label: 'Visits This Period', value: data.visitsThisPeriod }
  ];

  cardData.forEach(card => {
    const cardElement = document.createElement('div');
    cardElement.className = 'col-md-3';
    cardElement.innerHTML = `
      <div class="text-center">
        <p class="card-label">${card.label}</p>
        <div class="card text-center equal-card">
          <div class="card-body">
            <p class="card-value display-6">${card.value}</p>
          </div>
        </div>
      </div>
    `;
    summaryCards.appendChild(cardElement);
  });
}

// 🚀 Load on Ready
document.addEventListener("DOMContentLoaded", async () => {
  await loadRegistersToDropdown();

  if (dbReady) {
    generateSummary();
  } else {
    window.onDatabaseReady = () => generateSummary();
  }
});
