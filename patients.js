let customFields = [];
let editingPatientId = null;

// Facility Name Handling
const facilityInput = document.getElementById('facilityName');
const savedFacility = localStorage.getItem('facilityName');
if (savedFacility) facilityInput.value = savedFacility;

// Custom Field Management
document.getElementById('addFieldBtn')?.addEventListener('click', async () => {
  const label = prompt('Enter custom field label:');
  if (!label) return;

  const type = prompt('Enter field type (text, number, textarea, select, multiselect, date, image, file):');
  if (!type) return;

  try {
    await dbAPI.saveData('field_definitions', { label, type });
    await loadFieldDefinitions();
  } catch (error) {
    alert('Error saving field: ' + error.message);
  }
});

async function loadFieldDefinitions() {
  try {
    customFields = await dbAPI.getAllData('field_definitions');
    renderCustomFields();
  } catch (error) {
    console.error('Error loading field definitions:', error);
  }
}

function renderCustomFields(data = {}) {
  const container = document.getElementById('customFieldsContainer');
  container.innerHTML = '';

  customFields.forEach(field => {
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'form-group mb-3';
    
    const value = data[field.label] || '';
    let input = '';

    switch (field.type) {
      case 'text':
      case 'number':
      case 'date':
        input = `<input type="${field.type}" class="form-control" name="${field.label}" value="${value}">`;
        break;
      case 'textarea':
        input = `<textarea class="form-control" name="${field.label}">${value}</textarea>`;
        break;
      case 'select':
        input = `<select class="form-select" name="${field.label}">
                  <option value="">Select</option>
                  <option value="Option 1"${value === 'Option 1' ? ' selected' : ''}>Option 1</option>
                  <option value="Option 2"${value === 'Option 2' ? ' selected' : ''}>Option 2</option>
                </select>`;
        break;
      case 'multiselect':
        input = `<div class="form-check-group">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" name="${field.label}" 
              value="Option 1"${value.includes('Option 1') ? ' checked' : ''}>
            <label class="form-check-label">Option 1</label>
          </div>
          <div class="form-check">
            <input class="form-check-input" type="checkbox" name="${field.label}" 
              value="Option 2"${value.includes('Option 2') ? ' checked' : ''}>
            <label class="form-check-label">Option 2</label>
          </div>
        </div>`;
        break;
      case 'image':
      case 'file':
        input = `<input type="file" class="form-control" name="${field.label}">`;
        break;
    }

    fieldGroup.innerHTML = `
      <label class="form-label">${field.label}</label>
      ${input}
    `;
    container.appendChild(fieldGroup);
  });
}

// Patient Form Handling
document.getElementById('patientForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const formValues = Object.fromEntries(formData.entries());
  
  if (!validateForm(formValues)) return;

  localStorage.setItem('facilityName', formValues.facilityName);
  
  const patientId = editingPatientId || generatePatientId(
    formValues.facilityName,
    formValues.registrationDate
  );

  const customData = {};
  customFields.forEach(field => {
    if (field.type === 'multiselect') {
      const checkboxes = document.querySelectorAll(`input[name="${field.label}"]:checked`);
      customData[field.label] = Array.from(checkboxes).map(cb => cb.value).join(', ');
    } else {
      customData[field.label] = formValues[field.label] || '';
    }
  });

  const patient = {
    patientId,
    ...formValues,
    customData,
    updatedAt: new Date().toISOString()
  };

  try {
    await dbAPI.saveData('patients', patient);
    alert(editingPatientId ? 'Patient updated!' : 'Patient added!');
    resetForm();
    await loadPatients();
  } catch (error) {
    alert('Error saving patient: ' + error.message);
  }
});

function validateForm(data) {
  const required = ['facilityName', 'registrationDate', 'patientName', 'dob', 'sex', 'contact'];
  const missing = required.filter(field => !data[field]?.trim());
  
  if (missing.length > 0) {
    alert(`Missing required fields: ${missing.join(', ')}`);
    return false;
  }
  return true;
}

function generatePatientId(facilityName, date) {
  const prefix = facilityName.trim().substring(0, 3).toUpperCase();
  const year = new Date(date).getFullYear().toString().slice(-2);
  const serial = Math.floor(10000 + Math.random() * 89999);
  return `${prefix}-${serial}-${year}`;
}

// Patient List Rendering
async function loadPatients() {
  try {
    const patients = await dbAPI.getAllData('patients');
    renderPatientTable(patients);
  } catch (error) {
    console.error('Error loading patients:', error);
    document.getElementById('patientTableBody').innerHTML = `
      <tr><td colspan="9" class="text-danger">Failed to load patients</td></tr>
    `;
  }
}

function renderPatientTable(patients) {
  const tbody = document.getElementById('patientTableBody');
  tbody.innerHTML = '';

  patients.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));
  
  patients.forEach(patient => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${patient.patientId}</td>
      <td>${patient.name}</td>
      <td>${patient.dob}</td>
      <td>${patient.age}</td>
      <td>${patient.sex}</td>
      <td>${patient.contact}</td>
      <td>${patient.registrationDate}</td>
      <td>${patient.updatedAt?.split('T')[0] || ''}</td>
      <td>
        <div class="btn-group gap-2">
          <button class="btn btn-primary btn-lg" onclick="editPatient('${patient.patientId}')">
            <i class="bi bi-pencil me-2"></i>Edit
          </button>
          <button class="btn btn-danger btn-lg" onclick="deletePatient('${patient.patientId}')">
            <i class="bi bi-trash me-2"></i>Delete
          </button>
          <button class="btn btn-success btn-lg" onclick="redirectToVisit('${patient.patientId}')">
            <i class="bi bi-plus-circle me-2"></i>Visit
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Patient Editing
async function editPatient(patientId) {
  try {
    const patient = await dbAPI.getDataByKey('patients', patientId);
    if (!patient) return;

    editingPatientId = patientId;
    document.getElementById('facilityName').value = patient.facilityName;
    document.getElementById('registrationDate').value = patient.registrationDate;
    document.getElementById('patientName').value = patient.name;
    document.getElementById('dob').value = patient.dob;
    document.getElementById('age').value = patient.age;
    document.getElementById('sex').value = patient.sex;
    document.getElementById('contact').value = patient.contact;

    renderCustomFields(patient.customData || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    alert('Error loading patient: ' + error.message);
  }
}

// Patient Deletion
async function deletePatient(patientId) {
  if (!confirm('Permanently delete this patient?')) return;
  
  try {
    await dbAPI.deleteData('patients', patientId);
    await loadPatients();
  } catch (error) {
    alert('Error deleting patient: ' + error.message);
  }
}

// Form Reset
function resetForm() {
  document.getElementById('patientForm').reset();
  editingPatientId = null;
  renderCustomFields();
}

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  await loadFieldDefinitions();
  await loadPatients();
});

// Export Functionality
document.getElementById('exportPatientsBtn')?.addEventListener('click', async () => {
  try {
    const patients = await dbAPI.getAllData('patients');
    const data = patients.map(p => ({
      PatientID: p.patientId,
      Name: p.name,
      DOB: p.dob,
      Age: p.age,
      Sex: p.sex,
      Contact: p.contact,
      RegistrationDate: p.registrationDate,
      UpdatedAt: p.updatedAt,
      ...p.customData
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Patients');
    XLSX.writeFile(wb, 'Patients.xlsx');
  } catch (error) {
    alert('Export failed: ' + error.message);
  }
});

// Visit Redirection
function redirectToVisit(patientId) {
  window.location.href = `visits.html?patientId=${encodeURIComponent(patientId)}`;
}