// State Data Dibersihkan (Mulai dari Awal tanpa Jadwal/Tim Bawaan)
let teamsList = JSON.parse(localStorage.getItem('turnamen_teams')) || [];
let matchesData = JSON.parse(localStorage.getItem('turnamen_matches')) || {};
let isAdminLoggedIn = JSON.parse(localStorage.getItem('admin_logged_in')) || false;

// Inisialisasi Saat Halaman Dimuat
document.addEventListener('DOMContentLoaded', () => {
  renderTeamListAdmin();
  updateMatchSelectOptions();
  updateNextPhaseAutomatically();
  renderUI();
  updateAdminUIState();
});

// Menambahkan Kolom Input Pemain Secara Dinamis
function addPlayerInput() {
  const container = document.getElementById('player-inputs-container');
  const row = document.createElement('div');
  row.className = 'player-input-row';
  row.innerHTML = `
    <input type="text" class="player-name-input" placeholder="Nama pemain...">
    <button type="button" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(row);
}

// Tambah Tim Beserta Pemainnya
function addTeam() {
  const nameInput = document.getElementById('new-team-name');
  const teamName = nameInput.value.trim();
  
  if (!teamName) {
    showCustomAlert("Perhatian", "Nama tim tidak boleh kosong!", "error");
    return;
  }
  
  // Periksa apakah tim sudah ada
  if (teamsList.some(t => t.name.toLowerCase() === teamName.toLowerCase())) {
    showCustomAlert("Perhatian", "Tim dengan nama tersebut sudah terdaftar!", "error");
    return;
  }

  // Kumpulkan nama pemain dari kolom input dinamis
  const playerInputs = document.querySelectorAll('.player-name-input');
  let players = [];
  playerInputs.forEach(input => {
    let pName = input.value.trim();
    if (pName) players.push(pName);
  });

  teamsList.push({ name: teamName, players: players });
  localStorage.setItem('turnamen_teams', JSON.stringify(teamsList));

  // Reset form input
  nameInput.value = '';
  document.getElementById('player-inputs-container').innerHTML = '';

  renderTeamListAdmin();
  showCustomAlert("Berhasil", `Tim "${teamName}" beserta pemainnya berhasil ditambahkan.`, "success");
}

// Hapus Tim
function removeTeam(index) {
  const removed = teamsList.splice(index, 1);
  localStorage.setItem('turnamen_teams', JSON.stringify(teamsList));
  renderTeamListAdmin();
  showCustomAlert("Tim Dihapus", `Tim "${removed[0].name}" telah dihapus.`, "success");
}

// Render Chip Tim di Panel Admin
function renderTeamListAdmin() {
  const container = document.getElementById('team-list-admin');
  if (teamsList.length === 0) {
    container.innerHTML = '<p style="font-size: 0.85rem; color: #888;">Belum ada tim terdaftar. Silakan tambahkan tim baru.</p>';
    return;
  }
  let html = '';
  teamsList.forEach((team, idx) => {
    let playersStr = team.players.length > 0 ? team.players.join(', ') : 'Tidak ada data pemain';
    html += `
      <div class="team-chip">
        <div class="team-chip-header">
          <span><strong>${team.name}</strong></span>
          <button type="button" onclick="removeTeam(${idx})" title="Hapus Tim">&times;</button>
        </div>
        <div class="team-players-list">Pemain: ${playersStr}</div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// Generate Jadwal & Bagan Otomatis Berdasarkan Daftar Tim Terdaftar
function generateBracket() {
  if (teamsList.length < 2) {
    showCustomAlert("Perhatian", "Minimal harus ada 2 tim terdaftar untuk membuat jadwal turnamen!", "error");
    return;
  }

  if (confirm("Generate ulang akan mereset jadwal dan skor pertandingan berdasarkan daftar tim saat ini. Lanjutkan?")) {
    if (teamsList.length >= 4) {
      matchesData = {
        SF1: { id: 'SF1', round: 'Semifinal 1', tim1: teamsList[0].name, tim2: teamsList[1].name, tanggal: 'Belum ditentukan', status: 'Mendatang', skor1: 0, skor2: 0 },
        SF2: { id: 'SF2', round: 'Semifinal 2', tim1: teamsList[2].name, tim2: teamsList[3].name, tanggal: 'Belum ditentukan', status: 'Mendatang', skor1: 0, skor2: 0 },
        F:   { id: 'F',   round: 'Final', tim1: 'Pemenang SF1', tim2: 'Pemenang SF2', tanggal: 'Belum ditentukan', status: 'Mendatang', skor1: 0, skor2: 0 }
      };
    } else {
      matchesData = {
        F:   { id: 'F',   round: 'Final', tim1: teamsList[0].name, tim2: teamsList[1].name, tanggal: 'Belum ditentukan', status: 'Mendatang', skor1: 0, skor2: 0 }
      };
    }

    localStorage.setItem('turnamen_matches', JSON.stringify(matchesData));
    updateMatchSelectOptions();
    renderUI();
    showCustomAlert("Berhasil", "Jadwal dan bagan berhasil di-generate dari daftar tim!", "success");
  }
}

// Perbarui Opsi Dropdown Sesuai Data Match Aktif
function updateMatchSelectOptions() {
  const select = document.getElementById('match-select');
  select.innerHTML = '<option value="">-- Pilih Pertandingan --</option>';
  for (let key in matchesData) {
    let m = matchesData[key];
    select.innerHTML += `<option value="${key}">${m.round}: ${m.tim1} vs ${m.tim2}</option>`;
  }
}

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

// Menampilkan Popup Modal Login
function toggleAdminPanel() {
  if (!isAdminLoggedIn) {
    document.getElementById('login-modal').style.display = 'flex';
    document.getElementById('admin-user').value = '';
    document.getElementById('admin-pass').value = '';
    document.getElementById('admin-user').focus();
  } else {
    const panel = document.getElementById('admin-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }
}

// Menutup Popup Modal Login
function closeLoginModal() {
  document.getElementById('login-modal').style.display = 'none';
}

// Custom Alert / Notifikasi Popup Bergaya Emoji
function showCustomAlert(title, message, type) {
  const alertOverlay = document.getElementById('custom-alert');
  const alertCard = document.getElementById('alert-card-box');
  const alertEmoji = document.getElementById('alert-emoji');
  const alertTitle = document.getElementById('alert-title');
  const alertMessage = document.getElementById('alert-message');

  alertCard.className = "custom-alert-card " + type;
  alertTitle.innerText = title;
  alertMessage.innerText = message;

  if (type === 'success') {
    alertEmoji.innerText = '🎉';
  } else if (type === 'error') {
    alertEmoji.innerText = '❌';
  } else {
    alertEmoji.innerText = 'ℹ️';
  }

  alertOverlay.style.display = 'flex';
}

function closeCustomAlert() {
  document.getElementById('custom-alert').style.display = 'none';
}

// Proses Validasi Username & Password
function processLogin() {
  const user = document.getElementById('admin-user').value.trim();
  const pass = document.getElementById('admin-pass').value.trim();

  if (user === "admin" && pass === "123456") {
    isAdminLoggedIn = true;
    localStorage.setItem('admin_logged_in', 'true');
    closeLoginModal();
    updateAdminUIState();
    showCustomAlert("Berhasil Masuk!", "Selamat datang kembali, Administrator! Anda dapat mendaftarkan tim dan pemain sekarang.", "success");
  } else {
    showCustomAlert("Gagal Masuk", "Username atau password yang Anda masukkan salah. Silakan coba lagi.", "error");
  }
}

// Logout Admin
function logoutAdmin() {
  isAdminLoggedIn = false;
  localStorage.setItem('admin_logged_in', 'false');
  updateAdminUIState();
  showCustomAlert("Keluar Sesi", "Anda telah berhasil keluar dari panel kontrol admin.", "success");
}

// Perbarui Tampilan Tombol & Panel Berdasarkan Status Login
function updateAdminUIState() {
  const panel = document.getElementById('admin-panel');
  const btn = document.getElementById('admin-toggle-btn');

  if (isAdminLoggedIn) {
    panel.style.display = 'block';
    btn.innerText = '🛠️ Sembunyikan Panel Admin';
    btn.style.background = '#c0392b';
  } else {
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
  document.getElementById('admin-tanggal').value = match.tanggal;
  document.getElementById('admin-status').value = match.status;
  document.getElementById('admin-skor1').value = match.skor1;
  document.getElementById('admin-skor2').value = match.skor2;
  
  document.getElementById('label-skor1').innerText = `Skor (${match.tim1}):`;
  document.getElementById('label-skor2').innerText = `Skor (${match.tim2}):`;
  
  toggleScoreInput();
}

// Otomatis Menentukan Pemenang Fase Berikutnya (Semifinal ke Final)
function updateNextPhaseAutomatically() {
  if (matchesData.SF1 && matchesData.SF2 && matchesData.F) {
    let sf1 = matchesData.SF1;
    let sf2 = matchesData.SF2;
    let finalMatch = matchesData.F;

    if (sf1.status === 'Selesai') {
      if (sf1.skor1 > sf1.skor2) finalMatch.tim1 = sf1.tim1;
      else if (sf1.skor2 > sf1.skor1) finalMatch.tim1 = sf1.tim2;
      else finalMatch.tim1 = 'Pemenang SF1';
    }

    if (sf2.status === 'Selesai') {
      if (sf2.skor1 > sf2.skor2) finalMatch.tim2 = sf2.tim1;
      else if (sf2.skor2 > sf2.skor1) finalMatch.tim2 = sf2.tim2;
      else finalMatch.tim2 = 'Pemenang SF2';
    }
  }
}

// Menyimpan Perubahan Data Admin
function saveMatchData() {
  const matchId = document.getElementById('match-select').value;
  if (!matchId) {
    showCustomAlert("Perhatian", "Silakan pilih pertandingan terlebih dahulu!", "error");
    return;
  }

  let match = matchesData[matchId];
  match.tanggal = document.getElementById('admin-tanggal').value || 'Segera';
  match.status = document.getElementById('admin-status').value;
  match.skor1 = parseInt(document.getElementById('admin-skor1').value) || 0;
  match.skor2 = parseInt(document.getElementById('admin-skor2').value) || 0;

  updateNextPhaseAutomatically();

  localStorage.setItem('turnamen_matches', JSON.stringify(matchesData));
  updateMatchSelectOptions();
  showCustomAlert("Berhasil Disimpan!", "Jadwal dan skor pertandingan berhasil diperbarui.", "success");
  renderUI();
}

// Render UI ke Halaman Pengguna
function renderUI() {
  updateNextPhaseAutomatically();

  const jadwalContainer = document.getElementById('jadwal-container');
  const hasilContainer = document.getElementById('hasil-container');
  const baganContainer = document.getElementById('bagan-container');

  let jadwalHTML = '';
  let hasilHTML = '';

  if (Object.keys(matchesData).length === 0) {
    jadwalContainer.innerHTML = '<p class="empty">Belum ada jadwal pertandingan. Silakan generate jadwal melalui panel admin.</p>';
    hasilContainer.innerHTML = '<p class="empty">Belum ada hasil pertandingan.</p>';
    baganContainer.innerHTML = '<p class="empty">Bagan belum dibuat.</p>';
    return;
  }

  for (let key in matchesData) {
    let m = matchesData[key];
    
    // Kartu untuk Tab Jadwal
    if (m.status === 'Mendatang' || m.status === 'Live') {
      jadwalHTML += `
        <div class="match-card">
          <span class="badge ${m.status.toLowerCase()}">${m.status}</span>
          <p class="match-time">📅 ${m.tanggal} (${m.round})</p>
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
          <p class="match-time">📅 ${m.tanggal} (${m.round})</p>
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

  // Render Bagan Turnamen Dinamis
  if (matchesData.SF1 && matchesData.SF2) {
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
  } else if (matchesData.F) {
    baganContainer.innerHTML = `
      <div class="bracket-wrapper">
        <div class="round">
          <h4>Final</h4>
          <div class="b-match final"><span>${matchesData.F.tim1} vs ${matchesData.F.tim2}</span></div>
        </div>
      </div>
    `;
  } else {
    baganContainer.innerHTML = '<p class="empty">Bagan belum di-generate.</p>';
  }
}
