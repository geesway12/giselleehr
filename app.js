// ✅ Service Worker Registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(() => {
    console.log('Service Worker Registered');
  });
}

// ✅ Get selected filter value and generate summaries
function generateSummary() {
  const periodFilter = document.getElementById("periodFilter").value;
  const sexFilter = document.getElementById("sexFilter").value;
  const selectedPeriod = document.getElementById("selectedPeriod");
  const summaryCards = document.getElementById("summaryCards");
  const ageGroupTableBody = document.getElementById("ageGroupTableBody");

  // Clear existing cards and table rows
  summaryCards.innerHTML = "";
  ageGroupTableBody.innerHTML = "";

  // Determine the period and display it
  const today = new Date();
  let periodText = "";

  switch (periodFilter) {
    case "day":
      periodText = `Day: ${today.toLocaleDateString()}`;
      break;
    case "week":
      const weekNumber = Math.ceil(today.getDate() / 7);
      periodText = `Week: ${weekNumber}, Year: ${today.getFullYear()}`;
      break;
    case "month":
      periodText = `Month: ${today.toLocaleString("default", { month: "long" })}, Year: ${today.getFullYear()}`;
      break;
    case "year":
      periodText = `Year: ${today.getFullYear()}`;
      break;
    case "all":
      periodText = "All Time";
      break;
  }

  selectedPeriod.innerHTML = `<p><strong>Viewing:</strong> ${periodText}</p>`;

  // Fetch data from the database
  getAllData("patients", patients => {
    getAllData("visits", visits => {
      // Filter patients by sex
      const filteredPatientsBySex = sexFilter === "all" ? patients : patients.filter(p => p.sex === sexFilter);

      // Filter patients and visits based on the selected period
      const filteredPatients = filterByPeriod(filteredPatientsBySex, periodFilter, "registrationDate");
      const filteredVisits = filterByPeriod(visits, periodFilter, "visitDate");

      // Calculate statistics
      const totalPatients = filteredPatientsBySex.length;
      const totalVisits = visits.length;
      const newPatientsThisPeriod = filteredPatients.length;
      const visitsThisPeriod = filteredVisits.length;

      // Count by age groups
      const ageGroups = {
        "<1": filteredPatientsBySex.filter(p => calculateAge(p.dob) < 1).length,
        "1-4": filteredPatientsBySex.filter(p => calculateAge(p.dob) >= 1 && calculateAge(p.dob) <= 4).length,
        "5-9": filteredPatientsBySex.filter(p => calculateAge(p.dob) >= 5 && calculateAge(p.dob) <= 9).length,
        "10-14": filteredPatientsBySex.filter(p => calculateAge(p.dob) >= 10 && calculateAge(p.dob) <= 14).length,
        "15-19": filteredPatientsBySex.filter(p => calculateAge(p.dob) >= 15 && calculateAge(p.dob) <= 19).length,
        "20-24": filteredPatientsBySex.filter(p => calculateAge(p.dob) >= 20 && calculateAge(p.dob) <= 24).length,
        "25-29": filteredPatientsBySex.filter(p => calculateAge(p.dob) >= 25 && calculateAge(p.dob) <= 29).length,
        "30-34": filteredPatientsBySex.filter(p => calculateAge(p.dob) >= 30 && calculateAge(p.dob) <= 34).length,
        "35-39": filteredPatientsBySex.filter(p => calculateAge(p.dob) >= 35 && calculateAge(p.dob) <= 39).length,
        "40-44": filteredPatientsBySex.filter(p => calculateAge(p.dob) >= 40 && calculateAge(p.dob) <= 44).length,
        "45-49": filteredPatientsBySex.filter(p => calculateAge(p.dob) >= 45 && calculateAge(p.dob) <= 49).length,
        "50+": filteredPatientsBySex.filter(p => calculateAge(p.dob) >= 50).length,
      };

      // Summary data for cards
      const summaryData = [
        { title: "Total Patients", value: totalPatients },
        { title: "Total Visits", value: totalVisits },
        { title: "New Patients This Period", value: newPatientsThisPeriod },
        { title: "Visits This Period", value: visitsThisPeriod },
      ];

      // Generate cards
      summaryData.forEach(item => {
        const card = document.createElement("div");
        card.className = "col-md-3";
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

      // Generate age group table rows
      Object.entries(ageGroups).forEach(([group, count]) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${group}</td>
          <td>${count}</td>
        `;
        ageGroupTableBody.appendChild(row);
      });
    });
  });
}

// Helper function to filter data by period
function filterByPeriod(data, period, dateField) {
  const today = new Date();
  return data.filter(item => {
    const date = new Date(item[dateField]);
    switch (period) {
      case "day":
        return date.toDateString() === today.toDateString();
      case "week":
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
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

// Helper function to calculate age
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

// Fetch and display summary data on page load
document.addEventListener('DOMContentLoaded', () => {
  if (dbReady) {
    generateSummary(); // Fetch and display summary data
  } else {
    // Wait for the database to initialize
    window.onDatabaseReady = () => {
      generateSummary();
    };
  }
});
