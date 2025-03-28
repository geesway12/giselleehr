// Create new register
document.getElementById('createRegisterBtn').onclick = async () => {
  const registerId = prompt("Enter Register ID (e.g., HTC, ART):");
  if (!registerId) return;

  const registerName = prompt("Enter Register Name (e.g., HIV Testing Register):");
  if (!registerName) return;

  let customFields = [];

  while (confirm("Add a custom field?")) {
    let name = prompt("Enter field name (e.g., HIV Status):");
    if (!name) continue;

    let type = prompt("Enter data type (text, number, date, select_one, select_multiple, textarea):");
    if (!type) continue;

    let convertedType = type === 'select_one' ? 'select'
                      : type === 'select_multiple' ? 'checkbox'
                      : type;

    let options = [];
    if (convertedType === 'select' || convertedType === 'checkbox') {
      let opts = prompt("Enter options (comma-separated):");
      options = opts ? opts.split(',').map(opt => opt.trim()) : [];
    }

    customFields.push({
      name: name.toLowerCase().replace(/\s+/g, '_'),
      label: name,
      type: convertedType,
      options: options
    });
  }

  const register = {
    id: registerId,
    name: registerName,
    fields: customFields,
    createdAt: new Date().toISOString()
  };

  const db = await getDB();
  await db.put('registers', register, registerId);
  alert(`✅ Register "${registerName}" saved.`);
  renderRegisterButtons();
};

// Render register buttons
async function renderRegisterButtons() {
  const db = await getDB();
  const registers = await db.getAll('registers');

  const container = document.getElementById('registerList');
  container.innerHTML = '';

  if (!registers.length) {
    container.innerHTML = '<p>No registers created yet.</p>';
    return;
  }

  registers.forEach(r => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-outline-primary';
    btn.textContent = r.name;
    btn.onclick = () => {
      window.location.href = `register-form.html?registerId=${encodeURIComponent(r.id)}`;
    };
    container.appendChild(btn);
  });
}

// Export registers
document.getElementById('exportRegistersBtn').onclick = async () => {
  const db = await getDB();
  const registers = await db.getAll('registers');

  const exportData = registers.map(r => ({
    RegisterID: r.id,
    RegisterName: r.name,
    CreatedAt: r.createdAt,
    Fields: r.fields.map(f => `${f.label} (${f.type})`).join(', ')
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, 'Registers');
  XLSX.writeFile(wb, 'Registers.xlsx');
};

// Load on page ready
document.addEventListener('DOMContentLoaded', renderRegisterButtons);
