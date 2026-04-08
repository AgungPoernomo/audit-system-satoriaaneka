// Ganti dengan URL Web App Anda yang sebenarnya
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyPJ70WTKA0HpVUWEZu_hShWxEp_28LXp2z-IGCJKIV0qTuPUSo64eabosMCm0vj_M/exec'; 

async function loginUser(username, password) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "login", username: username, password: password }) // Tambah action
        });
        return await response.json();
    } catch (error) {
        return { status: 'error', message: 'Koneksi gagal.' };
    }
}

// Fungsi baru untuk mengambil item checklist
async function getChecklistItems() {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "getChecklist" }) // Action getChecklist
        });
        return await response.json();
    } catch (error) {
        console.error("Gagal mengambil data checklist", error);
        return { status: 'error' };
    }
}

async function saveAuditData(payload) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
        return await response.json();
    } catch (error) {
        return { status: 'error' };
    }
}

// Fungsi mengambil data ranking dari sheet Scoring
async function getScoringRanking() {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "getScoringData" })
        });
        return await response.json();
    } catch (error) {
        console.error("Gagal mengambil data scoring", error);
        return { status: 'error' };
    }
}