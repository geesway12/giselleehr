let editingPatientId = null;
let customFields = [];

// Calculate Age
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

// Get 3 random characters from string (for facility code)
function getRandomCharacters(str) {
  if (str.length <= 3) return str.toUpperCase();
  const chars = [];
  while (chars.length < 3) {
    const i = Math.floor(Math.random() * str.length);
    if (!chars.includes(i)) chars.push(i);
  }
  return chars.map(i => str[i].toUpperCase()).join('');
}

// Render Patients Table
function renderPatientList() {
  getAllData('patients', data => {
    const tbody = document.getElementById('patientTableBody');
    tbody.innerHTML = ''; // Clear existing rows

    data.forEach(patient => {
      const age = calculateAge(patient.dob);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${patient.patientId}</td>
        <td>${patient.name}</td>
        <td>${formatDateToDDMMYYYY(patient.dob)}</td>
        <td>${age}</td>
        <td>${patient.sex}</td>
        <td>${patient.contact}</td>
        <td>${formatDateToDDMMYYYY(patient.registrationDate || new Date().toISOString())}</td>
        <td>${formatDateToDDMMYYYY(patient.lastUpdated || new Date().toISOString())}</td>
        <td>
          <button class="btn btn-warning btn-sm edit-btn" data-id="${patient.patientId}">Edit</button>
          <button class="btn btn-primary btn-sm add-visit-btn" data-id="${patient.patientId}" data-name="${patient.name}" data-sex="${patient.sex}" data-age="${age}">Add Visit</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Bind edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', e => editPatient(e.target.getAttribute('data-id')));
    });

    // Bind add visit buttons
    document.querySelectorAll('.add-visit-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const patientId = e.target.getAttribute('data-id');
        const patientName = e.target.getAttribute('data-name');
        const patientSex = e.target.getAttribute('data-sex');
        const patientAge = e.target.getAttribute('data-age');

        // Redirect to the Visits form with pre-filled patient details
        window.location.href = `visits.html?patientId=${encodeURIComponent(patientId)}&name=${encodeURIComponent(patientName)}&sex=${encodeURIComponent(patientSex)}&age=${encodeURIComponent(patientAge)}`;
      });
    });
  });
}

// Edit Patient
function editPatient(patientId) {
  getDataByKey('patients', patientId, patient => {
    if (!patient) {
      alert('Patient not found');
      return;
    }

    document.getElementById('facilityName').value = patient.facilityName || '';
    document.getElementById('patientName').value = patient.name || '';
    document.getElementById('dob').value = formatDateToDDMMYYYY(patient.dob || '');
    document.getElementById('age').value = calculateAge(patient.dob);
    document.getElementById('sex').value = patient.sex || '';
    document.getElementById('contact').value = patient.contact || '';
    document.getElementById('registrationDate').value = formatDateToDDMMYYYY(patient.registrationDate || '');

    // Populate custom fields
    const container = document.getElementById('customFieldsContainer');
    container.innerHTML = '';
    Object.entries(patient.customFields || {}).forEach(([key, value]) => {
      container.innerHTML += `
        <div class="form-group custom-field mt-3">
          <input type="text" class="form-control field-name mb-2" value="${key}" required>
          <input type="text" class="form-control field-value" value="${value}" required>
        </div>
      `;
    });

    editingPatientId = patientId;
  });
}

// Export Button
document.getElementById('exportPatientsBtn').onclick = () => {
  getAllData('patients', data => {
    const exportData = data.map(p => {
      const age = calculateAge(p.dob);
      return {
        PatientID: p.patientId,
        FacilityName: p.facilityName,
        Name: p.name,
        DOB: formatDateToDDMMYYYY(p.dob),
        Age: age,
        Sex: p.sex,
        Contact: p.contact,
        RegistrationDate: formatDateToDDMMYYYY(p.registrationDate),
        LastUpdated: formatDateToDDMMYYYY(p.lastUpdated),
        ...p.customFields // Include custom fields
      };
    });

    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Patients');

    // Save the workbook as a file
    XLSX.writeFile(wb, 'Patients.xlsx');
  });
};

// Flatpickr for DOB
flatpickr("#dob", {
  dateFormat: "d-m-Y", // Set to dd-mm-yyyy
  maxDate: "today",
  onChange: (selectedDates, dateStr) => {
    document.getElementById("age").value = calculateAge(selectedDates[0]);
  }
});

// Flatpickr for Date of Registration
flatpickr("#registrationDate", {
  dateFormat: "d-m-Y", // Set to dd-mm-yyyy
  maxDate: "today" // Prevent future dates
});

