let currentRegister = null;
let editingEntryId = null;

// Load register by name
function loadRegister() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name');
  if (!name) return;

  document.getElementById("registerTitle").textContent = name;

  getAllData('registers', registers => {
    currentRegister = registers.find(r => r.registerName === name && r.customFields);
    if (currentRegister) {
      renderCustomFields(currentRegister.customFields);
      renderRegisterEntries();
    }
  });
}

// Calculate age
function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

// Render dynamic fields
function renderCustomFields(fields) {
  const container = document.getElementById('customFieldsContainer');
  container.innerHTML = '';

  fields.forEach(field => {
    const div = document.createElement('div');
    div.className = 'form-group custom-field mt-2';

    let input = '';
    if (['text', 'number', 'date'].includes(field.type)) {
      input = `<input type="${field.type}" class="form-control field-value" required>`;
    } else if (field.type === 'select_one') {
      input = `
        <select class="form-select field-value" required>
          ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
        </select>
      `;
    } else if (field.type === 'select_multiple') {
      input = field.options.map(opt => `
        <div class="form-check">
          <input type="checkbox" class="form-check-input" value="${opt}">
          <label class="form-check-label">${opt}</label>
        </div>
      `).join('');
    } else if (field.type === 'file') {
      input = `<input type="file" class="form-control field-value">`;
    }

    div.innerHTML = `<label class="field-name">${field.name}</label>${input}`;
    container.appendChild(div);
  });
}

// Patient search
function searchPatient() {
  const id = document.getElementById("searchPatientID").value.trim();
  if (!id) return alert("Enter Patient ID.");
  getDataByKey("patients", id, patient => {
    if (patient) {
      document.getElementById("hiddenPatientID").value = id;
      document.getElementById("displayPatientName").textContent = patient.name || "N/A";
      document.getElementById("displaySex").textContent = patient.sex || "N/A";
      document.getElementById("displayAge").textContent = calculateAge(patient.dob) || "N/A";
      document.getElementById("patientDetails").style.display = "block";
    } else {
      alert("Patient not found.");
    }
  });
}

// Save entry
document.getElementById('dynamicRegisterForm').onsubmit = event => {
  event.preventDefault();

  const patientId = document.getElementById('hiddenPatientID').value;
  const dateOfService = document.getElementById('dateOfService').value;
  if (!patientId || !dateOfService) return alert("All fields required.");

  const entry = {
    id: editingEntryId || `${patientId}-${Date.now().toString().slice(-6)}`,
    registerName: currentRegister.registerName,
    patientId,
    dateOfService,
    customFields: {}
  };

  document.querySelectorAll('#customFieldsContainer .custom-field').forEach(field => {
    const label = field.querySelector('.field-name').textContent;
    const input = field.querySelector('.field-value');

    if (input) {
      entry.customFields[label] = input.value;
    } else {
      const selected = [];
      field.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.checked) selected.push(cb.value);
      });
      entry.customFields[label] = selected.join(', ');
    }
  });

  saveData('registers', entry);
  alert(editingEntryId ? "Record updated!" : "Saved!");
  document.getElementById('dynamicRegisterForm').reset();
  document.getElementById("patientDetails").style.display = "none";
  editingEntryId = null;
  renderRegisterEntries();
}

// Render list
function renderRegisterEntries(filterDate = '') {
  getAllData('registers', data => {
    const entries = data.filter(d =>
      d.registerName === currentRegister.registerName &&
      d.customFields &&
      (!filterDate || d.dateOfService === filterDate)
    );

    const headerRow = document.getElementById("registerTableHeader");
    const body = document.getElementById("registerTableBody");

    headerRow.innerHTML = `
      <th>Date</th>
      <th>Patient ID</th>
      ${currentRegister.customFields.map(f => `<th>${f.name}</th>`).join('')}
      <th>Actions</th>
    `;

    body.innerHTML = "";
    entries.forEach(entry => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${entry.dateOfService}</td>
        <td>${entry.patientId}</td>
        ${currentRegister.customFields.map(f => `<td>${entry.customFields[f.name] || ''}</td>`).join('')}
        <td>
          <button class="btn btn-sm btn-warning me-1" onclick="editEntry('${entry.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteEntry('${entry.id}')">Delete</button>
        </td>
      `;
      body.appendChild(tr);
    });
  });
}

// Edit entry
function editEntry(entryId) {
  getAllData('registers', data => {
    const entry = data.find(d => d.id === entryId);
    if (!entry) return alert("Not found");

    editingEntryId = entry.id;
    document.getElementById("hiddenPatientID").value = entry.patientId;
    document.getElementById("searchPatientID").value = entry.patientId;
    document.getElementById("dateOfService").value = entry.dateOfService;

    getDataByKey("patients", entry.patientId, p => {
      document.getElementById("displayPatientName").textContent = p.name;
      document.getElementById("displaySex").textContent = p.sex;
      document.getElementById("displayAge").textContent = calculateAge(p.dob);
      document.getElementById("patientDetails").style.display = "block";
    });

    document.querySelectorAll('#customFieldsContainer .custom-field').forEach(field => {
      const label = field.querySelector('.field-name').textContent;
      const input = field.querySelector('.field-value');
      if (input) {
        input.value = entry.customFields[label] || '';
      } else {
        const selected = (entry.customFields[label] || '').split(', ');
        field.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.checked = selected.includes(cb.value);
        });
      }
    });
  });
}

// Delete entry
function deleteEntry(id) {
  if (!confirm("Delete this entry?")) return;
  getAllData('registers', data => {
    const updated = data.filter(d => d.id !== id);
    clearStore('registers');
    updated.forEach(d => saveData('registers', d));
    renderRegisterEntries();
  });
}

// Export to Excel
function exportRegisterEntries() {
  getAllData('registers', data => {
    const entries = data.filter(d => d.registerName === currentRegister.registerName);
    const exportData = entries.map(e => ({
      DateOfService: e.dateOfService,
      PatientID: e.patientId,
      ...e.customFields
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, currentRegister.registerName.replace(/\s/g, '_'));
    XLSX.writeFile(wb, `${currentRegister.registerName}.xlsx`);
  });
}

// Filter by date
document.getElementById('filterDateBtn').onclick = () => {
  const date = document.getElementById('filterDate').value;
  renderRegisterEntries(date);
};

// Init calendar
flatpickr("#dateOfService", {
  dateFormat: "Y-m-d",
  maxDate: "today"
});

// Init
document.getElementById('exportBtn').onclick = exportRegisterEntries;
document.addEventListener('DOMContentLoaded', loadRegister);
