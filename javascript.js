let teamsList = JSON.parse(localStorage.getItem('turnamen_teams')) || [];
let matchesList = JSON.parse(localStorage.getItem('turnamen_matches_list')) || [];
let isAdminLoggedIn = JSON.parse(localStorage.getItem('admin_logged_in')) || false;

let editingTeamIndex = -1; // Penanda index tim yang sedang diedit

document.addEventListener('DOMContentLoaded', () => {
  renderTeamListAdmin();
  updateTeamSelectOptions();
  renderUI();
  updateAdminUIState();
});

// Format Waktu Fleksibel
function formatCustomDate(rawDate, rawTime) {
  if (!rawDate) return 'Belum diatur';
  let d = new Date(rawDate);
  if (isNaN(d)) return 'Belum diatur';
  
  let options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
  let dateStr = d.toLocaleDateString('id-ID', options);
  
  if (rawTime) {
    return `${dateStr} - ${rawTime}`;
  }
  return dateStr;
}

// Tambah Kolom Pemain Saat Buat Tim
function addPlayerInput() {
  const container = document.getElementById('player-inputs-container');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'player-input-row';
  row.innerHTML = `
    <input type="text" class="player-name-input" placeholder="Nama pemain...">
    <button type="button" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(row);
}

// Tambah Kolom Pemain Saat Edit Tim
function addPlayerInputEdit() {
  const container = document.getElementById('edit-player-inputs-container');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'player-input-row';
  row.innerHTML = `
    <input type="text" class="edit-player-name-input" placeholder="Nama pemain...">
    <button type="button" onclick="this.parentElement.remove()">&times;</button>
  `;
  container.appendChild(row);
}

// Tambah Tim
function addTeam() {
  const nameInput = document.getElementById('new-team-name');
  if (!nameInput) return;
  
  const teamName = nameInput.value.trim();
  if (!teamName) {
    showCustomAlert("Perhatian", "Nama tim tidak boleh kosong!", "error");
    return;
  }
  if (teamsList.some(t => t.name.toLowerCase() === teamName.toLowerCase())) {
    showCustomAlert("Perhatian", "Tim sudah terdaftar!", "error");
    return;
  }

  let players = [];
  document.querySelectorAll('.player-name-input').forEach(input => {
    let p = input.value.trim();
    if (p) players.push(p);
  });

  teamsList.push({ name: teamName, players: players });
  localStorage.setItem('turnamen_teams', JSON.stringify(teamsList));

  nameInput.value = '';
  document.getElementById('player-inputs-container').innerHTML = '';
  renderTeamListAdmin();
  updateTeamSelectOptions();
  showCustomAlert("Berhasil", `Tim "${teamName}" ditambahkan.`, "success");
}

// Fitur Edit Tim (Buka Modal)
function openEditTeamModal(index) {
  editingTeamIndex = index;
  const team = teamsList[index];
  
  document.getElementById('edit-team-name').value = team.name;
  
  const container = document.getElementById('edit-player-inputs-container');
  container.innerHTML = ''; // Bersihkan kontainer pemain sebelumnya
  
  team.players.forEach(p => {
    const row = document.createElement('div');
    row.className = 'player-input-row';
    row.innerHTML = `
      <input type="text" class="edit-player-name-input" value="${p}" placeholder="Nama pemain...">
      <button type="button" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(row);
  });
  
  document.getElementById('edit-team-modal').style.display = 'flex';
}

function closeEditTeamModal() {
  document.getElementById('edit-team-modal').style.display = 'none';
  editingTeamIndex = -1;
}

// Fitur Edit Tim (Simpan Data)
function saveEditTeam() {
  if (editingTeamIndex === -1) return;
  
  const newName = document.getElementById('edit-team-name').value.trim();
  if (!newName) {
    showCustomAlert("Perhatian", "Nama tim tidak boleh kosong!", "error");
    return;
  }
  
  // Cek apakah namanya bentrok dengan tim lain (selain dirinya sendiri)
  const isDuplicate = teamsList.some((t, i) => i !== editingTeamIndex && t.name.toLowerCase() === newName.toLowerCase());
  if (isDuplicate) {
    showCustomAlert("Perhatian", "Nama tim sudah dipakai oleh tim lain!", "error");
    return;
  }
  
  let newPlayers = [];
  document.querySelectorAll('.edit-player-name-input').forEach(input => {
    let p = input.value.trim();
    if (p) newPlayers.push(p);
  });
  
  const oldName = teamsList[editingTeamIndex].name;
  
  // Update Jadwal Jika Nama Tim Berubah
  if (oldName !== newName) {
    matchesList.forEach(m => {
      if (m.tim1 === oldName) m.tim1 = newName;
      if (m.tim2 === oldName) m.tim2 = newName;
    });
    localStorage.setItem('turnamen_matches_list', JSON.stringify(matchesList));
  }
  
  teamsList[editingTeamIndex].name = newName;
  teamsList[editingTeamIndex].players = newPlayers;
  localStorage.setItem('turnamen_teams', JSON.stringify(teamsList));
  
  closeEditTeamModal();
  renderTeamListAdmin();
  updateTeamSelectOptions();
  renderUI();
  showCustomAlert("Berhasil", "Data tim dan pemain berhasil diperbarui.", "success");
}

