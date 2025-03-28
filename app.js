// ✅ Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(() => {
    console.log('✅ Service Worker Registered');
  });
}

// 🔢 Calculate Age
function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

// 🔍 Filter by Period
function filterByPeriod(data, period, dateKey) {
  const today = new Date();
  return data.filter(item => {
    const date = new Date(item[dateKey]);
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

// 🧠 Load Registers to Dropdown
async function loadRegistersToDropdown() {
  const db = await getDB();
  const registers = await db.getAll('registers');
  const reportSelect = document.getElementById('reportType');

  reportSelect.innerHTML = `
    <option value="patients">Patient Report</option>
    <option value="visits">Visit Report</option>
  `;

  registers.forEach(reg => {
    const opt = document.createElement('option');
    opt.value = `register-${reg.id}`;
    opt.textContent = `${reg.name} Report`;
    reportSelect.appendChild(opt);
  });
}

// 📊 Generate Summary Entry
function generateSummary() {
  const reportType = document.getElementById("reportType").value;
  const period = document.getElementById("periodFilter").value;

  document.getElementById("summaryCards").innerHTML = "";
  document.getElementById("dataTable").innerHTML = "";

  if (reportType === "patients") generatePatientSummary(period);
  else if (reportType === "visits") generateVisitSummary(period);
  else if (reportType.startsWith("register-")) {
    const registerId = reportType.replace("register-", "");
    generateRegisterSummary(registerId, period);
  }
}

// 👤 Patient Summary
function generatePatientSummary(period) {
  getAllData("patients", patients => {
    const filtered = filterByPeriod(patients, period, "registrationDate");

    const male = filtered.filter(p => p.sex === "Male").length;
    const female = filtered.filter(p => p.sex === "Female").length;

    document.getElementById("summaryCards").innerHTML = `
      <div class="col"><div class="card text-center"><div class="card-body">
        <h5>Total Patients</h5><p class="fs-3 fw-bold">${filtered.length}</p>
      </div></div></div>
      <div class="col"><div class="card text-center"><div class="card-body text-primary">
        <h6>Male</h6><p class="fs-4">${male}</p>
      </div></div></div>
      <div class="col"><div class="card text-center"><div class="card-body text-danger">
        <h6>Female</h6><p class="fs-4">${female}</p>
      </div></div></div>
    `;

    const ageGroups = {};
    filtered.forEach(p => {
      const age = calculateAge(p.dob);
      const group = age < 5 ? "Under 5" :
                    age < 15 ? "5-14" :
                    age < 25 ? "15-24" :
                    age < 35 ? "25-34" :
                    age < 45 ? "35-44" :
                    age < 60 ? "45-59" : "60+";

      if (!ageGroups[group]) ageGroups[group] = { Male: 0, Female: 0 };
      if (p.sex === "Male") ageGroups[group].Male++;
      if (p.sex === "Female") ageGroups[group].Female++;
    });

    const rows = Object.entries(ageGroups).map(([group, val]) => `
      <tr>
        <td>${group}</td>
        <td>${val.Male}</td>
        <td>${val.Female}</td>
        <td>${val.Male + val.Female}</td>
      </tr>
    `).join("");

    document.getElementById("dataTable").innerHTML = `
      <h5 class="mt-4">Age Group Distribution</h5>
      <table class="table table-bordered">
        <thead><tr><th>Age Group</th><th>Male</th><th>Female</th><th>Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  });
}

// 💊 Visit Summary
function generateVisitSummary(period) {
  getAllData("visits", visits => {
    const filtered = filterByPeriod(visits, period, "visitDate");

    const male = filtered.filter(v => v.sex === "Male").length;
    const female = filtered.filter(v => v.sex === "Female").length;

    document.getElementById("summaryCards").innerHTML = `
      <div class="col"><div class="card text-center"><div class="card-body">
        <h5>Total Visits</h5><p class="fs-3 fw-bold">${filtered.length}</p>
      </div></div></div>
      <div class="col"><div class="card text-center"><div class="card-body text-primary">
        <h6>Male</h6><p class="fs-4">${male}</p>
      </div></div></div>
      <div class="col"><div class="card text-center"><div class="card-body text-danger">
        <h6>Female</h6><p class="fs-4">${female}</p>
      </div></div></div>
    `;

    const rows = filtered.slice(-10).reverse().map(v => `
      <tr>
        <td>${v.patientName || v.patientID}</td>
        <td>${v.visitDate}</td>
        <td>${v.reason || '-'}</td>
        <td>${v.diagnosis || '-'}</td>
      </tr>
    `).join('');

    document.getElementById("dataTable").innerHTML = `
      <h5 class="mt-4">Recent Visits</h5>
      <table class="table table-bordered">
        <thead><tr><th>Patient</th><th>Date</th><th>Reason</th><th>Diagnosis</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  });
}

// 🗂️ Register Summary
async function generateRegisterSummary(registerId, period) {
  const db = await getDB();
  const register = await db.get('registers', registerId);
  if (!register) return;

  const storeName = `register-${register.id}`;
  getAllData(storeName, records => {
    const filtered = filterByPeriod(records, period, 'dateOfService');

    document.getElementById("summaryCards").innerHTML = `
      <div class="col"><div class="card text-center"><div class="card-body">
        <h5>Total Records</h5><p class="fs-3 fw-bold">${filtered.length}</p>
      </div></div></div>
    `;

    const headers = ['Patient ID', 'Name', 'Sex', 'Age', 'Date of Service', ...register.fields.map(f => f.label)];
    const thead = headers.map(h => `<th>${h}</th>`).join('');

    const rows = filtered.map(r => {
      const cells = [
        r.patientID, r.patientName, r.sex, r.age, r.dateOfService,
        ...register.fields.map(f => Array.isArray(r[f.label]) ? r[f.label].join(', ') : r[f.label] || '-')
      ];
      return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
    }).join('');

    document.getElementById("dataTable").innerHTML = `
      <h5 class="mt-4">${register.name} Records</h5>
      <table class="table table-bordered">
        <thead><tr>${thead}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  });
}

// 🚀 Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadRegistersToDropdown();

  if (typeof dbReady === 'undefined' || dbReady) {
    generateSummary();
  } else {
    window.onDatabaseReady = () => generateSummary();
  }

  document.getElementById("reportType").addEventListener("change", generateSummary);
  document.getElementById("periodFilter").addEventListener("change", generateSummary);
});