// Show Add Field Popup
document.getElementById('addFieldBtn').onclick = () => {
  const popup = document.createElement('div');
  popup.classList.add('popup');
  popup.innerHTML = `
    <div class="popup-content">
      <h3>Add Custom Field</h3>
      <form id="customFieldForm">
        <div class="form-group">
          <label>Field Name</label>
          <input type="text" id="fieldName" class="form-control" required>
        </div>
        <div class="form-group">
          <label>Data Type</label>
          <select id="fieldType" class="form-control" required>
            <option value="">Select</option>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="select_one">Select One</option>
            <option value="select_multiple">Select Multiple</option>
            <option value="image">Image</option>
            <option value="file">File</option>
          </select>
        </div>
        <div id="optionsContainer" class="form-group" style="display:none;">
          <label>Options (comma separated)</label>
          <input type="text" id="fieldOptions" class="form-control">
        </div>
        <button class="btn btn-primary mt-3">Add</button>
        <button type="button" class="btn btn-secondary mt-3" id="cancelPopup">Cancel</button>
      </form>
    </div>
  `;
  document.body.appendChild(popup);

  document.getElementById("fieldType").onchange = e => {
    document.getElementById("optionsContainer").style.display = 
      ["select_one", "select_multiple"].includes(e.target.value) ? "block" : "none";
  };

  document.getElementById("customFieldForm").onsubmit = e => {
    e.preventDefault();
    const name = document.getElementById("fieldName").value.trim();
    const type = document.getElementById("fieldType").value;
    const options = document.getElementById("fieldOptions").value.trim();
    if (!name || !type) return alert("Field name and type required.");

    const field = { name, type };
    if (["select_one", "select_multiple"].includes(type)) {
      field.options = options.split(",").map(o => o.trim());
    }

    customFields.push(field);
    renderCustomFields();
    document.body.removeChild(popup);
  };

  document.getElementById("cancelPopup").onclick = () => {
    document.body.removeChild(popup);
  };
};

// Render custom fields in form
function renderCustomFields() {
  const container = document.getElementById('customFieldsContainer');
  container.innerHTML = '';
  customFields.forEach(field => {
    const div = document.createElement('div');
    div.classList.add('form-group', 'custom-field', 'mt-3');

    if (["text", "number", "date"].includes(field.type)) {
      div.innerHTML = `<label>${field.name}</label><input type="${field.type}" class="form-control" name="${field.name}" required>`;
    } else if (field.type === "select_one") {
      div.innerHTML = `
        <label>${field.name}</label>
        <select class="form-control" name="${field.name}" required>
          ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join("")}
        </select>
      `;
    } else if (field.type === "select_multiple") {
      div.innerHTML = `<label>${field.name}</label>` +
        field.options.map(opt => `
          <div class="form-check">
            <input type="checkbox" class="form-check-input" name="${field.name}" value="${opt}">
            <label class="form-check-label">${opt}</label>
          </div>
        `).join("");
    } else if (["image", "file"].includes(field.type)) {
      div.innerHTML = `<label>${field.name}</label><input type="file" class="form-control" name="${field.name}" accept="${field.type === 'image' ? 'image/*' : '*'}">`;
    }

    container.appendChild(div);
  });
}

// Call this function after adding a new custom field
renderCustomFields();

// Initial load
renderPatientList();
renderCustomFields();

// Fetch and display patients on page load
document.addEventListener('DOMContentLoaded', () => {
  const facilityNameField = document.getElementById('facilityName');
  const storedFacilityName = localStorage.getItem('facilityName');

  // Pre-fill Facility Name if it exists in localStorage
  if (storedFacilityName) {
    facilityNameField.value = storedFacilityName;
    facilityNameField.setAttribute('readonly', true);
  }

  document.getElementById('patientForm').onsubmit = e => {
    e.preventDefault();

    const facilityName = facilityNameField.value.trim();
    const registrationDate = document.getElementById('registrationDate').value.trim();
    const name = document.getElementById('patientName').value.trim();
    const dob = document.getElementById('dob').value.trim();
    const sex = document.getElementById('sex').value.trim();
    const contact = document.getElementById('contact').value.trim();

    if (!facilityName || !registrationDate || !name || !dob || !sex || !contact) {
      alert("All fields are required.");
      return;
    }

    if (!/^\d{10}$/.test(contact)) {
      alert("Enter a valid 10-digit contact number.");
      return;
    }

    // Save Facility Name to localStorage if not already saved
    if (!storedFacilityName) {
      localStorage.setItem('facilityName', facilityName);
      facilityNameField.setAttribute('readonly', true);
    }

    const today = new Date().toISOString().split('T')[0];
    const facilityCode = getRandomCharacters(facilityName);
    const registrationYear = new Date(registrationDate).getFullYear().toString().slice(-2);
    const serialNumber = Math.floor(100 + Math.random() * 900);
    const patientId = `${facilityCode}-${serialNumber}-${registrationYear}`;

    const formattedRegistrationDate = registrationDate.split('-').reverse().join('-');
    const formattedDob = dob.split('-').reverse().join('-');

    const patient = {
      patientId,
      facilityName,
      name,
      dob: formattedDob,
      sex,
      contact,
      registrationDate: formattedRegistrationDate,
      lastUpdated: today,
      customFields: {}
    };

    saveData('patients', patient);
    alert('Patient added successfully!');
    document.getElementById('patientForm').reset();
    renderPatientList();
  };

  if (dbReady) {
    renderPatientList(); // Fetch and display patients
  } else {
    // Wait for the database to initialize
    window.onDatabaseReady = () => {
      renderPatientList();
    };
  }
});

function formatDateToDDMMYYYY(dateStr) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}
