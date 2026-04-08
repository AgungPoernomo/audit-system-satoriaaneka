document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. LOGIKA HALAMAN LOGIN
    // ==========================================
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault(); 
            
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const submitBtn = this.querySelector('button[type="submit"]'); 
            const originalText = submitBtn.querySelector('span').innerText;

            submitBtn.querySelector('span').innerText = 'Memverifikasi...';
            submitBtn.style.opacity = '0.7';
            submitBtn.disabled = true;

            const response = await loginUser(usernameInput.value, passwordInput.value);

            submitBtn.querySelector('span').innerText = originalText;
            submitBtn.style.opacity = '1';
            submitBtn.disabled = false;

            if (response.status === 'success') {
                sessionStorage.setItem('userLogin', JSON.stringify(response.data));
                window.location.href = 'dashboard.html';
            } else {
                alert(`Login Gagal: ${response.message}`);
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }

    // ==========================================
    // 2. LOGIKA HALAMAN DASHBOARD & ROUTING
    // ==========================================
    const dashboardApp = document.getElementById('dashboard-app');
    if (dashboardApp) {
        
        const userDataString = sessionStorage.getItem('userLogin');
        if (!userDataString) {
            window.location.href = 'login.html';
            return; 
        }
        
        const user = JSON.parse(userDataString);
        
        const userNameDisplay = document.getElementById('userNameDisplay');
        const userRoleDisplay = document.getElementById('userRoleDisplay');
        if(userNameDisplay) userNameDisplay.innerText = user.namaLengkap;
        if(userRoleDisplay) userRoleDisplay.innerText = user.role;

        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                sessionStorage.removeItem('userLogin');
                window.location.href = 'login.html';
            });
        }

        // --- Logika Mobile Toggle ---
        const mobileToggle = document.getElementById('mobileToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if(mobileToggle) {
            const toggleMenu = () => {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            };
            mobileToggle.addEventListener('click', toggleMenu);
            overlay.addEventListener('click', toggleMenu);
        }

        // --- Logika Menu & Hash ---
        const navItems = document.querySelectorAll('.nav-item[href^="#"]');
        const pageTitle = document.getElementById('pageTitle');
        const contentArea = document.querySelector('.content-area');

        function loadContent(selectedTitle) {
            if(pageTitle) pageTitle.innerText = selectedTitle;

            if (selectedTitle === "Audit Checklist") {
                renderAuditForm(contentArea, user); 
            } else if (selectedTitle === "Scorring (Penilaian)") {
                // Panggil fungsi render baru
                renderScoringPage(contentArea);
            } else if (selectedTitle === "Dashboard Utama") {
                contentArea.innerHTML = `
                    <div class="content-placeholder">
                        <div class="glow-icon">✦</div>
                        <h2>Sistem Audit Terkoneksi</h2>
                        <p>Sistem siap digunakan. Pilih modul di navigasi sebelah kiri untuk mengelola data perusahaan.</p>
                    </div>`;
            } else {
                contentArea.innerHTML = `
                    <div class="content-placeholder">
                        <div class="glow-icon">⚙️</div>
                        <h2>Modul ${selectedTitle}</h2>
                        <p>Modul ini sedang dalam tahap pengembangan.</p>
                    </div>`;
            }
        }

        navItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault(); 
                const targetHash = this.getAttribute('href');
                history.pushState(null, null, targetHash);
                
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');
                loadContent(this.getAttribute('data-title'));

                // Auto close sidebar di mobile setelah klik menu
                if(window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            });
        });

        function handleUrlChange() {
            const currentHash = window.location.hash || '#dashboard';
            const activeMenu = document.querySelector(`.nav-item[href="${currentHash}"]`);
            
            if (activeMenu) {
                navItems.forEach(nav => nav.classList.remove('active'));
                activeMenu.classList.add('active');
                loadContent(activeMenu.getAttribute('data-title'));
            }
        }

        window.addEventListener('popstate', handleUrlChange);
        handleUrlChange(); 
    }
});

