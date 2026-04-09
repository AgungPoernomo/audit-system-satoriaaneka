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
            } else if (selectedTitle === "Master Outdoor Map") {
                renderMasterMap(contentArea);   
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
// Helper: Konversi File ke Base64
// ==========================================
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
            base64: reader.result.split(',')[1], // Buang header data:image/jpeg;base64,
            mimeType: file.type,
            fileName: file.name
        });
        reader.onerror = error => reject(error);
    });
}

// ==========================================
// 3. FUNGSI RENDER FORM AUDIT CHECKLIST
// ==========================================
async function renderAuditForm(container, user) {
    const today = new Date().toISOString().split('T')[0];
    
    container.innerHTML = `<div class="content-placeholder"><div class="glow-icon" style="animation: pulse 1s infinite">⏳</div><h2>Mengunduh Data...</h2></div>`;

    const response = await getChecklistItems();
    if (response.status !== 'success') {
        container.innerHTML = `<div class="content-placeholder"><div class="glow-icon" style="color: #EF4444;">⚠️</div><h2>Koneksi Gagal</h2></div>`;
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
                    <div class="audit-item" data-kategori="${cat}">
                        <div class="item-content">
                            <p class="item-desc"><strong>${index + 1}. ${item.pertanyaan}</strong></p>
                            <p class="item-standard"><em>Standar: ${item.standar}</em></p>
                            <div class="evidence-upload">
                                <input type="file" id="${fileId}" accept="image/*" capture="environment" class="file-input">
                                <label for="${fileId}" class="btn-upload">Ambil Foto</label>
                                <span class="file-name" id="name_${fileId}">Belum ada bukti</span>
                            </div>
                        </div>
                        <div class="scoring-group">
                            <label class="score-radio s-0"><input type="radio" name="${inputName}" value="0" required> <span>0</span></label>
                            <label class="score-radio s-3"><input type="radio" name="${inputName}" value="3"> <span>3</span></label>
                            <label class="score-radio s-5"><input type="radio" name="${inputName}" value="5"> <span>5</span></label>
                        </div>
                    </div>
                `;
            });
            html += `</div></div>`; 
        }
    });

    html += `</div><button type="submit" class="btn-web3 submit-audit"><span>Kirim Hasil & Upload Foto</span></button></form>`;
    container.innerHTML = html;

    // Interaksi UI Foto
    document.querySelectorAll('.file-input').forEach(input => {
        input.addEventListener('change', function(e) {
            const fileNameSpan = document.getElementById(`name_${this.id}`);
            if (this.files && this.files.length > 0) {
                fileNameSpan.innerText = "✓ Foto terekam (" + Math.round(this.files[0].size/1024) + " KB)";
                fileNameSpan.style.color = "#10B981"; 
            } else {
                fileNameSpan.innerText = "Belum ada bukti";
                fileNameSpan.style.color = "var(--text-muted)";
            }
        });
    });

    // Logika Pengiriman Data (Struktur Vertikal)
    document.getElementById('auditForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn = this.querySelector('.submit-audit');
        btn.disabled = true;
        btn.querySelector('span').innerText = "Mengupload Data & Foto... Mohon Tunggu";

        const payload = {
            action: "saveAudit",
            tglAudit: document.getElementById('tglAudit').value,
            namaAuditor: document.getElementById('namaAuditor').value,
            namaArea: document.getElementById('namaArea').value,
            codeArea: document.getElementById('codeArea').value,
            items: [] // Ini akan berisi array per pertanyaan
        };

        const auditItemsDivs = this.querySelectorAll('.audit-item');
        
        for (let itemDiv of auditItemsDivs) {
            const kategori = itemDiv.getAttribute('data-kategori');
            const pertanyaan = itemDiv.querySelector('.item-desc strong').innerText;
            const checkedRadio = itemDiv.querySelector('input[type="radio"]:checked');
            
            if (checkedRadio) {
                const nilai = parseInt(checkedRadio.value);
                const fileInput = itemDiv.querySelector('.file-input');
                let fileData = { base64: null, mimeType: null, fileName: null };

                // Jika user mengupload foto, proses ke Base64
                if (fileInput.files.length > 0) {
                    try {
                        fileData = await fileToBase64(fileInput.files[0]);
                    } catch (error) {
                        console.error("Gagal membaca foto:", error);
                    }
                }

                payload.items.push({
                    kategori: kategori,
                    pertanyaan: pertanyaan.replace(/^\d+\.\s*/, ''), // Menghilangkan angka urutan
                    nilai: nilai,
                    buktiBase64: fileData.base64,
                    mimeType: fileData.mimeType,
                    fileName: payload.codeArea + "_" + kategori + "_" + Date.now() + ".jpg" // Nama file aman
                });
            }
        }

        const res = await saveAuditData(payload); 
        
        if(res.status === 'success') {
            alert("Sukses! Data dan Foto telah tersimpan di sistem.");
            window.location.reload();
        } else {
            alert("Gagal: " + res.message);
            btn.disabled = false;
            btn.querySelector('span').innerText = "Kirim Hasil & Upload Foto";
        }
    });
}

// ==========================================
// 4. FUNGSI RENDER HALAMAN SCORING (RANKING)
// ==========================================
async function renderScoringPage(container) {
    container.innerHTML = `<div class="content-placeholder"><div class="glow-icon" style="animation: pulse 1s infinite">📊</div><h2>Menghitung Peringkat...</h2></div>`;

    const response = await getScoringRanking();
    if (response.status !== 'success') {
        container.innerHTML = `<div class="content-placeholder"><div class="glow-icon" style="color: #EF4444;">⚠️</div><h2>Gagal Memuat</h2></div>`;
        return;
    }

    let rawData = response.data;
    if(rawData.length === 0) {
        container.innerHTML = `<div class="content-placeholder"><h2>Belum Ada Data Audit</h2></div>`;
        return;
    }

    rawData.sort((a, b) => b.totalSkor - a.totalSkor);

    let html = `
        <div class="scoring-dashboard">
            <div class="scoring-header"><h2>Area Leaderboard</h2></div>
            <div class="ranking-list">
    `;

    rawData.forEach((item, index) => {
        const score = parseInt(item.totalSkor) || 0;
        let statusClass = score >= 85 ? "stat-good" : score >= 51 ? "stat-warning" : "stat-problem";
        let statusText = score >= 85 ? "GOOD" : score >= 51 ? "WARNING" : "PROBLEM";
        let tglFormat = new Date(item.tglAudit).toLocaleDateString('id-ID');

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

    // Logika Pop-Up Modal dengan Link Foto
    const cards = container.querySelectorAll('.ranking-card');
    const modal = document.getElementById('detailModal');
    const btnClose = document.getElementById('closeModal');

    const closeModal = () => modal.classList.remove('active');
    if(btnClose) btnClose.addEventListener('click', closeModal);

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const index = card.getAttribute('data-index');
            const data = rawData[index];
            
            document.getElementById('modalAreaName').innerText = `${data.namaArea}`;
            document.getElementById('modalAuditMeta').innerText = `Auditor: ${data.auditor}`;
            document.getElementById('modalTotalScore').innerText = data.totalSkor;

            let detailHtml = '<div class="detail-grid">';
            const categories = ["Ringkas", "Rapi", "Resik", "Rawat", "Rajin", "Safety"];

            categories.forEach(cat => {
                const catData = data.detail[cat];
                if(catData && catData.items.length > 0) {
                    let itemsListHtml = catData.items.map(i => {
                        // Jika ada link foto, buat tombol Lihat Bukti
                        let linkFoto = (i.buktiUrl && i.buktiUrl.includes("http")) 
                            ? `<a href="${i.buktiUrl}" target="_blank" style="color:#4F46E5; font-size:10px; margin-left:8px; text-decoration:underline;">[Lihat Bukti]</a>` 
                            : '';
                        return `<li>${i.pertanyaan} <strong>(${i.nilai} point)</strong> ${linkFoto}</li>`;
                    }).join('');

                    detailHtml += `
                        <div class="detail-cat-card">
                            <div class="cat-header">
                                <h4>${cat}</h4><span class="cat-score">${catData.totalKategori} Point</span>
                            </div>
                            <ul class="cat-items">${itemsListHtml}</ul>
                        </div>
                    `;
                }
            });
            
            document.getElementById('modalDetails').innerHTML = detailHtml + '</div>';
            modal.classList.add('active');
        });
    });
}

// ==========================================
// 5. FUNGSI RENDER MASTER OUTDOOR MAP
// ==========================================
async function renderMasterMap(container) {
    container.innerHTML = `<div class="content-placeholder"><div class="glow-icon" style="animation: pulse 1s infinite">🗺️</div><h2>Memuat Layout Pabrik...</h2></div>`;

    // Ambil data dari GAS
    const response = await getMasterMapData(); // Pastikan fungsi ini ada di api.js
    const mapUrl = (response.status === 'success' && response.url) ? response.url : "";
    const lastUpdate = response.tanggal || "-";

    let html = `
        <div class="map-page-container">
            <div class="map-controls-top">
                <div class="map-info">
                    <p style="font-size: 11px; color: var(--text-muted); margin:0;">Pembaruan Terakhir:</p>
                    <strong style="font-size: 13px;">${lastUpdate}</strong>
                </div>
                <div class="map-actions">
                    <input type="file" id="uploadMapInput" accept="image/*" style="display:none">
                    <button onclick="document.getElementById('uploadMapInput').click()" class="btn-web3" style="padding: 8px 16px; font-size: 12px;">
                        <span>Upload Layout Baru</span>
                    </button>
                </div>
            </div>

            <div class="map-viewer-wrapper">
                ${mapUrl ? `
                    <div class="map-zoom-container" id="mapZoomContainer">
                        <img src="${mapUrl.replace('open?', 'uc?export=view&')}" id="factoryMap" alt="Layout Pabrik">
                    </div>
                    <div class="zoom-buttons">
                        <button id="btnZoomIn">+</button>
                        <button id="btnZoomReset">↺</button>
                        <button id="btnZoomOut">−</button>
                    </div>
                ` : `
                    <div class="content-placeholder" style="height: 300px;">
                        <p>Belum ada layout map yang diunggah.</p>
                    </div>
                `}
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Logika Upload Map Baru
    const uploadInput = document.getElementById('uploadMapInput');
    if(uploadInput) {
        uploadInput.addEventListener('change', async function() {
            if (!this.files[0]) return;
            const confirmUpload = confirm("Apakah Anda yakin ingin memperbarui Layout Pabrik?");
            if(!confirmUpload) return;

            const btn = document.querySelector('.map-actions .btn-web3');
            btn.disabled = true;
            btn.querySelector('span').innerText = "Sedang Mengupload...";

            const fileData = await fileToBase64(this.files[0]);
            const payload = {
                action: "uploadMasterMap",
                tglUpdate: new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'}),
                buktiBase64: fileData.base64,
                mimeType: fileData.mimeType
            };

            const res = await saveMasterMapData(payload); // Fungsi di api.js
            if(res.status === 'success') {
                alert("Layout Pabrik Berhasil Diperbarui!");
                renderMasterMap(container);
            } else {
                alert("Gagal upload: " + res.message);
                btn.disabled = false;
                btn.querySelector('span').innerText = "Upload Layout Baru";
            }
        });
    }

    // Logika Zoom & Pan Sederhana
    const mapImg = document.getElementById('factoryMap');
    if (mapImg) {
        let scale = 1;
        const btnIn = document.getElementById('btnZoomIn');
        const btnOut = document.getElementById('btnZoomOut');
        const btnReset = document.getElementById('btnZoomReset');

        btnIn.onclick = () => { scale += 0.2; applyZoom(); };
        btnOut.onclick = () => { if(scale > 0.5) scale -= 0.2; applyZoom(); };
        btnReset.onclick = () => { scale = 1; applyZoom(); };

        function applyZoom() {
            mapImg.style.transform = `scale(${scale})`;
        }

        // Aktifkan geser (pan) dengan sentuhan/mouse
        let isDragging = false;
        let startX, startY, scrollLeft, scrollTop;
        const wrapper = document.querySelector('.map-viewer-wrapper');

        wrapper.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.pageX - wrapper.offsetLeft;
            startY = e.pageY - wrapper.offsetTop;
            scrollLeft = wrapper.scrollLeft;
            scrollTop = wrapper.scrollTop;
        });
        wrapper.addEventListener('mouseleave', () => isDragging = false);
        wrapper.addEventListener('mouseup', () => isDragging = false);
        wrapper.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - wrapper.offsetLeft;
            const y = e.pageY - wrapper.offsetTop;
            const walkX = (x - startX) * 2;
            const walkY = (y - startY) * 2;
            wrapper.scrollLeft = scrollLeft - walkX;
            wrapper.scrollTop = scrollTop - walkY;
        });
    }
}

