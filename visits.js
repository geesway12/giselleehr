let currentPatient = null;

function searchPatient() {
  const patientId = document.getElementById('searchPatientID').value.trim();
  if (!patientId) {
    alert('Please enter a Patient ID.');
    return;
  }

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
    id: `visit-${Date.now()}`,
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

  alert('✅ Visit saved successfully!');
  document.getElementById('visitForm').reset();
  document.getElementById('patientDetails').style.display = 'none';
  currentPatient = null;
  loadVisits();
};

function loadVisits() {
  getAllData('visits', visits => {
    const tbody = document.getElementById('visitTableBody');
    tbody.innerHTML = '';

    visits.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

    visits.forEach(visit => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${visit.id}</td>
        <td>${visit.visitDate}</td>
        <td>${visit.patientName}</td>
        <td>${visit.age}</td>
        <td>${visit.sex}</td>
        <td>${visit.reason}</td>
        <td>${visit.notes}</td>
        <td>${visit.history}</td>
        <td>${visit.findings}</td>
        <td>${visit.investigations}</td>
        <td>${visit.diagnosis}</td>
        <td>${visit.treatment}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteVisit('${visit.id}')">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  });
}

function deleteVisit(id) {
  if (confirm('Are you sure you want to delete this visit?')) {
    deleteData('visits', id, loadVisits);
  }
}

document.getElementById('exportVisitsBtn').onclick = () => {
  getAllData('visits', visits => {
    const exportData = visits.map(v => ({
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
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Visits');
    XLSX.writeFile(wb, 'Visits.xlsx');
  });
};

// Auto-load visits on page load
document.addEventListener('DOMContentLoaded', () => {
  loadVisits();

  // ✅ If redirected from "Add Visit" button on patients page
  const urlParams = new URLSearchParams(window.location.search);
  const prefillId = urlParams.get('patientId');
  if (prefillId) {
    document.getElementById('searchPatientID').value = prefillId;
    searchPatient(); // Auto-search
  }
});
