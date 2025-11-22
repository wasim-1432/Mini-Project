// ==================== FINAL script.js - 100% WORKING (NO LOGO, NO ERROR) ====================

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM"
];

let selectedSlot = '';
const STORAGE_KEY = 'abul_kalam_hospital_appointments_final';

// Load & Save
function loadAppointments() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveAppointments(apps) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

// Generate Time Slots
function generateSlots() {
  const container = document.getElementById('slots');
  if (!container) return;
  container.innerHTML = '';

  timeSlots.forEach(slot => {
    const btn = document.createElement('div');
    btn.className = 'slot-btn';
    btn.textContent = slot;
    btn.onclick = () => {
      document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedSlot = slot;
    };
    container.appendChild(btn);
  });
}

// Doctor-wise Token Number
function getNextToken(date, doctor) {
  const all = loadAppointments();
  const same = all.filter(a => a.date === date && a.doctor === doctor);
  return same.length + 1;
}

// Display Today's Appointments
function displayTodaysAppointments() {
  const list = document.getElementById('appointmentList');
  list.innerHTML = '';

  const today = new Date().toISOString().split('T')[0];
  const todays = loadAppointments()
    .filter(a => a.date === today)
    .sort((a, b) => a.token - b.token);

  if (todays.length === 0) {
    list.innerHTML = `<div class="empty-state">No appointments for today</div>`;
    return;
  }

  todays.forEach((apt, i) => {
    const card = document.createElement('div');
    card.className = 'appt-item';
    card.style.animationDelay = `${i * 0.1}s`;
    card.innerHTML = `
      <div class="appt-left">
        <div class="appt-info">
          <strong>Token #${apt.token}</strong>
          <div>${escapeHtml(apt.patient)} → <small>${apt.time}</small></div>
          <div style="margin-top:4px 0 0;font-size:14px;color:#64748b;">${escapeHtml(apt.doctor)}</div>
        </div>
      </div>
      <button class="delete-btn" data-id="${apt.id}">Delete</button>
    `;
    list.appendChild(card);
  });
}

// Delete Button (Event Delegation)
document.getElementById('appointmentList').addEventListener('click', function (e) {
  if (e.target && e.target.classList.contains('delete-btn')) {
    const id = Number(e.target.dataset.id);
    if (confirm('Do you want to delete this appointment?')) {
      const apps = loadAppointments().filter(a => a.id !== id);
      saveAppointments(apps);
      displayTodaysAppointments();
    }
  }
});

// Safe HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


function generatePDF(apt) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [100, 150]
  });

  // Header
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 100, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Dr. Abul Kalam Memorial Hospital', 50, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Knowledge Park II, Greater Noida (U.P.)', 50, 25, { align: 'center' });

  // Card
  doc.setFillColor(248, 252, 255);
  doc.roundedRect(8, 40, 84, 100, 10, 10, 'F');

  // Token
  doc.setFontSize(42);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${apt.token}`, 50, 68, { align: 'center' });

  // Doctor
  doc.setFontSize(15);
  doc.text(apt.doctor, 50, 82, { align: 'center' });

  // Line
  doc.setDrawColor(100, 140, 220);
  doc.setLineWidth(0.8);
  doc.line(18, 90, 82, 90);

  // Details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient:', 15, 105);
  doc.text('Date:',    15, 118);
  doc.text('Time:',    15, 131);

  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'normal');
  const shortName = apt.patient.length > 28 ? apt.patient.substring(0,25)+'...' : apt.patient;
  doc.text(shortName, 82, 105, { align: 'right' });
  doc.text(new Date(apt.date).toLocaleDateString('en-IN'), 82, 118, { align: 'right' });

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(apt.time, 82, 131, { align: 'right' });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Please arrive 10 minutes early.', 50, 140, { align: 'center' });

  // Save
  const safeName = (apt.patient.split(' ')[0] || 'Patient').replace(/[^a-zA-Z0-9]/g, '');
  doc.save(`${safeName}_Token${apt.token}.pdf`);
}

// Book Button
document.getElementById('bookBtn').addEventListener('click', () => {
  const doctor = document.getElementById('doctorName').value;
  const patient = document.getElementById('patientName').value.trim();
  const date = document.getElementById('appointmentDate').value;

  if (!patient || !date || !selectedSlot) {
    alert("Please fill in all information and select a time slot!");
    return;
  }

  const token = getNextToken(date, doctor);

  const newApt = {
    id: Date.now(),
    token,
    patient,
    doctor,
    date,
    time: selectedSlot,
    bookedAt: new Date().toISOString()
  };

  const apps = loadAppointments();
  apps.push(newApt);
  saveAppointments(apps);

  generatePDF(newApt);

  // Reset form
  document.getElementById('patientName').value = '';
  selectedSlot = '';
  document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));

  alert(`Booking successful! Token number: #${token}`);

  if (date === new Date().toISOString().split('T')[0]) {
    displayTodaysAppointments();
  }
});

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  generateSlots();
  document.getElementById('appointmentDate').valueAsDate = new Date();
  displayTodaysAppointments();
});