// ==========================================
// 3. FUNGSI RENDER FORM AUDIT CHECKLIST
// ==========================================
async function renderAuditForm(container, user) {
    const today = new Date().toISOString().split('T')[0];
    
    container.innerHTML = `
        <div class="content-placeholder">
            <div class="glow-icon" style="animation: pulse 1s infinite">⏳</div>
            <h2>Mengunduh Data...</h2>
            <p>Menghubungkan ke Database.</p>
        </div>
    `;

    const response = await getChecklistItems();
    
    if (response.status !== 'success') {
        container.innerHTML = `<div class="content-placeholder"><div class="glow-icon" style="color: #EF4444;">⚠️</div><h2>Koneksi Gagal</h2><p>Gagal memuat data dari database.</p></div>`;
        return;
    }

    const categoriesData = response.data;
    
    const legendHtml = `
        <div class="score-legend">
            <strong>Ketentuan Skor:</strong>
            <div class="legend-item"><span class="l-dot" style="background:#EF4444"></span> 0 : Perlu Perbaikan (temuan >3)</div>
            <div class="legend-item"><span class="l-dot" style="background:#F59E0B"></span> 3 : Perawatan (temuan 1)</div>
            <div class="legend-item"><span class="l-dot" style="background:#10B981"></span> 5 : Excellence (0 temuan)</div>
        </div>
    `;

    let html = `
        <form id="auditForm" class="audit-form">
            <div class="form-section meta-data">
                <div class="input-col"><label>Tanggal Audit</label><input type="date" id="tglAudit" value="${today}" required></div>
                <div class="input-col"><label>Nama Auditor</label><input type="text" id="namaAuditor" value="${user.namaLengkap}" readonly></div>
                <div class="input-col"><label>Nama Area</label><input type="text" id="namaArea" placeholder="Contoh: Produksi Line 1" required></div>
                <div class="input-col"><label>Code Area</label><input type="text" id="codeArea" placeholder="Contoh: PRD-01" required></div>
            </div>
            ${legendHtml}
            <div class="categories-container">
    `;

    const categoryNames = ["Ringkas", "Rapi", "Resik", "Rawat", "Rajin", "Safety"];
    
    categoryNames.forEach((cat) => {
        const items = categoriesData[cat] || [];
        if (items.length > 0) {
            html += `<div class="category-card"><h3 class="category-title">${cat}</h3><div class="audit-items">`;
            
            items.forEach((item, index) => {
                const inputName = `score_${cat}_${index}`;
                const fileId = `photo_${cat}_${index}`;
                
                html += `
                    <div class="audit-item">
                        <div class="item-content">
                            <p class="item-desc"><strong>${index + 1}. ${item.pertanyaan}</strong></p>
                            <p class="item-standard"><em>Standar: ${item.standar}</em></p>
                            
                            <div class="evidence-upload">
                                <input type="file" id="${fileId}" name="${fileId}" accept="image/*" capture="environment" class="file-input">
                                <label for="${fileId}" class="btn-upload">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                                    Ambil Foto
                                </label>
                                <span class="file-name" id="name_${fileId}">Belum ada bukti</span>
                            </div>
                        </div>

                        <div class="scoring-group">
                            <label class="score-radio s-0" title="Perlu Perbaikan (>3 Temuan)">
                                <input type="radio" name="${inputName}" value="0" required> <span>0</span>
                            </label>
                            <label class="score-radio s-3" title="Perawatan (1 Temuan)">
                                <input type="radio" name="${inputName}" value="3"> <span>3</span>
                            </label>
                            <label class="score-radio s-5" title="Excellence (0 Temuan)">
                                <input type="radio" name="${inputName}" value="5"> <span>5</span>
                            </label>
                        </div>
                    </div>
                `;
            });
            html += `</div></div>`; 
        }
    });

    html += `
            </div>
            <button type="submit" class="btn-web3 submit-audit"><span>Kirim Hasil Audit</span></button>
        </form>
    `;

    container.innerHTML = html;

    // Logika UI Foto
    document.querySelectorAll('.file-input').forEach(input => {
        input.addEventListener('change', function(e) {
            const fileNameSpan = document.getElementById(`name_${this.id}`);
            if (this.files && this.files.length > 0) {
                fileNameSpan.innerText = "✓ Foto terekam";
                fileNameSpan.style.color = "#10B981"; 
                fileNameSpan.style.fontWeight = "600";
            } else {
                fileNameSpan.innerText = "Belum ada bukti";
                fileNameSpan.style.color = "var(--text-muted)";
                fileNameSpan.style.fontWeight = "400";
            }
        });
    });

    // Logika Kumpul & Kirim Data
    document.getElementById('auditForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = this.querySelector('.submit-audit');
        btn.disabled = true;
        btn.querySelector('span').innerText = "Menyimpan Data...";

        const payload = {
            action: "saveAudit",
            tglAudit: document.getElementById('tglAudit').value,
            namaAuditor: document.getElementById('namaAuditor').value,
            namaArea: document.getElementById('namaArea').value,
            codeArea: document.getElementById('codeArea').value,
            total: 0
        };

        const categories = ["Ringkas", "Rapi", "Resik", "Rawat", "Rajin", "Safety"];
        
        categories.forEach(cat => {
            let catScore = 0;
            let catItems = [];
            const radios = this.querySelectorAll(`input[name^="score_${cat}"]:checked`);
            
            radios.forEach(r => {
                catScore += parseInt(r.value);
                catItems.push(r.closest('.audit-item').querySelector('.item-desc').innerText);
            });
            
            payload[`nilai${cat}`] = catScore;
            payload[`item${cat}`] = catItems.join(" | ");
            payload[`bukti${cat}`] = "Foto Terlampir"; 
            payload.total += catScore;
        });

        // Kirim ke Google Apps Script via api.js
        const res = await saveAuditData(payload); 
        
        if(res.status === 'success') {
            alert("Sukses! Data telah tersimpan di Sheet Scoring dengan total nilai: " + payload.total);
            window.location.reload();
        } else {
            alert("Gagal menyimpan data. Pastikan koneksi internet stabil.");
            btn.disabled = false;
            btn.querySelector('span').innerText = "Kirim Hasil Audit";
        }
    });
}

