let currentPatient = null;
let editingVisitId = null;

// 🔍 Search Patient
function searchPatient() {
  const patientId = document.getElementById('searchPatientID').value.trim();
  if (!patientId) return alert('Please enter a Patient ID.');

  getDataByKey('patients', patientId, (patient) => {
    if (!patient) {
      alert('Patient not found.');
      document.getElementById('patientDetails').style.display = 'none';
      return;
    }

    currentPatient = patient;
    document.getElementById('hiddenPatientID').value = patient.patientId;
    document.getElementById('displayPatientName').textContent = patient.name;
    document.getElementById('displaySex').textContent = patient.sex;
    document.getElementById('displayAge').textContent = patient.age;
    document.getElementById('patientDetails').style.display = 'block';
  });
}

// 💾 Save Visit
document.getElementById('visitForm').onsubmit = async (e) => {
  e.preventDefault();

  const patientId = document.getElementById('hiddenPatientID').value;
  const visitDate = document.getElementById('visitDate').value.trim();
  const reason = document.getElementById('reason').value.trim();
  const notes = document.getElementById('notes').value.trim();
  const history = document.getElementById('history').value.trim();
  const findings = document.getElementById('examinationFindings').value.trim();
  const investigations = document.getElementById('investigations').value.trim();
  const diagnosis = document.getElementById('diagnosis').value.trim();
  const treatment = document.getElementById('treatment').value.trim();

  if (!patientId || !visitDate || !reason) {
    alert('Please complete required fields.');
    return;
  }

  const visit = {
    id: editingVisitId || `visit-${Date.now()}`,
    patientId,
    visitDate,
    reason,
    notes,
    history,
    findings,
    investigations,
    diagnosis,
    treatment,
    patientName: currentPatient.name,
    age: currentPatient.age,
    sex: currentPatient.sex,
    createdAt: new Date().toISOString()
  };

  await saveData('visits', visit);
  alert(editingVisitId ? '✅ Visit updated!' : '✅ Visit saved!');

  document.getElementById('visitForm').reset();
  document.getElementById('patientDetails').style.display = 'none';
  currentPatient = null;
  editingVisitId = null;
  renderVisitList();
};

// 📋 Render Visits
function renderVisitList() {
  getAllData('visits', async visits => {
    const tbody = document.getElementById('visitTableBody');
    tbody.innerHTML = '';

    if (visits.length === 0) {
      tbody.innerHTML = `<tr><td colspan="13" class="text-center">No visits found.</td></tr>`;
      return;
    }

    // Sort by date descending
    visits.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

    // Resolve patient names
    const visitRows = await Promise.all(visits.map(visit =>
      new Promise(resolve => {
        getDataByKey('patients', visit.patientId, patient => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${visit.id}</td>
            <td>${visit.visitDate}</td>
            <td>${patient ? patient.name : visit.patientName}</td>
            <td>${patient ? calculateAge(patient.dob) : visit.age}</td>
            <td>${patient ? patient.sex : visit.sex}</td>
            <td>${visit.reason}</td>
            <td>${visit.notes || 'N/A'}</td>
            <td>${visit.history || 'N/A'}</td>
            <td>${visit.findings || 'N/A'}</td>
            <td>${visit.investigations || 'N/A'}</td>
            <td>${visit.diagnosis || 'N/A'}</td>
            <td>${visit.treatment || 'N/A'}</td>
            <td>
              <button class="btn btn-sm btn-warning" onclick="editVisit('${visit.id}')">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteVisit('${visit.id}')">Delete</button>
            </td>
          `;
          resolve(row);
        });
      })
    ));

    visitRows.forEach(row => tbody.appendChild(row));
  });
}

// 📝 Edit Visit
function editVisit(id) {
  getDataByKey('visits', id, visit => {
    if (!visit) return alert('Visit not found.');

    editingVisitId = visit.id;
    getDataByKey('patients', visit.patientId, patient => {
      if (!patient) return alert('Patient not found.');

      currentPatient = patient;

      document.getElementById('searchPatientID').value = patient.patientId;
      document.getElementById('hiddenPatientID').value = patient.patientId;
      document.getElementById('displayPatientName').textContent = patient.name;
      document.getElementById('displaySex').textContent = patient.sex;
      document.getElementById('displayAge').textContent = patient.age;
      document.getElementById('patientDetails').style.display = 'block';

      document.getElementById('visitDate').value = visit.visitDate;
      document.getElementById('reason').value = visit.reason;
      document.getElementById('notes').value = visit.notes;
      document.getElementById('history').value = visit.history;
      document.getElementById('examinationFindings').value = visit.findings;
      document.getElementById('investigations').value = visit.investigations;
      document.getElementById('diagnosis').value = visit.diagnosis;
      document.getElementById('treatment').value = visit.treatment;
    });
  });
}

// ❌ Delete Visit
function deleteVisit(id) {
  if (confirm('Delete this visit?')) {
    deleteData('visits', id, renderVisitList);
  }
}

// 📤 Export
document.getElementById('exportVisitsBtn').onclick = () => {
  getAllData('visits', visits => {
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
  });
};

// 🚀 On Page Load
document.addEventListener('DOMContentLoaded', () => {
  renderVisitList();

  // If redirected from Patients page
  const params = new URLSearchParams(window.location.search);
  const prefillId = params.get('patientId');
  if (prefillId) {
    document.getElementById('searchPatientID').value = prefillId;
    searchPatient();
  }
});

// 🧠 Helper
function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}
