let registerFields = [];
let editingRegisterId = null;

// 🚀 Add a new field
function addRegisterField() {
  const container = document.getElementById('fieldsContainer');

  const label = prompt('Enter field label (e.g., Diagnosis):');
  if (!label) return;

  const type = prompt('Enter field type:\n(text, number, decimal, textarea, date, select_one, multiselect, image, file)');
  if (!type) return;

  const field = { label, type };

  if (type === 'select_one' || type === 'multiselect') {
    const options = prompt('Enter options separated by commas (e.g. Yes,No,Maybe):');
    field.options = options ? options.split(',').map(opt => opt.trim()) : [];
  }

  registerFields.push(field);

  const fieldDisplay = document.createElement('div');
  fieldDisplay.className = 'border rounded p-2 mb-2 bg-light';
  fieldDisplay.innerHTML = `<strong>${label}</strong> (${type}) ${field.options ? '- Options: ' + field.options.join(', ') : ''}`;
  container.appendChild(fieldDisplay);
}

// 🧾 Save register
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nameInput = document.getElementById('registerName');
  const name = nameInput.value.trim();

  if (!name) return alert('Register name is required.');
  if (registerFields.length === 0) return alert('Add at least one field.');

  const allRegisters = await new Promise(resolve => getAllData('registers', resolve));

  const nameExists = allRegisters.some(reg => reg.name.toLowerCase() === name.toLowerCase() && reg.id !== editingRegisterId);
  if (nameExists) return alert('❌ A register with that name already exists.');

  const register = {
    id: editingRegisterId || `register-${Date.now()}`,
    name,
    createdAt: new Date().toISOString(),
    fields: registerFields
  };

  await saveData('registers', register);
  alert(editingRegisterId ? '✅ Register updated!' : '✅ Register created!');

  // Reset modal + state
  registerFields = [];
  nameInput.value = '';
  document.getElementById('fieldsContainer').innerHTML = '';
  editingRegisterId = null;

  const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
  modal?.hide();

  renderRegisters();
});

// 📋 Load registers into vertical list
function renderRegisters() {
  const list = document.getElementById('registerList');
  if (!list) return;
  list.innerHTML = '';

  getAllData('registers', registers => {
    if (!registers || registers.length === 0) {
      list.innerHTML = '<p class="text-muted">No registers available.</p>';
      return;
    }

    registers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    registers.forEach(register => {
      const card = document.createElement('div');
      card.className = 'card mb-3';

      card.innerHTML = `
        <div class="card-body d-flex justify-content-between align-items-center">
          <div>
            <h5 class="card-title mb-1">${register.name}</h5>
            <small class="text-muted">Created: ${new Date(register.createdAt).toLocaleDateString()}</small><br>
            <small class="text-muted">${register.fields?.length || 0} fields</small>
          </div>
          <div>
            <button class="btn btn-sm btn-outline-primary me-2" onclick="openRegisterForm('${register.name}')">Open</button>
            <button class="btn btn-sm btn-info me-2" onclick="editRegister('${register.id}')">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteRegister('${register.id}')">Delete</button>
          </div>
        </div>
      `;
      list.appendChild(card);
    });
  });
}

// 📝 Edit existing register
function editRegister(id) {
  getDataByKey('registers', id, register => {
    if (!register) return;

    editingRegisterId = register.id;
    document.getElementById('registerName').value = register.name;
    registerFields = register.fields || [];

    const container = document.getElementById('fieldsContainer');
    container.innerHTML = '';
    registerFields.forEach(field => {
      const div = document.createElement('div');
      div.className = 'border rounded p-2 mb-2 bg-light';
      div.innerHTML = `<strong>${field.label}</strong> (${field.type}) ${field.options ? '- Options: ' + field.options.join(', ') : ''}`;
      container.appendChild(div);
    });

    const modal = new bootstrap.Modal(document.getElementById('registerModal'));
    modal.show();
  });
}

// ❌ Delete a register
function deleteRegister(id) {
  if (!confirm('Delete this register?')) return;
  deleteData('registers', id, renderRegisters);
}

// 🔗 Open the register's form page
function openRegisterForm(name) {
  window.location.href = `register-form.html?name=${encodeURIComponent(name)}`;
}

// ▶️ Initialize
document.addEventListener('DOMContentLoaded', renderRegisters);
