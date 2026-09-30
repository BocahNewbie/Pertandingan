let teamsList = JSON.parse(localStorage.getItem('turnamen_teams')) || [];
let matchesList = JSON.parse(localStorage.getItem('turnamen_matches_list')) || [];
let isAdminLoggedIn = JSON.parse(localStorage.getItem('admin_logged_in')) || false;

document.addEventListener('DOMContentLoaded', () => {
  renderTeamListAdmin();
  updateTeamSelectOptions();
  renderUI();
  updateAdminUIState();
});

// Tambah Kolom Pemain
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

// Tambah Tim
function addTeam() {
  const nameInput = document.getElementById('new-team-name');
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

// Hapus Tim
function removeTeam(index) {
  let removed = teamsList.splice(index, 1);
  localStorage.setItem('turnamen_teams', JSON.stringify(teamsList));
  renderTeamListAdmin();
  updateTeamSelectOptions();
  showCustomAlert("Dihapus", `Tim "${removed[0].name}" dihapus.`, "success");
}

function renderTeamListAdmin() {
  const container = document.getElementById('team-list-admin');
  if (teamsList.length === 0) {
    container.innerHTML = '<p style="font-size:0.85rem; color:#888;">Belum ada tim.</p>';
    return;
  }
  let html = '';
  teamsList.forEach((t, i) => {
    let pStr = t.players.length > 0 ? t.players.join(', ') : 'Tanpa pemain';
    html += `
      <div class="team-chip">
        <div class="team-chip-header">
          <strong>${t.name}</strong>
          <button type="button" class="btn-danger" onclick="removeTeam(${i})" style="padding:0 6px; font-size:0.8rem;">&times;</button>
        </div>
        <div class="team-players">Pemain: ${pStr}</div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// Mendapatkan daftar tim yang sudah dijadwalkan bertanding
function getScheduledTeams() {
  let scheduled = new Set();
  matchesList.forEach(m => {
    scheduled.add(m.tim1);
    scheduled.add(m.tim2);
  });
  return scheduled;
}

// Update Pilihan Dropdown Tim (Mencegah tim yang sudah terjadwal dipilih kembali)
function updateTeamSelectOptions() {
  const s1 = document.getElementById('match-team1');
  const s2 = document.getElementById('match-team2');
  
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
  let round = document.getElementById('match-round').value.trim();
  let t1 = document.getElementById('match-team1').value;
  let t2 = document.getElementById('match-team2').value;

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
    tanggal: 'Belum diatur',
    status: 'Mendatang',
    skor1: 0,
    skor2: 0
  };

  matchesList.push(newMatch);
  localStorage.setItem('turnamen_matches_list', JSON.stringify(matchesList));

  document.getElementById('match-round').value = '';
  document.getElementById('match-team1').value = '';
  document.getElementById('match-team2').value = '';
  
  updateTeamSelectOptions();
  renderUI();
  showCustomAlert("Berhasil", "Jadwal pertandingan berhasil ditambahkan.", "success");
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

  match.tanggal = document.getElementById(`date_${id}`).value || 'Segera';
  match.status = document.getElementById(`status_${id}`).value;
  match.skor1 = parseInt(document.getElementById(`skor1_${id}`).value) || 0;
  match.skor2 = parseInt(document.getElementById(`skor2_${id}`).value) || 0;

  localStorage.setItem('turnamen_matches_list', JSON.stringify(matchesList));
  showCustomAlert("Berhasil", "Jadwal dan skor berhasil diperbarui.", "success");
  renderUI();
}

// Navigasi Tab
function openTab(evt, tabName) {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  evt.currentTarget.classList.add('active');
  renderUI();
}

// Modal Login
function toggleAdminLoginModal() {
  if (!isAdminLoggedIn) {
    document.getElementById('login-modal').style.display = 'flex';
    document.getElementById('admin-user').value = '';
    document.getElementById('admin-pass').value = '';
  } else {
    document.getElementById('admin-tab-btn').click();
  }
}
function closeLoginModal() { document.getElementById('login-modal').style.display = 'none'; }

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
  card.className = "custom-alert-card " + type;
  document.getElementById('alert-emoji').innerText = type === 'success' ? '🎉' : '❌';
  document.getElementById('alert-title').innerText = title;
  document.getElementById('alert-message').innerText = msg;
  overlay.style.display = 'flex';
}
function closeCustomAlert() { document.getElementById('custom-alert').style.display = 'none'; }

// Render UI Jadwal dan Hasil
function renderUI() {
  const jContainer = document.getElementById('jadwal-container');
  const hContainer = document.getElementById('hasil-container');

  if (matchesList.length === 0) {
    jContainer.innerHTML = '<p class="empty">Belum ada jadwal pertandingan.</p>';
    hContainer.innerHTML = '<p class="empty">Belum ada hasil pertandingan.</p>';
    return;
  }

  let jHTML = '', hHTML = '';

  matchesList.forEach(m => {
    // Render Jadwal (Mendatang / Live)
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
              <input type="text" id="date_${m.id}" value="${m.tanggal}" placeholder="Atur Waktu (Contoh: Sabtu, 15:00)" style="width:100%; margin-bottom:5px; padding:6px;">
              <select id="status_${m.id}" style="width:100%; margin-bottom:5px; padding:6px;">
                <option value="Mendatang" ${m.status==='Mendatang'?'selected':''}>Mendatang</option>
                <option value="Live" ${m.status==='Live'?'selected':''}>Live</option>
                <option value="Selesai" ${m.status==='Selesai'?'selected':''}>Selesai</option>
              </select>
              <div class="skor-group">
                <input type="number" id="skor1_${m.id}" value="${m.skor1}" min="0" style="flex:1; padding:6px;" placeholder="Skor 1">
                <input type="number" id="skor2_${m.id}" value="${m.skor2}" min="0" style="flex:1; padding:6px;" placeholder="Skor 2">
              </div>
              <button type="button" class="btn-save" onclick="saveMatchCard('${m.id}')" style="margin-top:8px; width:100%;">💾 Simpan Jadwal & Skor</button>
              <button type="button" class="btn-danger" onclick="deleteMatch('${m.id}')" style="margin-top:6px; width:100%;">🗑️ Hapus Jadwal</button>
            </div>
          ` : ''}
        </div>
      `;
    } 
    // Render Hasil (Selesai)
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
              <input type="hidden" id="date_${m.id}" value="${m.tanggal}">
              <button type="button" class="btn-save" onclick="saveMatchCard('${m.id}')" style="margin-top:8px; width:100%;">💾 Koreksi Hasil</button>
              <button type="button" class="btn-danger" onclick="deleteMatch('${m.id}')" style="margin-top:6px; width:100%;">🗑️ Hapus Jadwal</button>
            </div>
          ` : ''}
        </div>
      `;
    }
  });

  jContainer.innerHTML = jHTML || '<p class="empty">Tidak ada jadwal aktif.</p>';
  hContainer.innerHTML = hHTML || '<p class="empty">Belum ada hasil pertandingan.</p>';
}
