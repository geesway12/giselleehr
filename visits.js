// ✅ Calculate age from DOB
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

// ✅ Format date as DD-MM-YYYY
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// ✅ Search patient by ID and display details
function searchPatient() {
  const patientID = document.getElementById("searchPatientID").value.trim();
  if (!patientID) {
    alert("Please enter a Patient ID.");
    return;
  }

  getDataByKey("patients", patientID, patient => {
    if (patient) {
      document.getElementById("hiddenPatientID").value = patientID;
      document.getElementById("patientDetails").style.display = "block";
      document.getElementById("displayPatientName").textContent = patient.name || "N/A";
      document.getElementById("displaySex").textContent = patient.sex || "N/A";
      document.getElementById("displayAge").textContent = calculateAge(patient.dob) || "N/A";
    } else {
      alert("Patient not found.");
      document.getElementById("patientDetails").style.display = "none";
    }
  });
}

// ✅ Save Visit
function handleVisitFormSubmit(event) {
  event.preventDefault();

  const patientId = document.getElementById("hiddenPatientID").value;
  if (!patientId) {
    alert("Patient details are missing. Please search for a patient.");
    return;
  }

  const visit = {
    visitId: `${patientId}-${Date.now().toString().slice(-6)}`,
    patientId,
    visitDate: document.getElementById("visitDate").value,
    reason: document.getElementById("reason").value,
    notes: document.getElementById("notes").value,
    history: document.getElementById("history").value,
    examinationFindings: document.getElementById("examinationFindings").value,
    investigations: document.getElementById("investigations").value,
    diagnosis: document.getElementById("diagnosis").value,
    treatment: document.getElementById("treatment").value,
    createdAt: new Date().toISOString(),
    customFields: {}
  };

  const customFieldInputs = document.querySelectorAll("#customFieldsContainer .custom-field");
  customFieldInputs.forEach(field => {
    const fieldName = field.querySelector(".field-name").value.trim();
    const fieldValue = field.querySelector(".field-value").value.trim();
    if (fieldName && fieldValue) {
      visit.customFields[fieldName] = fieldValue;
    }
  });

  saveData("visits", visit);
  alert("Visit saved successfully!");

  document.getElementById("visitForm").reset();
  document.getElementById("patientDetails").style.display = "none";
  renderVisitList();
}

// ✅ Render Visit List
function renderVisitList() {
  getAllData("visits", visits => {
    const visitTableBody = document.getElementById("visitTableBody");
    visitTableBody.innerHTML = "";

    visits.forEach(visit => {
      getDataByKey("patients", visit.patientId, patient => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${visit.visitId}</td>
          <td>${formatDate(visit.visitDate)}</td>
          <td>${patient ? patient.name : "Unknown"}</td>
          <td>${visit.reason}</td>
          <td>${visit.notes}</td>
          <td>${visit.history || "N/A"}</td>
          <td>${visit.examinationFindings || "N/A"}</td>
          <td>${visit.investigations || "N/A"}</td>
          <td>${visit.diagnosis || "N/A"}</td>
          <td>${visit.treatment || "N/A"}</td>
          <td><button class="btn btn-sm btn-secondary">Edit</button></td>
        `;
        visitTableBody.appendChild(row);
      });
    });
  });
}

// ✅ Export Visits to Excel
function exportVisitsToExcel() {
  getAllData("visits", visits => {
    const exportData = visits.map(visit => ({
      VisitID: visit.visitId,
      VisitDate: formatDate(visit.visitDate),
      PatientID: visit.patientId,
      Reason: visit.reason,
      Notes: visit.notes,
      History: visit.history || "N/A",
      ExaminationFindings: visit.examinationFindings || "N/A",
      Investigations: visit.investigations || "N/A",
      Diagnosis: visit.diagnosis || "N/A",
      Treatment: visit.treatment || "N/A",
      CreatedAt: formatDate(visit.createdAt)
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Visits");
    XLSX.writeFile(wb, "Visits.xlsx");
  });
}

// ✅ Pre-fill from query parameters
function prefillPatientDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get('patientId');

  if (patientId) {
    document.getElementById("hiddenPatientID").value = patientId;
    document.getElementById("searchPatientID").value = patientId;

    getDataByKey("patients", patientId, patient => {
      if (patient) {
        document.getElementById("displayPatientName").textContent = patient.name || "";
        document.getElementById("displaySex").textContent = patient.sex || "";
        document.getElementById("displayAge").textContent = calculateAge(patient.dob);
        document.getElementById("patientDetails").style.display = "block";
      }
    });
  }
}

// ✅ Initialize App
function initializeVisitModule() {
  flatpickr("#visitDate", {
    dateFormat: "Y-m-d",
    maxDate: "today"
  });

  document.getElementById("visitForm").addEventListener("submit", handleVisitFormSubmit);
  document.getElementById("exportVisitsBtn").addEventListener("click", exportVisitsToExcel);
  prefillPatientDetails();
  renderVisitList();
}

// ✅ Wait for DB to be ready
if (typeof dbReady !== "undefined" && dbReady) {
  initializeVisitModule();
} else {
  window.onDatabaseReady = () => {
    initializeVisitModule();
  };
}