// Hapus Tim
function removeTeam(index) {
  let removed = teamsList.splice(index, 1);
  localStorage.setItem('turnamen_teams', JSON.stringify(teamsList));
  renderTeamListAdmin();
  updateTeamSelectOptions();
  showCustomAlert("Dihapus", `Tim "${removed[0].name}" dihapus.`, "success");
}

// Render UI Daftar Tim 
function renderTeamListAdmin() {
  const container = document.getElementById('team-list-admin');
  if (!container) return;
  
  if (teamsList.length === 0) {
    container.innerHTML = '<p style="font-size:0.85rem; color:#888;">Belum ada tim.</p>';
    return;
  }
  let html = '';
  teamsList.forEach((t, i) => {
    let pStr = t.players.length > 0 ? t.players.join(', ') : 'Tanpa pemain';
    html += `
      <div class="team-chip" style="min-width: 100%;">
        <div class="team-chip-header">
          <strong>${t.name}</strong>
          <div>
            <button type="button" class="btn-secondary" onclick="openEditTeamModal(${i})" style="padding:4px 8px; font-size:0.8rem; margin-right:4px;">✏️ Edit</button>
            <button type="button" class="btn-danger" onclick="removeTeam(${i})" style="padding:4px 8px; font-size:0.8rem;">&times;</button>
          </div>
        </div>
        <div class="team-players" style="margin-top: 5px;">Pemain: ${pStr}</div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// Mendapatkan daftar tim yang sudah dijadwalkan
function getScheduledTeams() {
  let scheduled = new Set();
  matchesList.forEach(m => {
    scheduled.add(m.tim1);
    scheduled.add(m.tim2);
  });
  return scheduled;
}

// Update Pilihan Dropdown Tim (Anti-Error)
function updateTeamSelectOptions() {
  const s1 = document.getElementById('match-team1');
  const s2 = document.getElementById('match-team2');
  
  if (!s1 || !s2) return; 

  let val1 = s1.value;
  let val2 = s2.value;
  let scheduledTeams = getScheduledTeams();

  let opts1 = '<option value="">-- Pilih Tim 1 --</option>';
  let opts2 = '<option value="">-- Pilih Tim 2 --</option>';

  teamsList.forEach(t => {
    let isScheduled1 = scheduledTeams.has(t.name) && t.name !== val1;
    let isScheduled2 = scheduledTeams.has(t.name) && t.name !== val2;

    if (!isScheduled1 || t.name === val1) {
      opts1 += `<option value="${t.name}" ${t.name === val1 ? 'selected' : ''}>${t.name}</option>`;
    }
    if (!isScheduled2 || t.name === val2) {
      opts2 += `<option value="${t.name}" ${t.name === val2 ? 'selected' : ''}>${t.name}</option>`;
    }
  });

  s1.innerHTML = opts1;
  s2.innerHTML = opts2;
}

// Admin Memasukkan Pertandingan Baru
function createBracketMatch() {
  const roundEl = document.getElementById('match-round');
  const t1El = document.getElementById('match-team1');
  const t2El = document.getElementById('match-team2');

  if (!roundEl || !t1El || !t2El) {
    alert("Error sistem: Elemen input tidak ditemukan!");
    return;
  }

  let round = roundEl.value.trim();
  let t1 = t1El.value;
  let t2 = t2El.value;

  if (!round || !t1 || !t2) {
    showCustomAlert("Perhatian", "Mohon lengkapi nama babak dan pilih kedua tim!", "error");
    return;
  }
  if (t1 === t2) {
    showCustomAlert("Perhatian", "Tim 1 dan Tim 2 tidak boleh sama!", "error");
    return;
  }

  let newMatch = {
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
  };

  matchesList.push(newMatch);
  localStorage.setItem('turnamen_matches_list', JSON.stringify(matchesList));

  roundEl.value = '';
  t1El.value = '';
  t2El.value = '';
  
  updateTeamSelectOptions();
  renderUI();
  showCustomAlert("Berhasil", "Pertandingan berhasil disusun. Atur jadwal waktunya di Tab Jadwal Pertandingan.", "success");
}

// Hapus Pertandingan
function deleteMatch(id) {
  matchesList = matchesList.filter(m => m.id !== id);
  localStorage.setItem('turnamen_matches_list', JSON.stringify(matchesList));
  updateTeamSelectOptions();
  renderUI();
}

// Simpan Jadwal & Skor dari Menu Jadwal
function saveMatchCard(id) {
  let match = matchesList.find(m => m.id === id);
  if (!match) return;

  const dateEl = document.getElementById(`date_${id}`);
  const timeEl = document.getElementById(`time_${id}`);
  const statusEl = document.getElementById(`status_${id}`);
  const skor1El = document.getElementById(`skor1_${id}`);
  const skor2El = document.getElementById(`skor2_${id}`);

  let rawDate = dateEl ? dateEl.value : match.rawDate;
  let rawTime = timeEl ? timeEl.value : match.rawTime;

  match.rawDate = rawDate;
  match.rawTime = rawTime;
  match.tanggal = formatCustomDate(rawDate, rawTime);
  
  if (statusEl) match.status = statusEl.value;
  if (skor1El) match.skor1 = parseInt(skor1El.value) || 0;
  if (skor2El) match.skor2 = parseInt(skor2El.value) || 0;

  localStorage.setItem('turnamen_matches_list', JSON.stringify(matchesList));
  showCustomAlert("Berhasil", "Jadwal dan skor berhasil diperbarui.", "success");
  renderUI();
}

// Navigasi Tab
function openTab(evt, tabName) {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  
  const targetTab = document.getElementById(tabName);
  if (targetTab) targetTab.classList.add('active');
  if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');
  
  renderUI();
}

// Modal Login
function toggleAdminLoginModal() {
  if (!isAdminLoggedIn) {
    const modal = document.getElementById('login-modal');
    if(modal) modal.style.display = 'flex';
    document.getElementById('admin-user').value = '';
    document.getElementById('admin-pass').value = '';
  } else {
    document.getElementById('admin-tab-btn').click();
  }
}

function closeLoginModal() { 
  const modal = document.getElementById('login-modal');
  if(modal) modal.style.display = 'none'; 
}

function processLogin() {
  let u = document.getElementById('admin-user').value.trim();
  let p = document.getElementById('admin-pass').value.trim();
  if (u === "admin" && p === "123456") {
    isAdminLoggedIn = true;
    localStorage.setItem('admin_logged_in', 'true');
    closeLoginModal();
    updateAdminUIState();
    showCustomAlert("Berhasil Masuk!", "Panel Admin terbuka.", "success");
    document.getElementById('admin-tab-btn').click();
  } else {
    showCustomAlert("Gagal", "Username atau password salah!", "error");
  }
}

function logoutAdmin() {
  isAdminLoggedIn = false;
  localStorage.setItem('admin_logged_in', 'false');
  updateAdminUIState();
  document.querySelector('.tabs .tab-btn').click();
  showCustomAlert("Keluar", "Anda telah keluar dari admin.", "success");
}

function updateAdminUIState() {
  let btnTab = document.getElementById('admin-tab-btn');
  let mainBtn = document.getElementById('admin-toggle-btn');
  if (!btnTab || !mainBtn) return;

  if (isAdminLoggedIn) {
    btnTab.style.display = 'block';
    mainBtn.innerText = '🛠️ Panel Admin';
    mainBtn.style.background = '#d4ac0d';
  } else {
    btnTab.style.display = 'none';
    mainBtn.innerText = '🔒 Login Admin';
    mainBtn.style.background = '';
  }
}

function showCustomAlert(title, msg, type) {
  let overlay = document.getElementById('custom-alert');
  let card = document.getElementById('alert-card-box');
  if (!overlay || !card) {
    alert(title + "\n" + msg);
    return;
  }
  card.className = "custom-alert-card " + type;
  document.getElementById('alert-emoji').innerText = type === 'success' ? '🎉' : '❌';
  document.getElementById('alert-title').innerText = title;
  document.getElementById('alert-message').innerText = msg;
  overlay.style.display = 'flex';
}

function closeCustomAlert() { 
  let overlay = document.getElementById('custom-alert');
  if(overlay) overlay.style.display = 'none'; 
}

// Render UI Jadwal dan Hasil
function renderUI() {
  const jContainer = document.getElementById('jadwal-container');
  const hContainer = document.getElementById('hasil-container');
  if (!jContainer || !hContainer) return;

  if (matchesList.length === 0) {
    jContainer.innerHTML = '<p class="empty">Belum ada jadwal pertandingan.</p>';
    hContainer.innerHTML = '<p class="empty">Belum ada hasil pertandingan.</p>';
    return;
  }

  let jHTML = '', hHTML = '';

  matchesList.forEach(m => {
    if (m.status === 'Mendatang' || m.status === 'Live') {
      jHTML += `
        <div class="match-card">
          <span class="badge ${m.status.toLowerCase()}">${m.status}</span>
          <p class="match-time">📅 ${m.tanggal} (${m.round})</p>
          <div class="teams-row">
            <span>${m.tim1}</span>
            <span class="vs">VS</span>
            <span>${m.tim2}</span>
          </div>
          ${m.status === 'Live' ? `<div style="color:red; margin-top:5px; font-weight:bold;">Skor: ${m.skor1} -${m.skor2}</div>` : ''}
          
          ${isAdminLoggedIn ? `
            <div class="admin-match-edit-box">
              <label style="font-size:0.8rem; font-weight:600;">Atur Jadwal (Opsional):</label>
              <div style="display:flex; gap:5px; margin-bottom:5px;">
                <input type="date" id="date_${m.id}" value="${m.rawDate || ''}" style="width:50%; padding:6px; border:1px solid #ccc; border-radius:4px;">
                <input type="time" id="time_${m.id}" value="${m.rawTime || ''}" style="width:50%; padding:6px; border:1px solid #ccc; border-radius:4px;">
              </div>
              <label style="font-size:0.8rem; font-weight:600;">Status & Skor:</label>
              <select id="status_${m.id}" style="width:100%; margin-bottom:5px; padding:6px;">
                <option value="Mendatang" ${m.status==='Mendatang'?'selected':''}>Mendatang</option>
                <option value="Live" ${m.status==='Live'?'selected':''}>Live</option>
                <option value="Selesai" ${m.status==='Selesai'?'selected':''}>Selesai</option>
              </select>
              <div class="skor-group">
                <input type="number" id="skor1_${m.id}" value="${m.skor1}" min="0" style="flex:1; padding:6px;" placeholder="Skor 1">
                <input type="number" id="skor2_${m.id}" value="${m.skor2}" min="0" style="flex:1; padding:6px;" placeholder="Skor 2">
              </div>
              <button type="button" class="btn-save" onclick="saveMatchCard('${m.id}')" style="margin-top:8px; width:100%;">💾 Simpan Perubahan</button>
              <button type="button" class="btn-danger" onclick="deleteMatch('${m.id}')" style="margin-top:6px; width:100%;">🗑️️ Hapus Pertandingan</button>
            </div>
          ` : ''}
        </div>
      `;
    } 
    else if (m.status === 'Selesai') {
      hHTML += `
        <div class="match-card">
          <span class="badge selesai">Selesai</span>
          <p class="match-time">📅 ${m.tanggal} (${m.round})</p>
          <div class="teams-row">
            <span>${m.tim1}</span>
            <span class="score">${m.skor1} - ${m.skor2}</span>
            <span>${m.tim2}</span>
          </div>
          ${isAdminLoggedIn ? `
            <div class="admin-match-edit-box">
              <select id="status_${m.id}" style="width:100%; margin-bottom:5px; padding:6px;">
                <option value="Mendatang">Mendatang</option>
                <option value="Live">Live</option>
                <option value="Selesai" selected>Selesai</option>
              </select>
              <div class="skor-group">
                <input type="number" id="skor1_${m.id}" value="${m.skor1}" min="0" style="flex:1; padding:6px;">
                <input type="number" id="skor2_${m.id}" value="${m.skor2}" min="0" style="flex:1; padding:6px;">
              </div>
              <input type="hidden" id="date_${m.id}" value="${m.rawDate || ''}">
              <input type="hidden" id="time_${m.id}" value="${m.rawTime || ''}">
              <button type="button" class="btn-save" onclick="saveMatchCard('${m.id}')" style="margin-top:8px; width:100%;">💾 Koreksi Hasil</button>
              <button type="button" class="btn-danger" onclick="deleteMatch('${m.id}')" style="margin-top:6px; width:100%;">🗑️ Hapus Pertandingan</button>
            </div>
          ` : ''}
        </div>
      `;
    }
  });

  jContainer.innerHTML = jHTML || '<p class="empty">Tidak ada jadwal aktif.</p>';
  hContainer.innerHTML = hHTML || '<p class="empty">Belum ada hasil pertandingan.</p>';
}
