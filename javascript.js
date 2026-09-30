let teamsList = JSON.parse(localStorage.getItem('turnamen_teams')) || [];
let matchesData = JSON.parse(localStorage.getItem('turnamen_matches')) || {};
let isAdminLoggedIn = JSON.parse(localStorage.getItem('admin_logged_in')) || false;

// Inisialisasi Saat Halaman Dimuat
document.addEventListener('DOMContentLoaded', () => {
  renderTeamListAdmin();
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
  
  if (teamsList.some(t => t.name.toLowerCase() === teamName.toLowerCase())) {
    showCustomAlert("Perhatian", "Tim dengan nama tersebut sudah terdaftar!", "error");
    return;
  }

  const playerInputs = document.querySelectorAll('.player-name-input');
  let players = [];
  playerInputs.forEach(input => {
    let pName = input.value.trim();
    if (pName) players.push(pName);
  });

  teamsList.push({ name: teamName, players: players });
  localStorage.setItem('turnamen_teams', JSON.stringify(teamsList));

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

// Generate Bagan & Jadwal Dinamis Berdasarkan Jumlah Tim Terdaftar (Mendukung 32, 16, 8, 4, 2 Tim)
function generateBracket() {
  if (teamsList.length < 2) {
    showCustomAlert("Perhatian", "Minimal harus ada 2 tim terdaftar untuk membuat jadwal turnamen!", "error");
    return;
  }

  if (confirm("Generate ulang akan mereset seluruh jadwal dan skor pertandingan berdasarkan daftar tim saat ini. Lanjutkan?")) {
    let count = teamsList.length;
    let newMatches = {};

    if (count > 16) {
      // 32 Besar (16 Pertandingan)
      let rName = "32 Besar";
      for (let i = 0; i < 16; i++) {
        let t1 = teamsList[i * 2] ? teamsList[i * 2].name : `Bye/Winner`;
        let t2 = teamsList[i * 2 + 1] ? teamsList[i * 2 + 1].name : `Bye/Winner`;
        newMatches[`R32_${i+1}`] = { id: `R32_${i+1}`, round: rName, tim1: t1, tim2: t2, tanggal: 'Belum ditentukan', status: 'Mendatang', skor1: 0, skor2: 0 };
      }
    } else if (count > 8) {
      // 16 Besar (8 Pertandingan)
      let rName = "16 Besar";
      for (let i = 0; i < 8; i++) {
        let t1 = teamsList[i * 2] ? teamsList[i * 2].name : `Bye/Winner`;
        let t2 = teamsList[i * 2 + 1] ? teamsList[i * 2 + 1].name : `Bye/Winner`;
        newMatches[`R16_${i+1}`] = { id: `R16_${i+1}`, round: rName, tim1: t1, tim2: t2, tanggal: 'Belum ditentukan', status: 'Mendatang', skor1: 0, skor2: 0 };
      }
    } else if (count > 4) {
      // Perempat Final (4 Pertandingan)
      let rName = "Perempat Final";
      for (let i = 0; i < 4; i++) {
        let t1 = teamsList[i * 2] ? teamsList[i * 2].name : `Bye/Winner`;
        let t2 = teamsList[i * 2 + 1] ? teamsList[i * 2 + 1].name : `Bye/Winner`;
        newMatches[`QF_${i+1}`] = { id: `QF_${i+1}`, round: rName, tim1: t1, tim2: t2, tanggal: 'Belum ditentukan', status: 'Mendatang', skor1: 0, skor2: 0 };
      }
    } else if (count > 2) {
      // Semifinal (2 Pertandingan)
      newMatches = {
        SF1: { id: 'SF1', round: 'Semifinal 1', tim1: teamsList[0].name, tim2: teamsList[1].name, tanggal: 'Belum ditentukan', status: 'Mendatang', skor1: 0, skor2: 0 },
        SF2: { id: 'SF2', round: 'Semifinal 2', tim1: teamsList[2] ? teamsList[2].name : 'Tim 3', tim2: teamsList[3] ? teamsList[3].name : 'Tim 4', tanggal: 'Belum ditentukan', status: 'Mendatang', skor1: 0, skor2: 0 },
        F:   { id: 'F',   round: 'Final', tim1: 'Pemenang SF1', tim2: 'Pemenang SF2', tanggal: 'Belum ditentukan', status: 'Mendatang', skor1: 0, skor2: 0 }
      };
    } else {
      // Langsung Final
      newMatches = {
        F:   { id: 'F',   round: 'Final', tim1: teamsList[0].name, tim2: teamsList[1].name, tanggal: 'Belum ditentukan', status: 'Mendatang', skor1: 0, skor2: 0 }
      };
    }

    matchesData = newMatches;
    localStorage.setItem('turnamen_matches', JSON.stringify(matchesData));
    renderUI();
    showCustomAlert("Berhasil", "Jadwal dan bagan turnamen dinamis berhasil di-generate!", "success");
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
function toggleAdminLoginModal() {
  if (!isAdminLoggedIn) {
    document.getElementById('login-modal').style.display = 'flex';
    document.getElementById('admin-user').value = '';
    document.getElementById('admin-pass').value = '';
    document.getElementById('admin-user').focus();
  } else {
    // Jika sudah login, langsung buka tab panel admin
    const adminBtn = document.getElementById('admin-tab-btn');
    adminBtn.click();
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
    showCustomAlert("Berhasil Masuk!", "Selamat datang kembali, Administrator! Tab Panel Admin kini telah dibuka.", "success");
    // Otomatis arahkan ke tab admin
    document.getElementById('admin-tab-btn').click();
  } else {
    showCustomAlert("Gagal Masuk", "Username atau password yang Anda masukkan salah. Silakan coba lagi.", "error");
  }
}

// Logout Admin
function logoutAdmin() {
  isAdminLoggedIn = false;
  localStorage.setItem('admin_logged_in', 'false');
  updateAdminUIState();
  // Pindahkan kembali ke tab jadwal
  document.querySelector('.tabs .tab-btn').click();
  showCustomAlert("Keluar Sesi", "Anda telah berhasil keluar dari panel kontrol admin.", "success");
}

// Perbarui Tampilan Tombol Berdasarkan Status Login
function updateAdminUIState() {
  const adminTabBtn = document.getElementById('admin-tab-btn');
  const toggleBtn = document.getElementById('admin-toggle-btn');

  if (isAdminLoggedIn) {
    adminTabBtn.style.display = 'block';
    toggleBtn.innerText = '🛠️ Buka Panel Admin';
    toggleBtn.style.background = '#d4ac0d';
  } else {
    adminTabBtn.style.display = 'none';
    toggleBtn.innerText = '🔒 Login Admin';
    toggleBtn.style.background = '';
  }
}

// Otomatis Menentukan Pemenang Fase Berikutnya
function updateNextPhaseAutomatically() {
  // Logika otomatisasi untuk penentuan pemenang semifinal ke final (jika ada format semifinal)
  if (matchesData.SF1 && matchesData.SF2 && matchesData.F) {
    if (matchesData.SF1.status === 'Selesai') {
      if (matchesData.SF1.skor1 > matchesData.SF1.skor2) matchesData.F.tim1 = matchesData.SF1.tim1;
      else if (matchesData.SF1.skor2 > matchesData.SF1.skor1) matchesData.F.tim1 = matchesData.SF1.tim2;
    }
    if (matchesData.SF2.status === 'Selesai') {
      if (matchesData.SF2.skor1 > matchesData.SF2.skor2) matchesData.F.tim2 = matchesData.SF2.tim1;
      else if (matchesData.SF2.skor2 > matchesData.SF2.skor1) matchesData.F.tim2 = matchesData.SF2.tim2;
    }
  }
}

// Menyimpan Perubahan Pertandingan Langsung dari Kartu Jadwal (Admin Only)
function saveMatchFromCard(matchId) {
  let match = matchesData[matchId];
  if (!match) return;

  let tanggalInput = document.getElementById(`date_${matchId}`).value;
  let statusInput = document.getElementById(`status_${matchId}`).value;
  let skor1Input = parseInt(document.getElementById(`skor1_${matchId}`).value) || 0;
  let skor2Input = parseInt(document.getElementById(`skor2_${matchId}`).value) || 0;

  match.tanggal = tanggalInput || 'Segera';
  match.status = statusInput;
  match.skor1 = skor1Input;
  match.skor2 = skor2Input;

  updateNextPhaseAutomatically();
  localStorage.setItem('turnamen_matches', JSON.stringify(matchesData));
  showCustomAlert("Berhasil Disimpan!", `Jadwal dan skor ${match.round} berhasil diperbarui.`, "success");
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
    jadwalContainer.innerHTML = '<p class="empty">Belum ada jadwal pertandingan. Silakan generate jadwal melalui Panel Admin.</p>';
    hasilContainer.innerHTML = '<p class="empty">Belum ada hasil pertandingan.</p>';
    baganContainer.innerHTML = '<p class="empty">Bagan belum dibuat.</p>';
    return;
  }

  for (let key in matchesData) {
    let m = matchesData[key];
    
    // Tampilan Tab Jadwal (Mendatang atau Live)
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
          
          ${isAdminLoggedIn ? `
            <div class="admin-match-edit-box">
              <div class="input-group">
                <label>Tanggal & Jam:</label>
                <input type="text" id="date_${key}" value="${m.tanggal}">
              </div>
              <div class="input-group">
                <label>Status Pertandingan:</label>
                <select id="status_${key}">
                  <option value="Mendatang" ${m.status === 'Mendatang' ? 'selected' : ''}>Mendatang</option>
                  <option value="Live" ${m.status === 'Live' ? 'selected' : ''}>Live</option>
                  <option value="Selesai" ${m.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
                </select>
              </div>
              <div class="skor-group">
                <div class="input-group" style="flex:1;">
                  <label>Skor (${m.tim1}):</label>
                  <input type="number" id="skor1_${key}" min="0" value="${m.skor1}">
                </div>
                <div class="input-group" style="flex:1;">
                  <label>Skor (${m.tim2}):</label>
                  <input type="number" id="skor2_${key}" min="0" value="${m.skor2}">
                </div>
              </div>
              <button type="button" class="btn-save" onclick="saveMatchFromCard('${key}')" style="margin-top: 6px; width:100%;">💾 Update Jadwal/Skor</button>
            </div>
          ` : ''}
        </div>
      `;
    }

    // Tampilan Tab Hasil (Selesai)
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
          ${isAdminLoggedIn ? `
            <div class="admin-match-edit-box">
              <div class="input-group">
                <label>Ubah Status Kembali:</label>
                <select id="status_${key}">
                  <option value="Mendatang">Mendatang</option>
                  <option value="Live">Live</option>
                  <option value="Selesai" selected>Selesai</option>
                </select>
              </div>
              <div class="skor-group">
                <div class="input-group" style="flex:1;">
                  <label>Skor (${m.tim1}):</label>
                  <input type="number" id="skor1_${key}" min="0" value="${m.skor1}">
                </div>
                <div class="input-group" style="flex:1;">
                  <label>Skor (${m.tim2}):</label>
                  <input type="number" id="skor2_${key}" min="0" value="${m.skor2}">
                </div>
              </div>
              <input type="hidden" id="date_${key}" value="${m.tanggal}">
              <button type="button" class="btn-save" onclick="saveMatchFromCard('${key}')" style="margin-top: 6px; width:100%;">💾 Koreksi Hasil</button>
            </div>
          ` : ''}
        </div>
      `;
    }
  }

  jadwalContainer.innerHTML = jadwalHTML || '<p class="empty">Tidak ada jadwal pertandingan aktif/mendatang.</p>';
  hasilContainer.innerHTML = hasilHTML || '<p class="empty">Belum ada hasil pertandingan yang selesai.</p>';

  // Render Bagan Turnamen Dinamis Sesuai Struktur Match yang Ada
  let roundsMap = {};
  for (let key in matchesData) {
    let m = matchesData[key];
    if (!roundsMap[m.round]) roundsMap[m.round] = [];
    roundsMap[m.round].push(m);
  }

  let bracketHTML = '<div class="bracket-wrapper">';
  for (let rName in roundsMap) {
    bracketHTML += `<div class="round"><h4>${rName}</h4>`;
    roundsMap[rName].forEach(m => {
      let isFinal = rName.toLowerCase().includes('final') && !rName.toLowerCase().includes('semi') && !rName.toLowerCase().includes('perempat');
      bracketHTML += `<div class="b-match ${isFinal ? 'final' : ''}"><span>${m.tim1} vs ${m.tim2}</span></div>`;
    });
    bracketHTML += `</div>`;
  }
  bracketHTML += `</div>`;
  baganContainer.innerHTML = bracketHTML;
}
