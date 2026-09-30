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

// Update Pilihan Dropdown Tim di Panel Admin
function updateTeamSelectOptions() {
  const s1 = document.getElementById('match-team1');
  const s2 = document.getElementById('match-team2');
  let opts = '<option value="">-- Pilih Tim --</option>';
  teamsList.forEach(t => {
    opts += `<option value="${t.name}">${t.name}</option>`;
  });
  s1.innerHTML = opts;
  s2.innerHTML = opts;
}

// Buat Jadwal Pertandingan Baru Manual
function createNewMatch() {
  let round = document.getElementById('match-round').value.trim();
  let t1 = document.getElementById('match-team1').value;
  let t2 = document.getElementById('match-team2').value;
  let date = document.getElementById('match-date').value.trim();

  if (!round || !t1 || !t2) {
    showCustomAlert("Perhatian", "Mohon lengkapi babak dan pilih kedua tim!", "error");
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
    tanggal: date || 'Segera',
    status: 'Mendatang',
    skor1: 0,
    skor2: 0
  };

  matchesList.push(newMatch);
  localStorage.setItem('turnamen_matches_list', JSON.stringify(matchesList));

  document.getElementById('match-round').value = '';
  document.getElementById('match-date').value = '';
  renderUI();
  showCustomAlert("Berhasil", "Jadwal pertandingan berhasil ditambahkan.", "success");
}

// Hapus Pertandingan
function deleteMatch(id) {
  matchesList = matchesList.filter(m => m.id !== id);
  localStorage.setItem('turnamen_matches_list', JSON.stringify(matchesList));
  renderUI();
}

// Simpan Update Pertandingan dari Kartu Jadwal
function saveMatchCard(id) {
  let match = matchesList.find(m => m.id === id);
  if (!match) return;

  match.tanggal = document.getElementById(`date_${id}`).value || 'Segera';
  match.status = document.getElementById(`status_${id}`).value;
  match.skor1 = parseInt(document.getElementById(`skor1_${id}`).value) || 0;
  match.skor2 = parseInt(document.getElementById(`skor2_${id}`).value) || 0;

  localStorage.setItem('turnamen_matches_list', JSON.stringify(matchesList));
  showCustomAlert("Berhasil", "Perubahan pertandingan disimpan.", "success");
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
    showCustomAlert("Berhasil Masuk!", "Panel Admin kini terbuka.", "success");
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

// Render UI Jadwal, Hasil, dan Bagan
function renderUI() {
  const jContainer = document.getElementById('jadwal-container');
  const hContainer = document.getElementById('hasil-container');
  const bContainer = document.getElementById('bagan-container');

  if (matchesList.length === 0) {
    jContainer.innerHTML = '<p class="empty">Belum ada jadwal pertandingan.</p>';
    hContainer.innerHTML = '<p class="empty">Belum ada hasil pertandingan.</p>';
    bContainer.innerHTML = '<p class="empty">Bagan kosong.</p>';
    return;
  }

  let jHTML = '', hHTML = '';
  let roundsMap = {};

  matchesList.forEach(m => {
    if (!roundsMap[m.round]) roundsMap[m.round] = [];
    roundsMap[m.round].push(m);

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
              <input type="text" id="date_${m.id}" value="${m.tanggal}" placeholder="Waktu" style="width:100%; margin-bottom:5px; padding:5px;">
              <select id="status_${m.id}" style="width:100%; margin-bottom:5px; padding:5px;">
                <option value="Mendatang" ${m.status==='Mendatang'?'selected':''}>Mendatang</option>
                <option value="Live" ${m.status==='Live'?'selected':''}>Live</option>
                <option value="Selesai" ${m.status==='Selesai'?'selected':''}>Selesai</option>
              </select>
              <div class="skor-group">
                <input type="number" id="skor1_${m.id}" value="${m.skor1}" min="0" style="flex:1; padding:5px;">
                <input type="number" id="skor2_${m.id}" value="${m.skor2}" min="0" style="flex:1; padding:5px;">
              </div>
              <button type="button" class="btn-save" onclick="saveMatchCard('${m.id}')" style="margin-top:6px; width:100%;">💾 Simpan</button>
              <button type="button" class="btn-danger" onclick="deleteMatch('${m.id}')" style="margin-top:4px; width:100%;">🗑️ Hapus Laga</button>
            </div>
          ` : ''}
        </div>
      `;
    } else if (m.status === 'Selesai') {
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
              <select id="status_${m.id}" style="width:100%; margin-bottom:5px; padding:5px;">
                <option value="Mendatang">Mendatang</option>
                <option value="Live">Live</option>
                <option value="Selesai" selected>Selesai</option>
              </select>
              <div class="skor-group">
                <input type="number" id="skor1_${m.id}" value="${m.skor1}" min="0" style="flex:1; padding:5px;">
                <input type="number" id="skor2_${m.id}" value="${m.skor2}" min="0" style="flex:1; padding:5px;">
              </div>
              <input type="hidden" id="date_${m.id}" value="${m.tanggal}">
              <button type="button" class="btn-save" onclick="saveMatchCard('${m.id}')" style="margin-top:6px; width:100%;">💾 Koreksi</button>
              <button type="button" class="btn-danger" onclick="deleteMatch('${m.id}')" style="margin-top:4px; width:100%;">🗑️ Hapus Laga</button>
            </div>
          ` : ''}
        </div>
      `;
    }
  });

  jContainer.innerHTML = jHTML || '<p class="empty">Tidak ada jadwal aktif.</p>';
  hContainer.innerHTML = hHTML || '<p class="empty">Belum ada hasil pertandingan.</p>';

  // Render Bagan
  let bHTML = '<div class="bracket-wrapper">';
  for (let r in roundsMap) {
    bHTML += `<div class="round"><h4>${r}</h4>`;
    roundsMap[r].forEach(m => {
      let isF = r.toLowerCase().includes('final') && !r.toLowerCase().includes('semi');
      bHTML += `<div class="b-match ${isF ? 'final' : ''}"><span>${m.tim1} vs ${m.tim2}</span></div>`;
    });
    bHTML += `</div>`;
  }
  bHTML += `</div>`;
  bContainer.innerHTML = bHTML;
}
