let currentPatient = null;
let editingVisitId = null;

// 🔍 Search Patient
async function searchPatient() {
  const patientId = document.getElementById('searchPatientID').value.trim();
  if (!patientId) return alert('Please enter a Patient ID.');

  try {
    const patient = await dbAPI.getDataByKey('patients', patientId);
    if (!patient) {
      alert('Patient not found.');
      document.getElementById('patientDetails').style.display = 'none';
      return;
    }

    currentPatient = patient;
    document.getElementById('hiddenPatientID').value = patient.patientId;
    document.getElementById('displayPatientName').textContent = patient.name;
    document.getElementById('displaySex').textContent = patient.sex;
    document.getElementById('displayAge').textContent = calculateAge(patient.dob);
    document.getElementById('patientDetails').style.display = 'block';
  } catch (error) {
    alert('Error searching patient: ' + error.message);
  }
}

// 💾 Save Visit
document.getElementById('visitForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentPatient) return alert('No patient selected.');

  const formData = {
    visitDate: document.getElementById('visitDate').value.trim(),
    reason: document.getElementById('reason').value.trim(),
    notes: document.getElementById('notes').value.trim(),
    history: document.getElementById('history').value.trim(),
    findings: document.getElementById('examinationFindings').value.trim(),
    investigations: document.getElementById('investigations').value.trim(),
    diagnosis: document.getElementById('diagnosis').value.trim(),
    treatment: document.getElementById('treatment').value.trim()
  };

  if (!formData.visitDate || !formData.reason) {
    return alert('Visit date and reason are required.');
  }

  try {
    const visit = {
      id: editingVisitId || `visit-${Date.now()}`,
      patientId: currentPatient.patientId,
      ...formData,
      patientName: currentPatient.name,
      age: currentPatient.age,
      sex: currentPatient.sex,
      createdAt: new Date().toISOString()
    };

    await dbAPI.saveData('visits', visit);
    alert(editingVisitId ? '✅ Visit updated!' : '✅ Visit saved!');

    resetForm();
    await renderVisitList();
  } catch (error) {
    alert('Error saving visit: ' + error.message);
  }
});

// 📋 Render Visits
async function renderVisitList() {
  try {
    const tbody = document.getElementById('visitTableBody');
    tbody.innerHTML = '<tr><td colspan="13">Loading visits...</td></tr>';

    const visits = await dbAPI.getAllData('visits');
    if (!visits.length) {
      tbody.innerHTML = '<tr><td colspan="13" class="text-center">No visits found.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    visits.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

    for (const visit of visits) {
      const patient = await dbAPI.getDataByKey('patients', visit.patientId);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${visit.id}</td>
        <td>${visit.visitDate}</td>
        <td>${patient?.name || visit.patientName}</td>
        <td>${patient ? calculateAge(patient.dob) : visit.age}</td>
        <td>${patient?.sex || visit.sex}</td>
        <td>${visit.reason}</td>
        <td>${visit.notes || 'N/A'}</td>
        <td>${visit.history || 'N/A'}</td>
        <td>${visit.findings || 'N/A'}</td>
        <td>${visit.investigations || 'N/A'}</td>
        <td>${visit.diagnosis || 'N/A'}</td>
        <td>${visit.treatment || 'N/A'}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editVisit('${visit.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteVisit('${visit.id}')">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    }
  } catch (error) {
    console.error('Error loading visits:', error);
    tbody.innerHTML = '<tr><td colspan="13" class="text-danger">Error loading visits</td></tr>';
  }
}

// 📝 Edit Visit
async function editVisit(id) {
  try {
    const visit = await dbAPI.getDataByKey('visits', id);
    if (!visit) return alert('Visit not found.');

    const patient = await dbAPI.getDataByKey('patients', visit.patientId);
    if (!patient) return alert('Patient not found.');

    currentPatient = patient;
    editingVisitId = visit.id;

    // Update UI
    document.getElementById('searchPatientID').value = patient.patientId;
    document.getElementById('hiddenPatientID').value = patient.patientId;
    document.getElementById('displayPatientName').textContent = patient.name;
    document.getElementById('displaySex').textContent = patient.sex;
    document.getElementById('displayAge').textContent = calculateAge(patient.dob);
    document.getElementById('patientDetails').style.display = 'block';

    // Populate form fields
    document.getElementById('visitDate').value = visit.visitDate;
    document.getElementById('reason').value = visit.reason;
    document.getElementById('notes').value = visit.notes;
    document.getElementById('history').value = visit.history;
    document.getElementById('examinationFindings').value = visit.findings;
    document.getElementById('investigations').value = visit.investigations;
    document.getElementById('diagnosis').value = visit.diagnosis;
    document.getElementById('treatment').value = visit.treatment;

  } catch (error) {
    alert('Error editing visit: ' + error.message);
  }
}

// ❌ Delete Visit
async function deleteVisit(id) {
  if (!confirm('Delete this visit permanently?')) return;
  
  try {
    await dbAPI.deleteData('visits', id);
    await renderVisitList();
  } catch (error) {
    alert('Error deleting visit: ' + error.message);
  }
}

// 📤 Export
document.getElementById('exportVisitsBtn')?.addEventListener('click', async () => {
  try {
    const visits = await dbAPI.getAllData('visits');
    const data = visits.map(v => ({
      VisitID: v.id,
      VisitDate: v.visitDate,
      PatientName: v.patientName,
      Age: v.age,
      Sex: v.sex,
      Reason: v.reason,
      Notes: v.notes,
      History: v.history,
      Findings: v.findings,
      Investigations: v.investigations,
      Diagnosis: v.diagnosis,
      Treatment: v.treatment
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Visits');
    XLSX.writeFile(wb, 'Visits.xlsx');
  } catch (error) {
    alert('Export failed: ' + error.message);
  }
});

// 🚀 Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Prefill patient if coming from patients page
  const params = new URLSearchParams(window.location.search);
  const patientId = params.get('patientId');
  
  if (patientId) {
    try {
      document.getElementById('searchPatientID').value = patientId;
      const patient = await dbAPI.getDataByKey('patients', patientId);
      if (patient) {
        currentPatient = patient;
        document.getElementById('hiddenPatientID').value = patient.patientId;
        document.getElementById('displayPatientName').textContent = patient.name;
        document.getElementById('displaySex').textContent = patient.sex;
        document.getElementById('displayAge').textContent = calculateAge(patient.dob);
        document.getElementById('patientDetails').style.display = 'block';
      }
    } catch (error) {
      console.error('Error loading patient:', error);
    }
  }

  await renderVisitList();
});

// 🧠 Helpers
function calculateAge(dob) {
  try {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch {
    return 'N/A';
  }
}

function resetForm() {
  document.getElementById('visitForm').reset();
  document.getElementById('patientDetails').style.display = 'none';
  currentPatient = null;
  editingVisitId = null;
}