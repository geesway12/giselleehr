// registers.js
let registerFields = [];
let editingRegisterId = null;
const allowedTypes = ['text', 'number', 'decimal', 'textarea', 'date', 'select_one', 'multiselect', 'image', 'file'];

// 🗄️ Data Storage Functions
function saveData(storeName, data) {
  return new Promise(resolve => {
    const items = JSON.parse(localStorage.getItem(storeName) || '[]');
    const index = items.findIndex(item => item.id === data.id);
    if (index >= 0) items[index] = data;
    else items.push(data);
    localStorage.setItem(storeName, JSON.stringify(items));
    resolve();
  });
}

function getAllData(storeName, callback) {
  const items = JSON.parse(localStorage.getItem(storeName) || '[]');
  callback(items);
}

function getDataByKey(storeName, key, callback) {
  const items = JSON.parse(localStorage.getItem(storeName) || '[]');
  const result = items.find(item => item.id === key);
  callback(result);
}

function deleteData(storeName, key, callback) {
  const items = JSON.parse(localStorage.getItem(storeName) || '[]');
  const filtered = items.filter(item => item.id !== key);
  localStorage.setItem(storeName, JSON.stringify(filtered));
  callback();
}

// ➕ Add Field
function addRegisterField() {
  const label = prompt('Enter field label (e.g., Diagnosis):');
  if (!label) return;

  const type = prompt(`Enter field type (${allowedTypes.join(', ')}):`);
  if (!type || !allowedTypes.includes(type)) {
    alert(`Invalid type. Allowed types: ${allowedTypes.join(', ')}`);
    return;
  }

  const field = { label, type };

  if (['select_one', 'multiselect'].includes(type)) {
    const options = prompt('Enter options separated by commas (e.g. Yes,No,Maybe):');
    field.options = options ? options.split(',').map(opt => opt.trim()) : [];
  }

  registerFields.push(field);
  renderFields();
}

// ✂️ Remove Field
function removeField(index) {
  registerFields.splice(index, 1);
  renderFields();
}

// 🔄 Render Fields
function renderFields() {
  const container = document.getElementById('fieldsContainer');
  container.innerHTML = '';
  
  registerFields.forEach((field, index) => {
    const div = document.createElement('div');
    div.className = 'border rounded p-2 mb-2 bg-light d-flex justify-content-between align-items-center';
    div.innerHTML = `
      <div>
        <strong>${field.label}</strong> (${field.type})
        ${field.options ? '– Options: ' + field.options.join(', ') : ''}
      </div>
      <button class="btn btn-sm btn-danger" onclick="removeField(${index})">
        Delete
      </button>
    `;
    container.appendChild(div);
  });
}

// 💾 Save/Update Register
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('registerName').value.trim();
  if (!name || registerFields.length === 0) {
    alert('Please enter a name and add at least one field.');
    return;
  }

  const allRegisters = await new Promise(resolve => getAllData('registers', resolve));
  const duplicate = allRegisters.some(reg => 
    reg.name.toLowerCase() === name.toLowerCase() && reg.id !== editingRegisterId
  );

  if (duplicate) {
    alert('A register with this name already exists.');
    return;
  }

  const register = {
    id: editingRegisterId || `register-${Date.now()}`,
    name,
    fields: registerFields,
    createdAt: new Date().toISOString()
  };

  await saveData('registers', register);
  alert(editingRegisterId ? '✅ Register updated!' : '✅ Register created!');
  resetFormAndCloseModal();
  renderRegisters();
});

// ✏️ Edit Register
function editRegister(id) {
  getDataByKey('registers', id, reg => {
    if (!reg) return;

    editingRegisterId = reg.id;
    registerFields = [...reg.fields];
    document.getElementById('registerName').value = reg.name;
    renderFields();

    new bootstrap.Modal(document.getElementById('registerModal')).show();
  });
}

// ❌ Delete Register
function deleteRegister(id) {
  if (!confirm('Permanently delete this register?')) return;
  deleteData('registers', id, () => {
    alert('✅ Register deleted.');
    renderRegisters();
  });
}

// 🔗 Open Register Form
function openRegisterForm(name) {
  window.location.href = `register-form.html?name=${encodeURIComponent(name)}`;
}

// 🧹 Reset Form
function resetFormAndCloseModal() {
  registerFields = [];
  editingRegisterId = null;
  document.getElementById('registerForm').reset();
  document.getElementById('fieldsContainer').innerHTML = '';
  
  const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
  if (modal) modal.hide();
}

// 📜 Render Register List
function renderRegisters() {
  const container = document.getElementById('registerList');
  container.innerHTML = '<div class="spinner-border"></div>';

  getAllData('registers', registers => {
    container.innerHTML = '';
    
    if (!registers.length) {
      container.innerHTML = '<p class="text-muted">No registers found.</p>';
      return;
    }

    registers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    registers.forEach(reg => {
      const card = document.createElement('div');
      card.className = 'card mb-3';
      card.innerHTML = `
        <div class="card-body d-flex justify-content-between align-items-center">
          <div>
            <h5 class="card-title">${reg.name}</h5>
            <small class="text-muted">
              ${reg.fields.length} fields · 
              Created: ${new Date(reg.createdAt).toLocaleDateString()}
            </small>
          </div>
          <div>
            <button class="btn btn-sm btn-outline-primary me-2" 
              onclick="openRegisterForm('${reg.name}')">Open</button>
            <button class="btn btn-sm btn-outline-info me-2" 
              onclick="editRegister('${reg.id}')">Edit</button>
            <button class="btn btn-sm btn-outline-danger" 
              onclick="deleteRegister('${reg.id}')">Delete</button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  });
}

// 🚀 Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderRegisters();
  
  // Handle modal close
  const modalEl = document.getElementById('registerModal');
  if (modalEl) {
    modalEl.addEventListener('hidden.bs.modal', resetFormAndCloseModal);
  }
});