let currentRegister = null;
let currentPatient = null;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(location.search);
  const registerName = params.get('name');
  document.getElementById('registerTitle').textContent = registerName;

  flatpickr('#dateOfService', { dateFormat: 'Y-m-d', maxDate: 'today' });

  // Load register definition
  getAllData('registers', registers => {
    currentRegister = registers.find(r => r.name === registerName);
    if (!currentRegister) {
      alert('Register not found!');
      return;
    }

    renderFields(currentRegister.fields);
    loadEntries();
  });
});

// 🔍 Search patient by ID
function searchPatient() {
  const id = document.getElementById('searchPatientID').value.trim();
  if (!id) return alert('Enter Patient ID');

  getDataByKey('patients', id, patient => {
    if (!patient) return alert('Patient not found.');

    currentPatient = patient;
    document.getElementById('hiddenPatientID').value = patient.patientId;
    document.getElementById('displayPatientName').textContent = patient.name;
    document.getElementById('displaySex').textContent = patient.sex;
    document.getElementById('displayAge').textContent = patient.age;

    document.getElementById('patientDetails').style.display = 'block';
    document.getElementById('dynamicRegisterForm').style.display = 'block';
  });
}

// 🧾 Render fields dynamically
function renderFields(fields) {
  const container = document.getElementById('dynamicFields');
  container.innerHTML = '';

  fields.forEach(field => {
    const div = document.createElement('div');
    div.className = 'form-group mb-3';
    div.innerHTML = `<label>${field.label}</label>`;

    let input = '';
    const nameAttr = `name="${field.label}"`;

    switch (field.type) {
      case 'text':
      case 'number':
        input = `<input type="${field.type}" class="form-control" ${nameAttr}>`;
        break;
      case 'decimal':
        input = `<input type="number" step="any" class="form-control" ${nameAttr}>`;
        break;
      case 'date':
        input = `<input type="date" class="form-control" ${nameAttr}>`;
        break;
      case 'textarea':
        input = `<textarea class="form-control" ${nameAttr}></textarea>`;
        break;
      case 'select_one':
        input = `<select class="form-control" ${nameAttr}>
          <option value="">Select</option>
          ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
        </select>`;
        break;
      case 'multiselect':
        input = field.options.map(opt => `
          <label class="me-3"><input type="checkbox" value="${opt}" name="${field.label}"> ${opt}</label>
        `).join(' ');
        break;
      case 'image':
      case 'file':
        input = `<input type="file" class="form-control" ${nameAttr}>`;
        break;
      default:
        input = `<input type="text" class="form-control" ${nameAttr}>`;
    }

    div.innerHTML += input;
    container.appendChild(div);
  });
}

// 💾 Save new record
document.getElementById('dynamicRegisterForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const patientID = currentPatient?.patientId;
  const dateOfService = document.getElementById('dateOfService').value.trim();
  if (!patientID || !dateOfService) return alert('Please complete patient and date fields.');

  const entry = {
    id: `entry-${Date.now()}`,
    patientID,
    patientName: currentPatient.name,
    sex: currentPatient.sex,
    age: currentPatient.age,
    dateOfService,
    createdAt: new Date().toISOString()
  };

  currentRegister.fields.forEach(field => {
    if (field.type === 'multiselect') {
      const selected = Array.from(document.querySelectorAll(`input[name="${field.label}"]:checked`)).map(cb => cb.value);
      entry[field.label] = selected;
    } else {
      const input = document.querySelector(`[name="${field.label}"]`);
      entry[field.label] = input?.value || '';
    }
  });

  await saveData(`register-${currentRegister.id}`, entry);
  alert('✅ Entry saved!');
  e.target.reset();

  document.getElementById('patientDetails').style.display = 'none';
  document.getElementById('dynamicRegisterForm').style.display = 'none';
  currentPatient = null;
  loadEntries();
});

// 📋 Load table entries
function loadEntries() {
  const head = document.getElementById('registerTableHead');
  const body = document.getElementById('registerTableBody');
  head.innerHTML = '';
  body.innerHTML = '';

  const headers = ['Patient ID', 'Name', 'Sex', 'Age', 'Date of Service', ...currentRegister.fields.map(f => f.label), 'Actions'];
  head.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

  getAllData(`register-${currentRegister.id}`, records => {
    records.reverse().forEach(entry => {
      const row = document.createElement('tr');

      const cells = [
        entry.patientID,
        entry.patientName,
        entry.sex,
        entry.age,
        entry.dateOfService,
        ...currentRegister.fields.map(f =>
          Array.isArray(entry[f.label]) ? entry[f.label].join(', ') : entry[f.label] || ''
        ),
        `<button class="btn btn-sm btn-danger" onclick="deleteEntry('${entry.id}')">Delete</button>`
      ];

      row.innerHTML = cells.map(c => `<td>${c}</td>`).join('');
      body.appendChild(row);
    });
  });
}

// ❌ Delete entry
function deleteEntry(id) {
  if (!confirm('Delete this entry?')) return;
  deleteData(`register-${currentRegister.id}`, id, loadEntries);
}

// 📤 Export to Excel
document.getElementById('exportRegisterBtn').addEventListener('click', () => {
  getAllData(`register-${currentRegister.id}`, records => {
    const data = records.map(r => ({
      PatientID: r.patientID,
      Name: r.patientName,
      Sex: r.sex,
      Age: r.age,
      DateOfService: r.dateOfService,
      ...Object.fromEntries(currentRegister.fields.map(f => [
        f.label,
        Array.isArray(r[f.label]) ? r[f.label].join(', ') : r[f.label] || ''
      ]))
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, currentRegister.name);
    XLSX.writeFile(wb, `${currentRegister.name}.xlsx`);
  });
});
