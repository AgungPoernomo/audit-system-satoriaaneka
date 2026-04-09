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
    
    // Legend diperbarui ke format 0 - 5
    const legendHtml = `
        <div class="score-legend">
            <strong>Ketentuan Skor (Geser Slider):</strong>
            <div class="legend-item"><span class="l-dot" style="background:#EF4444"></span> 0 - 1 : Perlu Perbaikan</div>
            <div class="legend-item"><span class="l-dot" style="background:#F59E0B"></span> 2 - 3 : Perawatan</div>
            <div class="legend-item"><span class="l-dot" style="background:#10B981"></span> 4 - 5 : Excellence</div>
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
                
                // HTML Slider menggantikan Radio Button
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
                        <div class="scoring-slider-group">
                            <span class="slider-label">0</span>
                            <input type="range" name="${inputName}" min="0" max="5" value="0" class="score-slider" id="slider_${inputName}">
                            <span class="slider-label">5</span>
                            <div class="slider-value-display val-bad" id="val_${inputName}">0</div>
                        </div>
                    </div>
                `;
            });
            html += `</div></div>`; 
        }
    });

    html += `</div><button type="submit" class="btn-web3 submit-audit"><span>Kirim Hasil Audit</span></button></form>`;
    container.innerHTML = html;

    // --- INTERAKSI FOTO ---
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

    // --- INTERAKSI REAL-TIME SLIDER ---
    document.querySelectorAll('.score-slider').forEach(slider => {
        slider.addEventListener('input', function() {
            // Memperbarui angka di kotak sebelah kanan
            const displayId = `val_${this.id.replace('slider_', '')}`;
            const displayEl = document.getElementById(displayId);
            const val = parseInt(this.value);
            
            displayEl.innerText = val;
            
            // Merubah warna kotak berdasarkan nilai
            if (val <= 1) displayEl.className = 'slider-value-display val-bad'; // Merah
            else if (val <= 3) displayEl.className = 'slider-value-display val-warn'; // Kuning
            else displayEl.className = 'slider-value-display val-good'; // Hijau
        });
    });

    // --- LOGIKA PENGIRIMAN DATA ---
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
            items: [] 
        };

        const auditItemsDivs = this.querySelectorAll('.audit-item');
        
        for (let itemDiv of auditItemsDivs) {
            const kategori = itemDiv.getAttribute('data-kategori');
            const pertanyaan = itemDiv.querySelector('.item-desc strong').innerText;
            
            // Mengambil nilai dari Slider, bukan Radio Button lagi
            const sliderInput = itemDiv.querySelector('.score-slider');
            
            if (sliderInput) {
                const nilai = parseInt(sliderInput.value);
                const fileInput = itemDiv.querySelector('.file-input');
                let fileData = { base64: null, mimeType: null, fileName: null };

                if (fileInput.files.length > 0) {
                    try {
                        fileData = await fileToBase64(fileInput.files[0]);
                    } catch (error) {
                        console.error("Gagal membaca foto:", error);
                    }
                }

                payload.items.push({
                    kategori: kategori,
                    pertanyaan: pertanyaan.replace(/^\d+\.\s*/, ''), 
                    nilai: nilai,
                    buktiBase64: fileData.base64,
                    mimeType: fileData.mimeType,
                    fileName: payload.codeArea + "_" + kategori + "_" + Date.now() + ".jpg" 
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
    const response = await getMasterMapData();
    const mapUrl = (response.status === 'success' && response.url) ? response.url : "";
    const lastUpdate = response.tanggal || "-";

// --- TRIK: MENGUBAH URL DRIVE MENJADI DIRECT IMAGE LINK ---
    let displayUrl = "";
    if (mapUrl) {
        // Mencari ID unik file menggunakan Regex yang lebih kuat
        const match = mapUrl.match(/[-\w]{25,}/);
        if (match && match[0]) {
            // Memaksa Google memberikan gambar mentah resolusi tinggi (Width: 2000px)
            displayUrl = `https://drive.google.com/thumbnail?id=${match[0]}&sz=w2000`;
        } else {
            displayUrl = mapUrl;
        }
    }

    let html = `
        <div class="map-page-container">
            <div class="map-controls-top">
                <div class="map-info">
                    <p class="map-info-label">Pembaruan Terakhir:</p>
                    <strong class="map-info-date">${lastUpdate}</strong>
                </div>
                <div class="map-actions">
                    <input type="file" id="uploadMapInput" accept="image/*" style="display:none">
                    <button onclick="document.getElementById('uploadMapInput').click()" class="btn-web3 map-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        <span>Upload Layout Baru</span>
                    </button>
                </div>
            </div>

            <div class="map-viewer-wrapper">
                ${displayUrl ? `
                    <div class="map-zoom-container" id="mapZoomContainer">
                        <img src="${displayUrl}" id="factoryMap" alt="Layout Pabrik" onerror="this.src='https://via.placeholder.com/800x400?text=Gagal+Memuat+Gambar+Google+Drive'">
                    </div>
                    <div class="zoom-buttons">
                        <button id="btnZoomIn" title="Perbesar">+</button>
                        <button id="btnZoomReset" title="Reset">↺</button>
                        <button id="btnZoomOut" title="Perkecil">−</button>
                    </div>
                ` : `
                    <div class="content-placeholder" style="height: 300px;">
                        <div class="glow-icon" style="filter: grayscale(1);">🖼️</div>
                        <h2>Belum Ada Layout</h2>
                        <p>Silakan upload gambar Master Outdoor Map terbaru.</p>
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
            btn.querySelector('span').innerText = "Mengupload...";

            const fileData = await fileToBase64(this.files[0]);
            const payload = {
                action: "uploadMasterMap",
                tglUpdate: new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'}),
                buktiBase64: fileData.base64,
                mimeType: fileData.mimeType
            };

            const res = await saveMasterMapData(payload);
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

    // Logika Zoom & Pan
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

        let isDragging = false;
        let startX, startY, scrollLeft, scrollTop;
        const wrapper = document.querySelector('.map-viewer-wrapper');

        wrapper.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.pageX - wrapper.offsetLeft;
            startY = e.pageY - wrapper.offsetTop;
            scrollLeft = wrapper.scrollLeft;
            scrollTop = wrapper.scrollTop;
            wrapper.style.cursor = 'grabbing';
        });
        wrapper.addEventListener('mouseleave', () => { isDragging = false; wrapper.style.cursor = 'grab'; });
        wrapper.addEventListener('mouseup', () => { isDragging = false; wrapper.style.cursor = 'grab'; });
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