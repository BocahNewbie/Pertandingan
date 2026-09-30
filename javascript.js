// Ganti URL ini dengan URL Web App dari Google Apps Script Anda setelah di-deploy
const APPS_SCRIPT_URL = "https://google.com";

// Fungsi untuk berpindah Tab
function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }

    const tabButtons = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("active");
    }

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

// Fungsi mengambil data dari Google Apps Script saat halaman dibuka
async function loadTournamentData() {
    try {
        const response = await fetch(APPS_SCRIPT_URL);
        const data = await response.json();
        
        renderJadwal(data.jadwal);
        renderHasil(data.hasil);
        renderBagan(data.bagan);
    } catch (error) {
        console.error("Gagal memuat data turnamen:", error);
    }
}

function renderJadwal(jadwalList) {
    const container = document.getElementById("jadwal-container");
    container.innerHTML = ""; 
    
    jadwalList.forEach(match => {
        container.innerHTML += `
            <div class="match-card">
                <div class="match-info">
                    <div class="match-date">${match.tanggal} | ${match.babak}</div>
                    <div class="match-teams">${match.tim1} <span class="match-vs">VS</span> ${match.tim2}</div>
                </div>
                <span class="status-badge ${match.status === 'Live' ? 'status-live' : 'status-upcoming'}">${match.status}</span>
            </div>`;
    });
}

function renderHasil(hasilList) {
    const container = document.getElementById("hasil-container");
    container.innerHTML = "";
    
    hasilList.forEach(match => {
        container.innerHTML += `
            <div class="match-card">
                <div class="match-info">
                    <div class="match-date">${match.tanggal} | ${match.babak}</div>
                    <div class="match-teams">${match.tim1} <span class="match-vs">VS</span> ${match.tim2}</div>
                </div>
                <div class="match-score">${match.skor1} - ${match.skor2}</div>
            </div>`;
    });
}

function renderBagan(baganData) {
    const container = document.getElementById("bagan-container");
    container.innerHTML = `
        <div class="round">
            <div class="round-title">Semifinal</div>
            <div class="bracket-match">
                <div class="bracket-team">${baganData.sf1_tim1}</div>
                <div class="bracket-team">${baganData.sf1_tim2}</div>
            </div>
            <div class="bracket-match">
                <div class="bracket-team">${baganData.sf2_tim1}</div>
                <div class="bracket-team">${baganData.sf2_tim2}</div>
            </div>
        </div>
        <div class="round">
            <div class="round-title">Final</div>
            <div class="bracket-match">
                <div class="bracket-team">${baganData.f_tim1}</div>
                <div class="bracket-team">${baganData.f_tim2}</div>
            </div>
        </div>
        <div class="round">
            <div class="round-title">🏆 Juara</div>
            <div class="bracket-match" style="text-align: center; padding: 15px; font-weight: bold; color: #b45309; background: #fef3c7;">
                ${baganData.juara || '???'}
            </div>
        </div>`;
}

// Jalankan pengambilan data secara otomatis saat web dimuat
window.onload = loadTournamentData;

