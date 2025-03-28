let currentRegisterId = '';
let registerFields = [];

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  currentRegisterId = params.get('registerId');

  if (!currentRegisterId) {
    alert("No register ID found.");
    return;
  }

  document.title = `Register: ${currentRegisterId}`;
  document.getElementById('registerTitle').innerText = `${currentRegisterId} Register`;

  loadRegisterFields();
  loadRegisterRecords();

  document.getElementById('dynamicRegisterForm').addEventListener('submit', saveRegisterEntry);
  document.getElementById('filterDateBtn').addEventListener('click', loadRegisterRecords);
  document.getElementById('exportBtn').addEventListener('click', exportToExcel);
});

async function loadRegisterFields() {
  const db = await getDB();
  const register = await db.get('registers', currentRegisterId);
  registerFields = register?.fields || [];

  const container = document.getElementById('customFieldsContainer');
  container.innerHTML = '';

  registerFields.forEach(field => {
    const div = document.createElement('div');
    div.className = 'form-group mb-3';

    const label = document.createElement('label');
    label.textContent = field.label;
    div.appendChild(label);

    let input;
    switch (field.type) {
      case 'text':
      case 'number':
      case 'date':
        input = document.createElement('input');
        input.type = field.type;
        break;
      case 'textarea':
        input = document.createElement('textarea');
        break;
      case 'select':
        input = document.createElement('select');
        field.options?.forEach(opt => {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          input.appendChild(option);
        });
        break;
      case 'checkbox':
        input = document.createElement('div');
        field.options?.forEach(opt => {
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.name = field.name;
          checkbox.value = opt;
          checkbox.classList.add('form-check-input', 'me-1');
          const label = document.createElement('label');
          label.classList.add('me-3');
          label.appendChild(checkbox);
          label.appendChild(document.createTextNode(opt));
          input.appendChild(label);
        });
        break;
    }

    input.id = field.name;
    input.classList.add('form-control');
    div.appendChild(input);
    container.appendChild(div);
  });
}

async function searchPatient() {
  const patientID = document.getElementById('searchPatientID').value.trim();
  if (!patientID) return alert("Please enter a Patient ID.");

  const db = await getDB();
  const patient = await db.get('patients', patientID);
  if (!patient) return alert("Patient not found.");

  document.getElementById('displayPatientName').innerText = patient.patientName;
  document.getElementById('displaySex').innerText = patient.sex;
  document.getElementById('displayAge').innerText = patient.age;
  document.getElementById('hiddenPatientID').value = patientID;
  document.getElementById('patientDetails').style.display = 'block';
}

async function saveRegisterEntry(e) {
  e.preventDefault();
  const patientID = document.getElementById('hiddenPatientID').value;
  const dateOfService = document.getElementById('dateOfService').value;
  if (!patientID || !dateOfService) return alert("Patient and Date of Service are required.");

  const record = {
    patientID,
    dateOfService,
    timestamp: new Date().toISOString()
  };

  registerFields.forEach(field => {
    const el = document.getElementById(field.name);
    if (field.type === 'checkbox') {
      const checkboxes = el.querySelectorAll('input[type="checkbox"]:checked');
      record[field.name] = Array.from(checkboxes).map(cb => cb.value);
    } else {
      record[field.name] = el.value;
    }
  });

  const db = await getDB();
  const key = `${currentRegisterId}-${Date.now()}`;
  await db.put(`register-${currentRegisterId}`, record, key);

  alert("Record saved.");
  document.getElementById('dynamicRegisterForm').reset();
  document.getElementById('patientDetails').style.display = 'none';
  loadRegisterRecords();
}

async function loadRegisterRecords() {
  const db = await getDB();
  const all = await db.getAll(`register-${currentRegisterId}`);
  const filterDate = document.getElementById('filterDate').value;
  const tbody = document.getElementById('registerTableBody');
  const thead = document.getElementById('registerTableHeader');

  tbody.innerHTML = '';
  thead.innerHTML = '';

  const columns = ['patientID', 'dateOfService', ...registerFields.map(f => f.name)];

  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.replace(/([A-Z])/g, ' $1');
    thead.appendChild(th);
  });

  const filtered = filterDate ? all.filter(r => r.dateOfService === filterDate) : all;

  filtered.forEach(entry => {
    const tr = document.createElement('tr');
    columns.forEach(col => {
      const td = document.createElement('td');
      const val = entry[col];
      td.textContent = Array.isArray(val) ? val.join(', ') : val || '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function exportToExcel() {
  const wb = XLSX.utils.book_new();
  const table = document.querySelector("table");
  const ws = XLSX.utils.table_to_sheet(table);
  XLSX.utils.book_append_sheet(wb, ws, "RegisterRecords");
  XLSX.writeFile(wb, `${currentRegisterId}-records.xlsx`);
}
