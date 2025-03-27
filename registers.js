// Save new register structure
document.getElementById('createRegisterBtn').onclick = () => {
  const registerName = prompt("Enter Register Name (e.g., ART Register):");
  if (!registerName) return;

  let customFields = [];

  while (confirm("Add a custom field?")) {
    let fieldName = prompt("Enter field name:");
    if (!fieldName) continue;

    let fieldType = prompt("Enter data type (text, number, date, select_one, select_multiple, file):");
    if (!fieldType) continue;

    let options = [];
    if (fieldType === 'select_one' || fieldType === 'select_multiple') {
      let opts = prompt("Enter options (comma-separated):");
      options = opts ? opts.split(',').map(opt => opt.trim()) : [];
    }

    customFields.push({
      name: fieldName,
      type: fieldType,
      options: options
    });
  }

  const register = {
    registerName,
    customFields,
    createdAt: new Date().toISOString()
  };

  saveData('registers', register);
  alert("✅ Register saved: " + registerName);
  renderRegisterButtons();
};

// Render saved registers as buttons
function renderRegisterButtons() {
  getAllData('registers', data => {
    const registerList = document.getElementById('registerList');
    registerList.innerHTML = '';

    if (data.length === 0) {
      registerList.innerHTML = '<p>No registers created yet.</p>';
      return;
    }

    data.forEach(register => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline-primary m-2';
      btn.textContent = register.registerName;
      btn.onclick = () => {
        window.location.href = `register-form.html?name=${encodeURIComponent(register.registerName)}`;
      };
      registerList.appendChild(btn);
    });
  });
}

// Export registers
document.getElementById('exportRegistersBtn').onclick = () => {
  getAllData('registers', data => {
    const exportData = data.map(r => ({
      RegisterName: r.registerName,
      CreatedAt: r.createdAt,
      Fields: r.customFields.map(f => `${f.name} (${f.type})`).join(', ')
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Registers');
    XLSX.writeFile(wb, 'Registers.xlsx');
  });
};

// On load
document.addEventListener('DOMContentLoaded', renderRegisterButtons);