// ==========================================
// 4. FUNGSI RENDER HALAMAN SCORING (RANKING)
// ==========================================
async function renderScoringPage(container) {
    container.innerHTML = `
        <div class="content-placeholder">
            <div class="glow-icon" style="animation: pulse 1s infinite">📊</div>
            <h2>Menghitung Peringkat...</h2>
            <p>Menganalisis data dari database.</p>
        </div>
    `;

    const response = await getScoringRanking();
    
    if (response.status !== 'success') {
        container.innerHTML = `<div class="content-placeholder"><div class="glow-icon" style="color: #EF4444;">⚠️</div><h2>Gagal Memuat</h2></div>`;
        return;
    }

    let rawData = response.data;

    if(rawData.length === 0) {
        container.innerHTML = `<div class="content-placeholder"><div class="glow-icon" style="filter: grayscale(1);">📝</div><h2>Belum Ada Data Audit</h2></div>`;
        return;
    }

    // Urutkan ranking
    rawData.sort((a, b) => b.totalSkor - a.totalSkor);

    let html = `
        <div class="scoring-dashboard">
            <div class="scoring-header">
                <h2>Area Leaderboard</h2>
                <p>Klik pada area untuk melihat rincian nilai 6S.</p>
            </div>

            <div class="score-legend" style="flex-direction: row; flex-wrap: wrap; justify-content: center; margin-bottom: 32px;">
                <div class="legend-item"><span class="l-dot" style="background:#10B981"></span> GOOD (85 - 100)</div>
                <div class="legend-item"><span class="l-dot" style="background:#F59E0B"></span> WARNING (51 - 84)</div>
                <div class="legend-item"><span class="l-dot" style="background:#EF4444"></span> PROBLEM (0 - 50)</div>
            </div>

            <div class="ranking-list">
    `;

    rawData.forEach((item, index) => {
        const score = parseInt(item.totalSkor) || 0;
        let statusText = score >= 85 ? "GOOD" : score >= 51 ? "WARNING" : "PROBLEM";
        let statusClass = score >= 85 ? "stat-good" : score >= 51 ? "stat-warning" : "stat-problem";

        let tglFormat = new Date(item.tglAudit).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        if(tglFormat === 'Invalid Date') tglFormat = item.tglAudit;

        // Tambahkan atribut data-index untuk memanggil detail nanti
        html += `
            <div class="ranking-card" data-index="${index}">
                <div class="rank-number">#${index + 1}</div>
                <div class="rank-info">
                    <h3>${item.namaArea} <span class="code-badge">${item.codeArea}</span></h3>
                    <p>Auditor: ${item.auditor} | Tgl: ${tglFormat}</p>
                </div>
                <div class="rank-score-box">
                    <div class="score-value">${score}</div>
                    <div class="status-badge ${statusClass}">${statusText}</div>
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    container.innerHTML = html;

    // --- LOGIKA KLIK POP-UP DETAIL ---
    const cards = container.querySelectorAll('.ranking-card');
    const modal = document.getElementById('detailModal');
    const btnClose = document.getElementById('closeModal');

    // Menutup Modal saat tombol silang atau area luar diklik
    const closeModal = () => modal.classList.remove('active');
    if(btnClose) btnClose.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Membuka Modal
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const index = card.getAttribute('data-index');
            const data = rawData[index];
            
            // Format Header Pop-Up
            let tglFormat = new Date(data.tglAudit).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            if(tglFormat === 'Invalid Date') tglFormat = data.tglAudit;

            document.getElementById('modalAreaName').innerText = `${data.namaArea} (${data.codeArea})`;
            document.getElementById('modalAuditMeta').innerText = `Tgl: ${tglFormat} | Auditor: ${data.auditor}`;
            document.getElementById('modalTotalScore').innerText = data.totalSkor;

            // Membangun Rincian (Membelah item yang digabung " | " menjadi daftar peluru)
            let detailHtml = '<div class="detail-grid">';
            const categories = ["Ringkas", "Rapi", "Resik", "Rawat", "Rajin", "Safety"];

            categories.forEach(cat => {
                const catData = data.detail[cat];
                let itemScore = catData.nilai || 0;
                
                // Ubah teks yang digabung menjadi list HTML
                let itemsText = catData.item ? catData.item : "Tidak ada pertanyaan diisi.";
                let listHtml = itemsText.split(' | ').map(i => `<li>${i}</li>`).join('');

                detailHtml += `
                    <div class="detail-cat-card">
                        <div class="cat-header">
                            <h4>${cat}</h4>
                            <span class="cat-score">${itemScore} Pts</span>
                        </div>
                        <ul class="cat-items">${listHtml}</ul>
                    </div>
                `;
            });
            detailHtml += '</div>';
            
            document.getElementById('modalDetails').innerHTML = detailHtml;
            
            // Tampilkan Modal
            modal.classList.add('active');
        });
    });
}