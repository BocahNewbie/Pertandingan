// GANTI URL DI BAWAH INI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxC-Ey8aA5lx8Aa8LohL9xwD-i_7ROd7B07-lgwEOXR1g40ftsdkwnwvBvW9oDA9oDd/exec';

let teamsList = [];
let matchesList = [];
let isAdminLoggedIn = JSON.parse(localStorage.getItem('admin_logged_in')) || false;
let editingTeamIndex = -1;

// Saat halaman dimuat, tarik data terbaru dari Google Sheets
document.addEventListener('DOMContentLoaded', () => {
  fetchDataFromServer(() => {
    renderTeamListAdmin();
    updateTeamSelectOptions();
    
    if (!isAdminLoggedIn) {
      localStorage.setItem('admin_logged_in', 'false');
      switchView('public');
    } else {
      switchView('admin');
    }
    updateAuthUI();
  });
});

// Fungsi Ambil Data dengan Cache Instan
function fetchDataFromServer(callback) {
  // 1. Cek apakah ada data cache lokal sebelumnya agar langsung tampil tanpa menunggu
  let cachedTeams = localStorage.getItem('cache_teams');
  let cachedMatches = localStorage.getItem('cache_matches');
  
  if (cachedTeams && cachedMatches) {
    teamsList = JSON.parse(cachedTeams);
    matchesList = JSON.parse(cachedMatches);
    // Render langsung menggunakan data cache agar instan
    if (callback) callback();
  }

  // 2. Tarik data terbaru dari Google Sheets di latar belakang
  fetch(SCRIPT_URL + '?action=getData')
    .then(res => res.json())
    .then(data => {
      teamsList = data.teams || [];
      matchesList = data.matches || [];
      
      // Simpan ke cache lokal
      localStorage.setItem('cache_teams', JSON.stringify(teamsList));
      localStorage.setItem('cache_matches', JSON.stringify(matchesList));

      // Update tampilan dengan data paling fresh dari server
      if (callback) callback();
    })
    .catch(err => {
      console.error("Gagal menyinkronkan dengan server:", err);
      if (!cachedTeams && callback) callback(); // Jalankan callback walau offline jika cache kosong
    });
}

// Fungsi Simpan Data ke Google Sheets
function syncToServer(actionType, callback) {
  let payload = { action: actionType };
  if (actionType === 'saveTeams') payload.teams = teamsList;
  if (actionType === 'saveMatches') payload.matches = matchesList;

  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors', // Menghindari isu CORS pada Google Apps Script
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  }).then(() => {
    if (callback) callback();
  }).catch(err => {
    console.error("Gagal menyimpan ke server:", err);
    if (callback) callback();
  });
}

// ==========================================
// KONTROL VIEW & AUTENTIKASI
// ==========================================
function updateAuthUI() {
  const btnLogin = document.getElementById('btn-login-trigger');
  if (!btnLogin) return;

  if (isAdminLoggedIn) {
    btnLogin.innerHTML = '🛠 Buka Panel Admin';
    btnLogin.classList.add('active-mode');
    btnLogin.onclick = () => switchView('admin');
  } else {
    btnLogin.innerHTML = '🔒 Login Admin';
    btnLogin.classList.remove('active-mode');
    btnLogin.onclick = () => openLoginModal();
  }
}

function switchView(viewName) {
  const publicDash = document.getElementById('public-dashboard');
  const adminDash = document.getElementById('admin-dashboard');

  if (viewName === 'admin') {
    if (!isAdminLoggedIn) {
      openLoginModal();
      return;
    }
    if (publicDash) {
      publicDash.classList.remove('active');
      publicDash.style.display = 'none';
    }
    if (adminDash) {
      adminDash.style.display = 'block';
      adminDash.classList.add('active');
    }
    
    const defaultTabBtn = document.querySelector('.admin-sidebar .admin-nav-btn');
    if (defaultTabBtn) {
      defaultTabBtn.click();
    } else {
      renderTeamListAdmin();
    }
  } else {
    if (adminDash) {
      adminDash.classList.remove('active');
      adminDash.style.display = 'none';
    }
    if (publicDash) {
      publicDash.style.display = 'block';
      publicDash.classList.add('active');
    }
    // Sinkronkan data terbaru sebelum ditampilkan ke publik
    fetchDataFromServer(() => renderPublicUI());
  }
}

