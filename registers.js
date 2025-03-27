document.getElementById('createRegisterBtn').onclick = () => {
    let register = {
      registerName: prompt("Register Name:"),
      patientId: prompt("Patient ID:"),
      dateOfService: new Date().toISOString().slice(0, 10),
      customFields: {}
    };
  
    while (confirm("Add custom field?")) {
      let fieldName = prompt("Enter custom field name:");
      let fieldValue = prompt(`Enter value for ${fieldName}:`);
      register.customFields[fieldName] = fieldValue;
    }
  
    saveData('registers', register);
    alert('Register Created: ' + register.registerName);
  };
  
  document.getElementById('exportRegistersBtn').onclick = () => {
    getAllData('registers', data => {
      const exportData = data.map(d => ({...d, ...d.customFields}));
      let wb = XLSX.utils.book_new();
      let ws = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Registers');
      XLSX.writeFile(wb, 'Registers.xlsx');
    });
  };