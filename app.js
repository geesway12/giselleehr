// ✅ Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(() => {
    console.log('✅ Service Worker Registered');
  });
}

// ✅ Get selected filter value and generate summaries
function generateSummary() {
  const periodFilter = document.getElementById("periodFilter").value;
  const sexFilter = document.getElementById("sexFilter").value;
  const selectedPeriod = document.getElementById("selectedPeriod");
  const summaryCards = document.getElementById("summaryCards");
  const ageGroupTableBody = document.getElementById("ageGroupTableBody");

  summaryCards.innerHTML = "";
  ageGroupTableBody.innerHTML = "";

  // 📆 Determine current view period
  const today = new Date();
  let periodText = "";
  switch (periodFilter) {
    case "day":
      periodText = `Day: ${today.toLocaleDateString()}`;
      break;
    case "week":
      const weekNumber = Math.ceil(today.getDate() / 7);
      periodText = `Week: ${weekNumber}, ${today.getFullYear()}`;
      break;
    case "month":
      periodText = `Month: ${today.toLocaleString("default", { month: "long" })}, ${today.getFullYear()}`;
      break;
    case "year":
      periodText = `Year: ${today.getFullYear()}`;
      break;
    case "all":
      periodText = "All Time";
      break;
  }

  selectedPeriod.innerHTML = `
    <p><strong>Viewing:</strong> ${periodText}</p>
    <h5>Age Group Distribution (Registered Patients)</h5>
  `;

  // 📊 Fetch data from IndexedDB
  getAllData("patients", patients => {
    getAllData("visits", visits => {
      const filteredPatientsBySex = sexFilter === "all" ? patients : patients.filter(p => p.sex === sexFilter);
      const filteredPatients = filterByPeriod(filteredPatientsBySex, periodFilter, "registrationDate");
      const filteredVisits = filterByPeriod(visits, periodFilter, "visitDate");

      const totalPatients = filteredPatientsBySex.length;
      const totalVisits = visits.length;
      const newPatientsThisPeriod = filteredPatients.length;
      const visitsThisPeriod = filteredVisits.length;

      // 📈 Age group buckets
      const ageGroups = {
        "<1": filteredPatientsBySex.filter(p => calculateAge(p.dob) < 1).length,
        "1-4": filteredPatientsBySex.filter(p => {
          const age = calculateAge(p.dob);
          return age >= 1 && age <= 4;
        }).length,
        "5-9": filteredPatientsBySex.filter(p => {
          const age = calculateAge(p.dob);
          return age >= 5 && age <= 9;
        }).length,
        "10-14": filteredPatientsBySex.filter(p => {
          const age = calculateAge(p.dob);
          return age >= 10 && age <= 14;
        }).length,
        "15-19": filteredPatientsBySex.filter(p => {
          const age = calculateAge(p.dob);
          return age >= 15 && age <= 19;
        }).length,
        "20-24": filteredPatientsBySex.filter(p => {
          const age = calculateAge(p.dob);
          return age >= 20 && age <= 24;
        }).length,
        "25-29": filteredPatientsBySex.filter(p => {
          const age = calculateAge(p.dob);
          return age >= 25 && age <= 29;
        }).length,
        "30-34": filteredPatientsBySex.filter(p => {
          const age = calculateAge(p.dob);
          return age >= 30 && age <= 34;
        }).length,
        "35-39": filteredPatientsBySex.filter(p => {
          const age = calculateAge(p.dob);
          return age >= 35 && age <= 39;
        }).length,
        "40-44": filteredPatientsBySex.filter(p => {
          const age = calculateAge(p.dob);
          return age >= 40 && age <= 44;
        }).length,
        "45-49": filteredPatientsBySex.filter(p => {
          const age = calculateAge(p.dob);
          return age >= 45 && age <= 49;
        }).length,
        "50+": filteredPatientsBySex.filter(p => calculateAge(p.dob) >= 50).length,
      };

      // 🧾 Summary Cards
      const summaryData = [
        { title: "Total Patients", value: totalPatients },
        { title: "Total Visits", value: totalVisits },
        { title: "New Patients This Period", value: newPatientsThisPeriod },
        { title: "Visits This Period", value: visitsThisPeriod },
      ];

      summaryData.forEach(item => {
        const card = document.createElement("div");
        card.className = "col-md-3 mb-3";
        card.innerHTML = `
          <div class="card text-center equal-card">
            <div class="card-body">
              <h5 class="card-title">${item.title}</h5>
              <p class="card-text display-6">${item.value}</p>
            </div>
          </div>
        `;
        summaryCards.appendChild(card);
      });

      // 📋 Age group distribution table
      Object.entries(ageGroups).forEach(([group, count]) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${group}</td><td>${count}</td>`;
        ageGroupTableBody.appendChild(row);
      });
    });
  });
}

// 🧠 Helper: Filter by period
function filterByPeriod(data, period, dateField) {
  const today = new Date();
  return data.filter(item => {
    const date = new Date(item[dateField]);
    switch (period) {
      case "day":
        return date.toDateString() === today.toDateString();
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
      case "all":
        return true;
      default:
        return false;
    }
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

// 🚀 On Load
document.addEventListener("DOMContentLoaded", () => {
  if (dbReady) {
    generateSummary();
  } else {
    window.onDatabaseReady = () => {
      generateSummary();
    };
  }
});
