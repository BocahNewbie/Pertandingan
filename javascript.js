// Database Sederhana dengan LocalStorage
let matchesData = JSON.parse(localStorage.getItem('turnamen_data')) || {
  SF1: { id: 'SF1', tim1: 'Tim A', tim2: 'Tim B', tanggal: 'Sabtu, 10 Okt - 15:00', status: 'Mendatang', skor1: 0, skor2: 0 },
  SF2: { id: 'SF2', tim1: 'Tim C', tim2: 'Tim D', tanggal: 'Sabtu, 10 Okt - 17:00', status: 'Mendatang', skor1: 0, skor2: 0 },
  F:   { id: 'F',   tim1: 'Pemenang SF1', tim2: 'Pemenang SF2', tanggal: 'Minggu, 11 Okt - 19:00', status: 'Mendatang', skor1: 0, skor2: 0 }
};

let isAdminLoggedIn = false;

// Fungsi Navigasi Tab
function openTab(evt, tabName) {
  const contents = document.querySelectorAll('.tab-content');
  contents.forEach(c => c.classList.remove('active'));

  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });

  document.getElementById(tabName).classList.add('active');
  evt.currentTarget.classList.add('active');
  evt.currentTarget.setAttribute('aria-selected', 'true');

  renderUI();
}

// Toggle Tampilan Panel Admin
function toggleAdminPanel() {
  const panel = document.getElementById('admin-panel');
  const btn = document.getElementById('admin-toggle-btn');
  
  if (!isAdminLoggedIn) {
    let pin = prompt("Masukkan PIN Admin (Contoh: 1234):");
    if (pin === "1234") {
      isAdminLoggedIn = true;
      panel.style.display = 'block';
      btn.innerText = '🔓 Tutup Panel Admin';
      btn.style.background = '#c0392b';
    } else if (pin !== null) {
      alert("PIN Salah!");
    }
  } else {
    isAdminLoggedIn = false;
    panel.style.display = 'none';
    btn.innerText = '🔒 Login Admin';
    btn.style.background = '';
  }
}

// Menampilkan/Menyembunyikan Input Skor berdasarkan Status
function toggleScoreInput() {
  const status = document.getElementById('admin-status').value;
  const skorArea = document.getElementById('skor-input-area');
  if (status === 'Live' || status === 'Selesai') {
    skorArea.style.display = 'flex';
  } else {
    skorArea.style.display = 'none';
  }
}

// Mengisi Form Admin saat Pertandingan Dipilih
function onMatchSelectChange() {
  const matchId = document.getElementById('match-select').value;
  if (!matchId) return;

  const match = matchesData[matchId];
  document.getElementById('admin-tim1').value = match.tim1;
  document.getElementById('admin-tim2').value = match.tim2;
  document.getElementById('admin-tanggal').value = match.tanggal;
  document.getElementById('admin-status').value = match.status;
  document.getElementById('admin-skor1').value = match.skor1;
  document.getElementById('admin-skor2').value = match.skor2;
  
  toggleScoreInput();
}

// Menyimpan Perubahan Data Admin
function saveMatchData() {
  const matchId = document.getElementById('match-select').value;
  if (!matchId) {
    alert("Silakan pilih pertandingan terlebih dahulu!");
    return;
  }

  matchesData[matchId] = {
    id: matchId,
    tim1: document.getElementById('admin-tim1').value || 'Tim X',
    tim2: document.getElementById('admin-tim2').value || 'Tim Y',
    tanggal: document.getElementById('admin-tanggal').value || 'Segera',
    status: document.getElementById('admin-status').value,
    skor1: parseInt(document.getElementById('admin-skor1').value) || 0,
    skor2: parseInt(document.getElementById('admin-skor2').value) || 0
  };

  localStorage.setItem('turnamen_data', JSON.stringify(matchesData));
  alert("Data pertandingan berhasil diperbarui!");
  renderUI();
}

// Render UI ke Halaman Pengguna
function renderUI() {
  const jadwalContainer = document.getElementById('jadwal-container');
  const hasilContainer = document.getElementById('hasil-container');
  const baganContainer = document.getElementById('bagan-container');

  let jadwalHTML = '';
  let hasilHTML = '';

  for (let key in matchesData) {
    let m = matchesData[key];
    
    // Kartu untuk Tab Jadwal
    if (m.status === 'Mendatang' || m.status === 'Live') {
      jadwalHTML += `
        <div class="match-card">
          <span class="badge ${m.status.toLowerCase()}">${m.status}</span>
          <p class="match-time">📅 ${m.tanggal}</p>
          <div class="teams-row">
            <span class="team-name">${m.tim1}</span>
            <span class="vs">VS</span>
            <span class="team-name">${m.tim2}</span>
          </div>
          ${m.status === 'Live' ? `<div class="live-score">Skor Sementara: ${m.skor1} -${m.skor2}</div>` : ''}
        </div>
      `;
    }

    // Kartu untuk Tab Hasil
    if (m.status === 'Selesai') {
      hasilHTML += `
        <div class="match-card">
          <span class="badge selesai">Selesai</span>
          <p class="match-time">📅 ${m.tanggal}</p>
          <div class="teams-row">
            <span class="team-name">${m.tim1}</span>
            <span class="score">${m.skor1} - ${m.skor2}</span>
            <span class="team-name">${m.tim2}</span>
          </div>
        </div>
      `;
    }
  }

  jadwalContainer.innerHTML = jadwalHTML || '<p class="empty">Tidak ada jadwal pertandingan aktif.</p>';
  hasilContainer.innerHTML = hasilHTML || '<p class="empty">Belum ada hasil pertandingan yang selesai.</p>';

  // Render Bagan Turnamen
  baganContainer.innerHTML = `
    <div class="bracket-wrapper">
      <div class="round">
        <h4>Semifinal</h4>
        <div class="b-match"><span>${matchesData.SF1.tim1} vs ${matchesData.SF1.tim2}</span></div>
        <div class="b-match"><span>${matchesData.SF2.tim1} vs ${matchesData.SF2.tim2}</span></div>
      </div>
      <div class="round">
        <h4>Final</h4>
        <div class="b-match final"><span>${matchesData.F.tim1} vs ${matchesData.F.tim2}</span></div>
      </div>
    </div>
  `;
}

// Jalankan render saat halaman pertama kali dibuka
document.addEventListener('DOMContentLoaded', renderUI);
