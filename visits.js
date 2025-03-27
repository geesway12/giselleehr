// Calculate age from DOB
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

// Helper function to format date as dd-mm-yyyy
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Search patient by ID and display readonly details
function searchPatient() {
  const patientID = document.getElementById("searchPatientID").value.trim();
  if (!patientID) {
    alert("Please enter a Patient ID.");
    return;
  }

  getDataByKey("patients", patientID, patient => {
    if (patient) {
      document.getElementById("hiddenPatientID").value = patientID; // Populate hidden field
      document.getElementById("patientDetails").style.display = "block";
      document.getElementById("displayPatientName").textContent = patient.name || "N/A";
      document.getElementById("displaySex").textContent = patient.sex || "N/A";
      document.getElementById("displayAge").textContent = calculateAge(patient.dob) || "N/A";
      document.getElementById("displayContact").textContent = patient.contact || "N/A";
    } else {
      alert("Patient not found.");
      document.getElementById("patientDetails").style.display = "none";
    }
  });
}

// Save visit
document.getElementById("visitForm").onsubmit = event => {
  event.preventDefault(); // Prevent form submission

  const patientId = document.getElementById("hiddenPatientID").value; // Hidden field for patient ID
  const visitDate = document.getElementById("visitDate").value;
  const reason = document.getElementById("reason").value;
  const notes = document.getElementById("notes").value;
  const history = document.getElementById("history").value;
  const examinationFindings = document.getElementById("examinationFindings").value;
  const investigations = document.getElementById("investigations").value;
  const diagnosis = document.getElementById("diagnosis").value;
  const treatment = document.getElementById("treatment").value;

  // Ensure patientId is populated
  if (!patientId) {
    alert("Patient details are missing. Please search for a patient or select one from the Registered Patients list.");
    return;
  }

  const visitId = `${patientId}-${Date.now().toString().slice(-6)}`; // Generate unique visitId

  const visit = {
    visitId: visitId,
    patientId: patientId,
    visitDate: visitDate,
    reason: reason,
    notes: notes,
    history: history,
    examinationFindings: examinationFindings,
    investigations: investigations,
    diagnosis: diagnosis,
    treatment: treatment,
    customFields: {}
  };

  // Collect custom field values
  const customFieldsContainer = document.getElementById("customFieldsContainer");
  const customFieldInputs = customFieldsContainer.querySelectorAll(".custom-field");
  customFieldInputs.forEach(field => {
    const fieldName = field.querySelector(".field-name").value.trim();
    const fieldValue = field.querySelector(".field-value").value.trim();
    if (fieldName && fieldValue) {
      visit.customFields[fieldName] = fieldValue;
    }
  });

  // Save the visit to the database
  saveData("visits", visit);
  alert("Visit saved successfully for Patient: " + patientId);

  // Clear the form for new entry
  document.getElementById("visitForm").reset();
  renderVisitList(); // Refresh the visit list
};

// Render visit list
function renderVisitList() {
  getAllData("visits", visits => {
    const visitTableBody = document.getElementById("visitTableBody");
    visitTableBody.innerHTML = ""; // Clear existing rows

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
          <td>
            <button class="btn btn-sm btn-secondary">Edit</button>
          </td>
        `;
        visitTableBody.appendChild(row);
      });
    });
  });
}

// Export visits to Excel
document.getElementById("exportVisitsBtn").onclick = () => {
  getAllData("visits", visits => {
    const exportData = visits.map(visit => ({
      VisitID: visit.visitId,
      VisitDate: formatDate(visit.visitDate), // Format date as dd-mm-yyyy
      PatientID: visit.patientId,
      Reason: visit.reason,
      Notes: visit.notes,
      CreatedAt: formatDate(visit.createdAt) // Format createdAt date as dd-mm-yyyy
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Visits");
    XLSX.writeFile(wb, "Visits.xlsx");
  });
};

// Initialize Flatpickr for the Visit Date field
flatpickr("#visitDate", {
  dateFormat: "Y-m-d", // Format as YYYY-MM-DD
  maxDate: "today", // Disable future dates
});

// Pre-fill patient details if query parameters are present
function prefillPatientDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get('patientId');
  const name = urlParams.get('name');
  const sex = urlParams.get('sex');
  const age = urlParams.get('age');

  if (patientId) {
    document.getElementById('hiddenPatientID').value = patientId; // Populate hidden field
    document.getElementById('searchPatientID').value = patientId;
    document.getElementById('displayPatientName').textContent = name || '';
    document.getElementById('displaySex').textContent = sex || '';
    document.getElementById('displayAge').textContent = age || '';
    document.getElementById('patientDetails').style.display = 'block';
  }
}

// Call the function on page load
document.addEventListener('DOMContentLoaded', prefillPatientDetails);

// Initial load
renderVisitList();

// Fetch and display visits on page load
document.addEventListener('DOMContentLoaded', () => {
  if (dbReady) {
    renderVisitList(); // Fetch and display visits
  } else {
    // Wait for the database to initialize
    window.onDatabaseReady = () => {
      renderVisitList();
    };
  }
});
