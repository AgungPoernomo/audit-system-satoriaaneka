// ==========================================
// 1. URL GOOGLE APPS SCRIPT (WEB APP)
// ==========================================
// GANTI teks di dalam tanda kutip ini dengan URL Deployment Baru Anda!
const scriptURL = "https://script.google.com/macros/s/AKfycbw0Si5RkRYTEyZKEzzfBPfrAGQUgHWiXBIyKHN7hMTi7gARm3u41MYAZBV8uOieekkY/exec";

// ==========================================
// 2. FUNGSI INTI PENGIRIMAN DATA 
// ==========================================
export async function fetchApi(payload: any) {
    try {
        const response = await fetch(scriptURL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return await response.json();
    } catch (error: unknown) {
        console.error('Gagal menghubungi server:', error);
        
        // Memastikan TypeScript tahu bagaimana cara mengekstrak pesan error dari tipe 'unknown'
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        return { status: 'error', message: errorMessage };
    }
}


// ==========================================
// 3. KUMPULAN RUTE API
// ==========================================

// --- Rute Auth ---
// Menambahkan tipe data 'string' untuk parameter username dan password
export async function loginUser(username: string, password: string) {
    return await fetchApi({ action: 'login', username: username, password: password });
}

// --- Rute Audit Checklist ---
export async function getChecklistItems() {
    return await fetchApi({ action: 'getChecklist' });
}

// Menambahkan tipe data 'any' secara eksplisit
export async function saveAuditData(payload: any) {
    return await fetchApi(payload); 
}

// --- Rute Scoring / Leaderboard ---
export async function getScoringRanking() {
    return await fetchApi({ action: 'getScoringData' });
}

// --- Rute Master Outdoor Map ---
export async function getMasterMapData() {
    return await fetchApi({ action: 'getMasterMap' });
}

// Menambahkan tipe data 'any' secara eksplisit
export async function saveMasterMapData(payload: any) {
    return await fetchApi(payload); 
}