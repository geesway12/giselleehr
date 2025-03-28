// app.js
let patientChart = null;
let visitChart = null;

async function generateSummary() {
  try {
    const period = document.getElementById('periodFilter').value;
    const activeSection = document.querySelector('.dashboard-section:not(.d-none)').id;
    
    if (activeSection.includes('patients')) {
      await generatePatientSummary(period);
    } else if (activeSection.includes('visits')) {
      await generateVisitSummary(period);
    } else if (activeSection.includes('registers')) {
      await generateRegisterSummary(period);
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    showError('Failed to load dashboard data');
  }
}

async function generatePatientSummary(period) {
  try {
    const patients = await dbAPI.getAllData('patients');
    const filtered = filterByPeriod(patients, period, "registrationDate");

    updatePatientSummaryCards(filtered);
    updateDemographicsChart(filtered);
    updateAgeGroupTable(filtered);
    
  } catch (error) {
    throw new Error(`Patient summary failed: ${error.message}`);
  }
}

function updatePatientSummaryCards(patients) {
  const maleCount = patients.filter(p => p.sex === 'Male').length;
  const femaleCount = patients.filter(p => p.sex === 'Female').length;

  document.getElementById('patientsSummaryCards').innerHTML = `
    <div class="col">
      <div class="card text-center h-100">
        <div class="card-body">
          <h5 class="card-title">Total Patients</h5>
          <p class="display-4">${patients.length}</p>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="card text-center h-100">
        <div class="card-body text-primary">
          <h5 class="card-title">Male Patients</h5>
          <p class="display-4">${maleCount}</p>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="card text-center h-100">
        <div class="card-body text-danger">
          <h5 class="card-title">Female Patients</h5>
          <p class="display-4">${femaleCount}</p>
        </div>
      </div>
    </div>
  `;
}

function updateDemographicsChart(patients) {
  const ctx = document.getElementById('patientSexChart').getContext('2d');
  const maleCount = patients.filter(p => p.sex === 'Male').length;
  const femaleCount = patients.filter(p => p.sex === 'Female').length;

  if (patientChart) patientChart.destroy();

  patientChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Male', 'Female'],
      datasets: [{
        data: [maleCount, femaleCount],
        backgroundColor: ['#0d6efd', '#dc3545']
      }]
    }
  });
}

function updateAgeGroupTable(patients) {
  const ageGroups = {
    'Under 5': { male: 0, female: 0 },
    '5-14': { male: 0, female: 0 },
    '15-24': { male: 0, female: 0 },
    '25-34': { male: 0, female: 0 },
    '35-44': { male: 0, female: 0 },
    '45-59': { male: 0, female: 0 },
    '60+': { male: 0, female: 0 }
  };

  patients.forEach(p => {
    const age = calculateAge(p.dob);
    const group = age < 5 ? 'Under 5' :
                  age < 15 ? '5-14' :
                  age < 25 ? '15-24' :
                  age < 35 ? '25-34' :
                  age < 45 ? '35-44' :
                  age < 60 ? '45-59' : '60+';

    if (p.sex === 'Male') ageGroups[group].male++;
    if (p.sex === 'Female') ageGroups[group].female++;
  });

  const tbody = document.getElementById('patientsAgeGroupTable');
  tbody.innerHTML = Object.entries(ageGroups).map(([group, counts]) => `
    <tr>
      <td>${group}</td>
      <td>${counts.male}</td>
      <td>${counts.female}</td>
      <td>${counts.male + counts.female}</td>
    </tr>
  `).join('');
}

async function generateVisitSummary(period) {
  try {
    const visits = await dbAPI.getAllData('visits');
    const filtered = filterByPeriod(visits, period, "visitDate");

    updateVisitSummaryCards(filtered);
    updateVisitChart(filtered);
    updateVisitTable(filtered);
    
  } catch (error) {
    throw new Error(`Visit summary failed: ${error.message}`);
  }
}

function updateVisitSummaryCards(visits) {
  const maleVisits = visits.filter(v => v.sex === 'Male').length;
  const femaleVisits = visits.filter(v => v.sex === 'Female').length;

  document.getElementById('visitsSummaryCards').innerHTML = `
    <div class="col">
      <div class="card text-center h-100">
        <div class="card-body">
          <h5 class="card-title">Total Visits</h5>
          <p class="display-4">${visits.length}</p>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="card text-center h-100">
        <div class="card-body text-primary">
          <h5 class="card-title">Male Visits</h5>
          <p class="display-4">${maleVisits}</p>
        </div>
      </div>
    </div>
    <div class="col">
      <div class="card text-center h-100">
        <div class="card-body text-danger">
          <h5 class="card-title">Female Visits</h5>
          <p class="display-4">${femaleVisits}</p>
        </div>
      </div>
    </div>
  `;
}

function updateVisitChart(visits) {
  const ctx = document.getElementById('visitSexChart').getContext('2d');
  const maleCount = visits.filter(v => v.sex === 'Male').length;
  const femaleCount = visits.filter(v => v.sex === 'Female').length;

  if (visitChart) visitChart.destroy();

  visitChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Male', 'Female'],
      datasets: [{
        data: [maleCount, femaleCount],
        backgroundColor: ['#0d6efd', '#dc3545']
      }]
    }
  });
}

function updateVisitTable(visits) {
  const tbody = document.getElementById('visitsDetailsTable');
  tbody.innerHTML = visits.slice(-10).reverse().map(v => `
    <tr>
      <td>${v.patientName || 'Unknown'}</td>
      <td>${new Date(v.visitDate).toLocaleDateString()}</td>
      <td>${v.reason || '-'}</td>
      <td>${v.diagnosis || '-'}</td>
    </tr>
  `).join('');
}

async function generateRegisterSummary(period) {
  try {
    const registers = await dbAPI.getAllData('registers');
    const registerData = await Promise.all(registers.map(async reg => {
      const entries = await dbAPI.getAllData(`register_${reg.id}`);
      return {
        ...reg,
        count: entries.length,
        recentEntries: entries.slice(-5)
      };
    }));

    updateRegisterCards(registerData);
    updateRegisterList(registerData);
    
  } catch (error) {
    throw new Error(`Register summary failed: ${error.message}`);
  }
}

function updateRegisterCards(registers) {
  document.getElementById('registersSummaryCards').innerHTML = registers.map(reg => `
    <div class="col">
      <div class="card text-center h-100">
        <div class="card-body">
          <h5 class="card-title">${reg.name}</h5>
          <p class="display-4">${reg.count}</p>
          <small class="text-muted">${reg.fields.length} fields</small>
        </div>
      </div>
    </div>
  `).join('');
}

function updateRegisterList(registers) {
  const list = document.getElementById('registerList');
  list.innerHTML = registers.map(reg => `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      ${reg.name}
      <span class="badge bg-primary rounded-pill">${reg.count} entries</span>
    </li>
  `).join('');
}

function showError(message) {
  const container = document.createElement('div');
  container.className = 'alert alert-danger m-3';
  container.textContent = message;
  document.body.prepend(container);
  setTimeout(() => container.remove(), 3000);
}

// Initialize when database is ready
window.onDatabaseReady = () => {
  generateSummary();
  setInterval(generateSummary, 300000); // Refresh every 5 minutes
};