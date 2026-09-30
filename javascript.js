const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwzC7lfRvxIpee3Mtdz8Va5Qm2BEj9WnMZmsnfepGqWduwZLpr4nQEQKjPQ-MK9jH3i/exec"; // Ganti dengan URL Web App Anda
let globalData = {};
let isAdmin = false;

function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) tabContents[i].classList.remove("active");
    const tabButtons = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabButtons.length; i++) tabButtons[i].classList.remove("active");
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");
}

function toggleAdminPanel() {
    if (!isAdmin) {
        let password = prompt("Masukkan Password Admin:");
        if (password === "admin123") { // Ganti password Anda di sini
            isAdmin = true;
            document.getElementById("admin-panel").style.display = "block";
            document.getElementById("admin-toggle-btn").innerText = "🔓 Logout Admin";
        } else {
            alert("Password Salah!");
        }
    } else {
        isAdmin = false;
        document.getElementById("admin-panel").style.display = "none";
        document.getElementById("admin-toggle-btn").innerText = "🔒 Login Admin";
    }
}

async function loadTournamentData() {
    try {
        const response = await fetch(APPS_SCRIPT_URL);
        globalData = await response.json();
        renderWeb();
    } catch (error) {
        console.error("Gagal mengambil data:", error);
    }
}

function renderWeb() {
    renderJadwalDanHasil(globalData.pertandingan);
    renderBagan(globalData.bagan);
}

function renderJadwalDanHasil(matches) {
    const jadwalContainer = document.getElementById("jadwal-container");
    const hasilContainer = document.getElementById("hasil-container");
    jadwalContainer.innerHTML = "";
    hasilContainer.innerHTML = "";

    matches.forEach(match => {
        if (match.status === "Selesai") {
            hasilContainer.innerHTML += `
                <div class="match-card">
                    <div class="match-info">
                        <div class="match-date">${match.tanggal} | ${match.id}</div>
                        <div class="match-teams">${match.tim1} <span class="match-vs">VS</span> ${match.tim2}</div>
                    </div>
                    <div class="match-score">${match.skor1} - ${match.skor2}</div>
                </div>`;
        } else {
            let badgeClass = match.status === "Live" ? "status-live" : "status-upcoming";
            jadwalContainer.innerHTML += `
                <div class="match-card">
                    <div class="match-info">
                        <div class="match-date">${match.tanggal} | ${match.id}</div>
                        <div class="match-teams">${match.tim1} <span class="match-vs">VS</span> ${match.tim2}</div>
                    </div>
                    <span class="status-badge ${badgeClass}">${match.status}</span>
                </div>`;
        }
    });
}

function renderBagan(bagan) {
    const container = document.getElementById("bagan-container");
    container.innerHTML = `
        <div class="round">
            <div class="round-title">Semifinal</div>
            <div class="bracket-match">
                <div class="bracket-team ${bagan.sf1_pemenang === bagan.sf1_tim1 && bagan.sf1_pemenang !== '?' ? 'winner' : ''}">${bagan.sf1_tim1}</div>
                <div class="bracket-team ${bagan.sf1_pemenang === bagan.sf1_tim2 && bagan.sf1_pemenang !== '?' ? 'winner' : ''}">${bagan.sf1_tim2}</div>
            </div>
            <div class="bracket-match" style="margin-top:20px;">
                <div class="bracket-team ${bagan.sf2_pemenang === bagan.sf2_tim1 && bagan.sf2_pemenang !== '?' ? 'winner' : ''}">${bagan.sf2_tim1}</div>
                <div class="bracket-team ${bagan.sf2_pemenang === bagan.sf2_tim2 && bagan.sf2_pemenang !== '?' ? 'winner' : ''}">${bagan.sf2_tim2}</div>
            </div>
        </div>
        <div class="round">
            <div class="round-title">Final</div>
            <div class="bracket-match">
                <div class="bracket-team ${bagan.juara === bagan.f_tim1 && bagan.juara !== '?' ? 'winner' : ''}">${bagan.f_tim1}</div>
                <div class="bracket-team ${bagan.juara === bagan.f_tim2 && bagan.juara !== '?' ? 'winner' : ''}">${bagan.f_tim2}</div>
            </div>
        </div>
        <div class="round">
            <div class="round-title">🏆 Juara</div>
            <div class="bracket-match" style="text-align: center; padding: 15px; font-weight: bold; color: #b45309; background: #fef3c7;">
                ${bagan.juara}
            </div>
        </div>`;
}

function onMatchSelectChange() {
    const id = document.getElementById("match-select").value;
    const statusSelect = document.getElementById("admin-status");
    const skorArea = document.getElementById("skor-input-area");
    
    if(!id) return;
    
    const match = globalData.pertandingan.find(m => m.id === id);
    document.getElementById("admin-tim1").value = match.tim1;
    document.getElementById("admin-tim2").value = match.tim2;
    document.getElementById("admin-tanggal").value = match.tanggal;
    statusSelect.value = match.status;

    statusSelect.onchange = function() {
        skorArea.style.display = this.value === "Selesai" ? "flex" : "none";
    };
    skorArea.style.display = match.status === "Selesai" ? "flex" : "none";
    document.getElementById("admin-skor1").value = match.skor1 || 0;
    document.getElementById("admin-skor2").value = match.skor2 || 0;
}

async function saveMatchData() {
    const id = document.getElementById("match-select").value;
    if(!id) return alert("Pilih pertandingan terlebih dahulu!");

    const payload = {
        id: id,
        tim1: document.getElementById("admin-tim1").value,
        tim2: document.getElementById("admin-tim2").value,
        tanggal: document.getElementById("admin-tanggal").value,
        status: document.getElementById("admin-status").value,
        skor1: parseInt(document.getElementById("admin-skor1").value) || 0,
        skor2: parseInt(document.getElementById("admin-skor2").value) || 0
    };

    try {
        alert("Sedang menyimpan data ke Google Sheets...");
        const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if(result.status === "success") {
            alert("Data Berhasil Disimpan & Bagan Ter-update!");
            loadTournamentData(); // Refresh data halaman web
        }
    } catch (e) {
        alert("Gagal menyimpan data.");
    }
}

window.onload = loadTournamentData;