function switchPublicTab(evt, tabName) {
  document.querySelectorAll('#public-dashboard .tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('#public-dashboard .tab-btn').forEach(b => b.classList.remove('active'));
  
  const targetTab = document.getElementById(tabName);
  if (targetTab) targetTab.classList.add('active');
  if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');
}

function switchAdminTab(evt, tabName) {
  document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
  
  const targetTab = document.getElementById(tabName);
  if (targetTab) targetTab.classList.add('active');
  if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');
  
  // Ambil data terbaru setiap kali pindah tab admin
  fetchDataFromServer(() => {
    if (tabName === 'admin-tim') renderTeamListAdmin();
    if (tabName === 'admin-bagan') updateTeamSelectOptions();
    if (tabName === 'admin-jadwal') renderAdminMatchList();
  });
}

// ==========================================
// MODAL LOGIN
// ==========================================
function openLoginModal() { 
  const userInput = document.getElementById('admin-user');
  const passInput = document.getElementById('admin-pass');
  if (userInput) userInput.value = '';
  if (passInput) passInput.value = '';

  const modal = document.getElementById('login-modal');
  if (modal) modal.style.display = 'flex'; 
}

function closeLoginModal() { 
  const userInput = document.getElementById('admin-user');
  const passInput = document.getElementById('admin-pass');
  if (userInput) userInput.value = '';
  if (passInput) passInput.value = '';

  const modal = document.getElementById('login-modal');
  if (modal) modal.style.display = 'none'; 
}

function processLogin() {
  let u = document.getElementById('admin-user').value.trim();
  let p = document.getElementById('admin-pass').value.trim();
  
  if (u === "admin" && p === "123456") {
    isAdminLoggedIn = true;
    localStorage.setItem('admin_logged_in', 'true');
    closeLoginModal();
    updateAuthUI();
    switchView('admin');
    showCustomAlert("Otorisasi Berhasil", "Selamat datang di Panel Administrator.", "success");
  } else {
    showCustomAlert("Otorisasi Gagal", "Username atau Password salah.", "error");
    const passInput = document.getElementById('admin-pass');
    if (passInput) passInput.value = '';
  }
}

function logoutAdmin() {
  isAdminLoggedIn = false;
  localStorage.setItem('admin_logged_in', 'false');
  
  const userInput = document.getElementById('admin-user');
  const passInput = document.getElementById('admin-pass');
  if (userInput) userInput.value = '';
  if (passInput) passInput.value = '';

  updateAuthUI();
  switchView('public');
  showCustomAlert("Sesi Berakhir", "Anda telah keluar dari Administrator.", "success");
}

// ==========================================
// MANAJEMEN TIM
// ==========================================
function addPlayerInput() {
  const container = document.getElementById('player-inputs-container');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'player-input-row';
  row.innerHTML = `<input type="text" class="player-name-input" placeholder="Ketik nama pemain..."><button type="button" onclick="this.parentElement.remove()">&times;</button>`;
  container.appendChild(row);
}

function addTeam() {
  const nameInput = document.getElementById('new-team-name');
  if (!nameInput) return;

  const teamName = nameInput.value.trim();
  if (!teamName) return showCustomAlert("Peringatan", "Nama tim tidak boleh kosong!", "error");
  if (teamsList.some(t => t.name.toLowerCase() === teamName.toLowerCase())) return showCustomAlert("Peringatan", "Tim sudah terdaftar!", "error");

  let players = [];
  document.querySelectorAll('.player-name-input').forEach(input => {
    if (input.value.trim()) players.push(input.value.trim());
  });

  teamsList.push({ name: teamName, players: players });
  syncToServer('saveTeams', () => {
    nameInput.value = '';
    const pContainer = document.getElementById('player-inputs-container');
    if (pContainer) pContainer.innerHTML = '';
    renderTeamListAdmin();
    updateTeamSelectOptions();
    showCustomAlert("Berhasil", `Tim ${teamName} didaftarkan ke cloud.`, "success");
  });
}

function openEditTeamModal(index) {
  editingTeamIndex = index;
  const team = teamsList[index];
  const editName = document.getElementById('edit-team-name');
  if (editName) editName.value = team.name;
  
  const container = document.getElementById('edit-player-inputs-container');
  if (!container) return;
  container.innerHTML = '';
  
  let teamPlayers = team.players;
  if (typeof teamPlayers === 'string') {
    try { teamPlayers = JSON.parse(teamPlayers); } catch(e) { teamPlayers = []; }
  }

  if (Array.isArray(teamPlayers)) {
    teamPlayers.forEach(p => {
      const row = document.createElement('div');
      row.className = 'player-input-row';
      row.innerHTML = `<input type="text" class="edit-player-name-input" value="${p}"><button type="button" onclick="this.parentElement.remove()">&times;</button>`;
      container.appendChild(row);
    });
  }
  
  const editModal = document.getElementById('edit-team-modal');
  if (editModal) editModal.style.display = 'flex';
}

function addPlayerInputEdit() {
  const container = document.getElementById('edit-player-inputs-container');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'player-input-row';
  row.innerHTML = `<input type="text" class="edit-player-name-input" placeholder="Ketik nama pemain..."><button type="button" onclick="this.parentElement.remove()">&times;</button>`;
  container.appendChild(row);
}

function closeEditTeamModal() { 
  const editModal = document.getElementById('edit-team-modal');
  if (editModal) editModal.style.display = 'none'; 
  editingTeamIndex = -1; 
}

function saveEditTeam() {
  if (editingTeamIndex === -1) return;
  const editNameInput = document.getElementById('edit-team-name');
  if (!editNameInput) return;

  const newName = editNameInput.value.trim();
  if (!newName) return showCustomAlert("Peringatan", "Nama tim tidak boleh kosong!", "error");
  
  if (teamsList.some((t, i) => i !== editingTeamIndex && t.name.toLowerCase() === newName.toLowerCase())) {
    return showCustomAlert("Peringatan", "Nama tim ini sudah dipakai tim lain!", "error");
  }

  let newPlayers = [];
  document.querySelectorAll('.edit-player-name-input').forEach(input => {
    if (input.value.trim()) newPlayers.push(input.value.trim());
  });

  const oldName = teamsList[editingTeamIndex].name;
  if (oldName !== newName) {
    matchesList.forEach(m => {
      if (m.tim1 === oldName) m.tim1 = newName;
      if (m.tim2 === oldName) m.tim2 = newName;
    });
  }

  teamsList[editingTeamIndex] = { name: newName, players: newPlayers };
  
  syncToServer('saveTeams', () => {
    syncToServer('saveMatches', () => {
      closeEditTeamModal();
      renderTeamListAdmin();
      updateTeamSelectOptions();
      renderAdminMatchList();
      showCustomAlert("Tersimpan", "Data tim diperbarui di cloud.", "success");
    });
  });
}

function removeTeam(index) {
  let removed = teamsList.splice(index, 1);
  syncToServer('saveTeams', () => {
    renderTeamListAdmin();
    updateTeamSelectOptions();
    showCustomAlert("Dihapus", `Tim ${removed[0].name} dihapus dari cloud.`, "success");
  });
}

function renderTeamListAdmin() {
  const container = document.getElementById('team-list-admin');
  if (!container) return;
  if (teamsList.length === 0) {
    container.innerHTML = '<p style="color:#888;">Belum ada tim terdaftar.</p>';
    return;
  }
  
  let html = '';
  teamsList.forEach((t, i) => {
    let pArray = t.players;
    if (typeof pArray === 'string') {
      try { pArray = JSON.parse(pArray); } catch(e) { pArray = []; }
    }
    let pStr = Array.isArray(pArray) && pArray.length > 0 ? pArray.join(', ') : 'Belum ada data pemain';
    
    html += `
      <div class="team-chip">
        <div class="team-chip-header">
          <strong>${t.name}</strong>
          <div>
            <button class="btn-outline" style="padding:4px 8px;" onclick="openEditTeamModal(${i})">✏️</button>
            <button class="btn-danger" style="padding:4px 8px;" onclick="removeTeam(${i})">&times;</button>
          </div>
        </div>
        <div class="team-players">Pemain: ${pStr}</div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// ==========================================
// MANAJEMEN BAGAN & JADWAL
// ==========================================
function getScheduledTeams() {
  let scheduled = new Set();
  matchesList.forEach(m => { scheduled.add(m.tim1); scheduled.add(m.tim2); });
  return scheduled;
}

function updateTeamSelectOptions() {
  const s1 = document.getElementById('match-team1');
  const s2 = document.getElementById('match-team2');
  if (!s1 || !s2) return; 

  let scheduledTeams = getScheduledTeams();
  let opts1 = '<option value="">-- Pilih Tim 1 --</option>';
  let opts2 = '<option value="">-- Pilih Tim 2 --</option>';

  teamsList.forEach(t => {
    let isScheduled = scheduledTeams.has(t.name);
    if (!isScheduled || t.name === s1.value) opts1 += `<option value="${t.name}" ${t.name === s1.value ? 'selected' : ''}>${t.name}</option>`;
    if (!isScheduled || t.name === s2.value) opts2 += `<option value="${t.name}" ${t.name === s2.value ? 'selected' : ''}>${t.name}</option>`;
  });
  s1.innerHTML = opts1; 
  s2.innerHTML = opts2;
}

function formatCustomDate(rawDate, rawTime) {
  if (!rawDate) return 'Belum diatur';
  let d = new Date(rawDate);
  if (isNaN(d)) return 'Belum diatur';
  let options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  let dateStr = d.toLocaleDateString('id-ID', options);
  return rawTime ? `${dateStr} - ${rawTime} WIB` : dateStr;
}

function createBracketMatch() {
  const roundInput = document.getElementById('match-round');
  const s1 = document.getElementById('match-team1');
  const s2 = document.getElementById('match-team2');

  if (!roundInput || !s1 || !s2) return;

  let round = roundInput.value.trim();
  let t1 = s1.value;
  let t2 = s2.value;

  if (!round || !t1 || !t2) return showCustomAlert("Gagal", "Lengkapi babak dan pilih kedua tim!", "error");
  if (t1 === t2) return showCustomAlert("Gagal", "Tim 1 dan Tim 2 tidak boleh sama!", "error");

  matchesList.push({
    id: 'match_' + Date.now(),
    round: round, 
    tim1: t1, 
    tim2: t2,
    rawDate: '', 
    rawTime: '', 
    tanggal: 'Belum diatur',
    status: 'Mendatang', 
    skor1: 0, 
    skor2: 0
  });

  syncToServer('saveMatches', () => {
    roundInput.value = '';
    s1.value = '';
    s2.value = '';
    updateTeamSelectOptions();
    showCustomAlert("Tersimpan", "Pertandingan masuk ke cloud.", "success");
  });
}

function renderAdminMatchList() {
  const container = document.getElementById('admin-match-list-container');
  if (!container) return;
  if (matchesList.length === 0) {
    container.innerHTML = '<p style="color:#888;">Belum ada pertandingan dibuat.</p>';
    return;
  }

  let html = '';
  matchesList.forEach(m => {
    html += `
      <div class="match-card">
        <div class="teams-row" style="font-size: 1.1rem; margin-bottom: 10px;">
          <span>${m.tim1}</span> <span class="vs">VS</span> <span>${m.tim2}</span>
        </div>
        <p style="font-size:0.85rem; color:#7f8c8d; font-weight:bold;">Babak: ${m.round}</p>
        
        <div class="admin-match-edit">
          <div class="grid-2">
            <div>
              <label style="font-size:0.8rem; font-weight:600;">Tanggal:</label>
              <input type="date" id="date_${m.id}" value="${m.rawDate || ''}">
            </div>
            <div>
              <label style="font-size:0.8rem; font-weight:600;">Jam:</label>
              <input type="time" id="time_${m.id}" value="${m.rawTime || ''}">
            </div>
          </div>
          <div class="grid-2" style="margin-top: 10px;">
            <div>
              <label style="font-size:0.8rem; font-weight:600;">Status:</label>
              <select id="status_${m.id}">
                <option value="Mendatang" ${m.status==='Mendatang'?'selected':''}>Mendatang</option>
                <option value="Live" ${m.status==='Live'?'selected':''}>Live</option>
                <option value="Selesai" ${m.status==='Selesai'?'selected':''}>Selesai</option>
              </select>
            </div>
            <div style="display:flex; gap:10px;">
               <div style="flex:1;">
                 <label style="font-size:0.8rem; font-weight:600;">Skor T1:</label>
                 <input type="number" id="skor1_${m.id}" value="${m.skor1}" min="0">
               </div>
               <div style="flex:1;">
                 <label style="font-size:0.8rem; font-weight:600;">Skor T2:</label>
                 <input type="number" id="skor2_${m.id}" value="${m.skor2}" min="0">
               </div>
            </div>
          </div>
          <div style="display:flex; gap:10px; margin-top: 15px;">
            <button class="btn-save" style="flex:1;" onclick="saveMatchCard('${m.id}')">💾 Simpan Jadwal & Skor</button>
            <button class="btn-danger" onclick="deleteMatch('${m.id}')">🗑️ Hapus</button>
          </div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function saveMatchCard(id) {
  let match = matchesList.find(m => m.id === id);
  if (!match) return;

  const dateInput = document.getElementById(`date_${id}`);
  const timeInput = document.getElementById(`time_${id}`);
  const statusInput = document.getElementById(`status_${id}`);
  const skor1Input = document.getElementById(`skor1_${id}`);
  const skor2Input = document.getElementById(`skor2_${id}`);

  match.rawDate = dateInput ? dateInput.value : '';
  match.rawTime = timeInput ? timeInput.value : '';
  match.tanggal = formatCustomDate(match.rawDate, match.rawTime);
  match.status = statusInput ? statusInput.value : 'Mendatang';
  match.skor1 = skor1Input ? (parseInt(skor1Input.value) || 0) : 0;
  match.skor2 = skor2Input ? (parseInt(skor2Input.value) || 0) : 0;

  syncToServer('saveMatches', () => {
    showCustomAlert("Disimpan", "Jadwal dan skor diperbarui ke cloud.", "success");
  });
}

function deleteMatch(id) {
  matchesList = matchesList.filter(m => m.id !== id);
  syncToServer('saveMatches', () => {
    updateTeamSelectOptions();
    renderAdminMatchList();
    showCustomAlert("Dihapus", "Pertandingan dihapus dari cloud.", "success");
  });
}

// ==========================================
// RENDER UI PUBLIK (Urut Kronologis Waktu Terdekat)
// ==========================================
function renderPublicUI() {
  const jContainer = document.getElementById('jadwal-container');
  const hContainer = document.getElementById('hasil-container');
  if (!jContainer || !hContainer) return;

  let sortedMatches = [...matchesList];

  sortedMatches.sort((a, b) => {
    if (!a.rawDate && b.rawDate) return 1;
    if (a.rawDate && !b.rawDate) return -1;
    if (!a.rawDate && !b.rawDate) return 0;

    let dateA = new Date(`${a.rawDate}T${a.rawTime || '00:00'}`);
    let dateB = new Date(`${b.rawDate}T${b.rawTime || '00:00'}`);

    return dateA - dateB;
  });

  let jHTML = '', hHTML = '';
  sortedMatches.forEach(m => {
    let cardHTML = `
      <div class="match-card">
        <span class="badge ${m.status.toLowerCase()}">${m.status}</span>
        <p class="match-time">📅 ${m.tanggal} <br><span style="color:#bdc3c7; font-size:0.8rem;">Babak: ${m.round}</span></p>
        <div class="teams-row">
          <span>${m.tim1}</span>
          ${m.status === 'Selesai' ? `<span class="score">${m.skor1} -${m.skor2}</span>` : `<span class="vs">VS</span>`}
          <span>${m.tim2}</span>
        </div>
        ${m.status === 'Live' ? `<div style="text-align:center; margin-top:12px; color:#e74c3c; font-weight:bold; font-size:1.1rem;">Skor Sementara: ${m.skor1} -${m.skor2}</div>` : ''}
      </div>
    `;

    if (m.status === 'Selesai') hHTML += cardHTML;
    else jHTML += cardHTML;
  });

  jContainer.innerHTML = jHTML || '<p style="text-align:center; color:#888;">Belum ada jadwal aktif.</p>';
  hContainer.innerHTML = hHTML || '<p style="text-align:center; color:#888;">Belum ada pertandingan selesai.</p>';
}

// Custom Alert Helper
function showCustomAlert(title, msg, type) {
  let overlay = document.getElementById('custom-alert');
  let card = document.getElementById('alert-card-box');
  if (!overlay || !card) return;
  
  card.className = "custom-alert-card " + type;
  const emoji = document.getElementById('alert-emoji');
  const alertTitle = document.getElementById('alert-title');
  const alertMsg = document.getElementById('alert-message');

  if (emoji) emoji.innerText = type === 'success' ? '✅' : '❌';
  if (alertTitle) alertTitle.innerText = title;
  if (alertMsg) alertMsg.innerText = msg;
  overlay.style.display = 'flex';
}

function closeCustomAlert() { 
  let overlay = document.getElementById('custom-alert');
  if (overlay) overlay.style.display = 'none'; 
}
