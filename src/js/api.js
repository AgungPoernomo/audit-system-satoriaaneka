// ==========================================
// 1. URL GOOGLE APPS SCRIPT (WEB APP)
// ==========================================
// GANTI teks di dalam tanda kutip ini dengan URL Deployment Baru Anda!
const scriptURL = "https://script.google.com/macros/s/AKfycbw0Si5RkRYTEyZKEzzfBPfrAGQUgHWiXBIyKHN7hMTi7gARm3u41MYAZBV8uOieekkY/exec";


// ==========================================
// 2. FUNGSI INTI PENGIRIMAN DATA (Ini yang tadi hilang!)
// ==========================================
async function fetchApi(payload) {
    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return await response.json();
    } catch (error) {
        console.error('Gagal menghubungi server:', error);
        return { status: 'error', message: error.message };
    }
}


// ==========================================
// 3. KUMPULAN RUTE API
// ==========================================

// --- Rute Auth ---
async function loginUser(username, password) {
    return await fetchApi({ action: 'login', username: username, password: password });
}

// --- Rute Audit Checklist ---
async function getChecklistItems() {
    return await fetchApi({ action: 'getChecklist' });
}

async function saveAuditData(payload) {
    return await fetchApi(payload); // payload sudah berisi action: 'saveAudit' dari main.js
}

// --- Rute Scoring / Leaderboard ---
async function getScoringRanking() {
    return await fetchApi({ action: 'getScoringData' });
}

// --- Rute Master Outdoor Map ---
async function getMasterMapData() {
    return await fetchApi({ action: 'getMasterMap' });
}

async function saveMasterMapData(payload) {
    return await fetchApi(payload); // payload sudah berisi action: 'uploadMasterMap' dari main.js
}