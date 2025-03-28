let customFields = [];
let editingPatientId = null;

const facilityInput = document.getElementById('facilityName');
const savedFacility = localStorage.getItem('facilityName');
if (savedFacility) facilityInput.value = savedFacility;

const addFieldBtn = document.getElementById('addFieldBtn');
addFieldBtn?.addEventListener('click', () => {
  const label = prompt('Enter custom field label:');
  if (!label) return;

  const type = prompt('Enter field type (text, number, textarea, select, multiselect, date, image, file):');
  if (!type) return;

  customFields.push({ label, type });
  renderCustomFields();
});

function renderCustomFields(data = {}) {
  const container = document.getElementById('customFieldsContainer');
  container.innerHTML = '';

  customFields.forEach(field => {
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'form-group';

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
        input = `<select class="form-control" name="${field.label}">
                  <option value="">Select</option>
                  <option value="Option 1"${value === 'Option 1' ? ' selected' : ''}>Option 1</option>
                  <option value="Option 2"${value === 'Option 2' ? ' selected' : ''}>Option 2</option>
                </select>`;
        break;
      case 'multiselect':
        input = `<div>
          <label><input type="checkbox" name="${field.label}" value="Option 1"${value.includes('Option 1') ? ' checked' : ''}> Option 1</label>
          <label><input type="checkbox" name="${field.label}" value="Option 2"${value.includes('Option 2') ? ' checked' : ''}> Option 2</label>
        </div>`;
        break;
      case 'image':
      case 'file':
        input = `<input type="file" class="form-control" name="${field.label}">`;
        break;
    }

    fieldGroup.innerHTML = `<label>${field.label}</label>${input}`;
    container.appendChild(fieldGroup);
  });
}

function generatePatientId(facilityName, date) {
  const prefix = facilityName.trim().substring(0, 3).toUpperCase();
  const year = new Date(date).getFullYear().toString().slice(-2);
  const serial = Math.floor(10000 + Math.random() * 89999);
  return `${prefix}-${serial}-${year}`;
}

const patientForm = document.getElementById('patientForm');
patientForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const facilityName = facilityInput.value.trim();
  const registrationDate = document.getElementById('registrationDate').value.trim();
  const name = document.getElementById('patientName').value.trim();
  const dob = document.getElementById('dob').value.trim();
  const age = document.getElementById('age').value.trim();
  const sex = document.getElementById('sex').value;
  const contact = document.getElementById('contact').value.trim();

  if (!facilityName || !registrationDate || !name || !dob || !sex || !contact) {
    alert('Please fill in all required fields.');
    return;
  }

  localStorage.setItem('facilityName', facilityName);
  const patientId = editingPatientId || generatePatientId(facilityName, registrationDate);
  const updatedAt = new Date().toISOString();

  const customData = {};
  for (const field of customFields) {
    if (field.type === 'multiselect') {
      const checkboxes = document.querySelectorAll(`input[name="${field.label}"]:checked`);
      customData[field.label] = Array.from(checkboxes).map(cb => cb.value).join(', ');
    } else {
      const input = document.querySelector(`[name="${field.label}"]`);
      customData[field.label] = input?.value || '';
    }
  }

  const patient = {
    patientId,
    facilityName,
    registrationDate,
    name,
    dob,
    age,
    sex,
    contact,
    updatedAt,
    customData
  };

  await saveData('patients', patient);
  alert(editingPatientId ? 'Patient updated successfully!' : 'Patient added successfully!');

  e.target.reset();
  customFields = [];
  editingPatientId = null;
  renderCustomFields();
  loadPatients();
});

function loadPatients() {
  getAllData('patients', patients => {
    patients.sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));
    const tbody = document.getElementById('patientTableBody');
    tbody.innerHTML = '';

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
        <td>${patient.updatedAt ? patient.updatedAt.split('T')[0] : ''}</td>
        <td>
          <button class="btn btn-sm btn-info" onclick='editPatient("${patient.patientId}")'>Edit</button>
          <button class="btn btn-sm btn-danger" onclick='deletePatient("${patient.patientId}")'>Delete</button>
          <button class="btn btn-sm btn-success" onclick='redirectToVisit("${patient.patientId}")'>Add Visit</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  });
}

function editPatient(patientId) {
  getDataByKey('patients', patientId, (patient) => {
    if (!patient) return;

    facilityInput.value = patient.facilityName;
    document.getElementById('registrationDate').value = patient.registrationDate;
    document.getElementById('patientName').value = patient.name;
    document.getElementById('dob').value = patient.dob;
    document.getElementById('age').value = patient.age;
    document.getElementById('sex').value = patient.sex;
    document.getElementById('contact').value = patient.contact;

    customFields = Object.keys(patient.customData || {}).map(label => ({ label, type: 'text' }));
    editingPatientId = patientId;
    renderCustomFields(patient.customData || {});
  });
}

function deletePatient(patientId) {
  if (confirm('Are you sure you want to delete this patient?')) {
    deleteData('patients', patientId, loadPatients);
  }
}

// ✅ NEW: Redirect to visits form with patient ID
function redirectToVisit(patientId) {
  window.location.href = `visits.html?patientId=${encodeURIComponent(patientId)}`;
}

const exportBtn = document.getElementById('exportPatientsBtn');
exportBtn?.addEventListener('click', () => {
  getAllData('patients', patients => {
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
  });
});

document.addEventListener('DOMContentLoaded', loadPatients);
