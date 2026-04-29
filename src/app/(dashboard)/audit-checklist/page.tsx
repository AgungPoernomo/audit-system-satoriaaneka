'use client';

import { useState, useEffect } from 'react';
import { getChecklistItems, saveAuditData } from '../../../lib/api';

// --- UTILS (Kompresi tetap dipertahankan) ---
function fileToBase64(file: File): Promise<{base64: string, mimeType: string, fileName: string}> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024; 
                let width = img.width;
                let height = img.height;
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                resolve({
                    base64: dataUrl.split(',')[1],
                    mimeType: 'image/jpeg', 
                    fileName: file.name.replace(/\.[^/.]+$/, "") + ".jpg"
                });
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}

function SliderInput({ name }: { name: string }) {
    const [val, setVal] = useState(0);
    let colorClass = 'val-bad';
    if (val >= 4) colorClass = 'val-good';
    else if (val >= 2) colorClass = 'val-warn';

    return (
        <div className="scoring-slider-group">
            <span className="slider-label">0 </span>
            <input type="range" name={name} min="0" max="5" value={val} 
                onChange={(e) => setVal(parseInt(e.target.value))} className="score-slider" />
            <span className="slider-label">5 </span>
            <div className={`slider-value-display ${colorClass}`}>{val}</div>
        </div>
    );
}

function FileInput({ id }: { id: string }) {
    const [fileName, setFileName] = useState('Belum ada bukti');
    const [isUploaded, setIsUploaded] = useState(false);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const sizeKB = Math.round(e.target.files[0].size / 1024);
            setFileName(`✓ Foto terekam (${sizeKB} KB)`);
            setIsUploaded(true);
        } else {
            setFileName('Belum ada bukti');
            setIsUploaded(false);
        }
    };
    return (
        <div className="evidence-upload">
            <input type="file" id={id} accept="image/*" capture="environment" className="file-input" 
                onChange={handleFileChange} style={{ display: 'none' }} />
            <label htmlFor={id} className="btn-upload">Ambil Foto</label>
            <span className="file-name" style={{ color: isUploaded ? '#10B981' : 'var(--text-muted)' }}>{fileName}</span>
        </div>
    );
}

export default function AuditChecklistPage() {
    // REVISI 2: Update menu options (outdoor & indoor)
    const [activeView, setActiveView] = useState<'menu' | 'outdoor' | 'indoor'>('menu');
    const [user, setUser] = useState<{namaLengkap: string, role: string} | null>(null);
    const [fullDataMap, setFullDataMap] = useState<any>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State untuk form yang dipilih
    const [selectedArea, setSelectedArea] = useState("");
    const [areaMetadata, setAreaMetadata] = useState({ code: "", dept: "" });

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const userData = sessionStorage.getItem('userLogin');
        if (userData) setUser(JSON.parse(userData));
    }, []);

    useEffect(() => {
        if ((activeView === 'outdoor' || activeView === 'indoor') && !fullDataMap) {
            setIsLoadingData(true);
            getChecklistItems().then(res => {
                if (res.status === 'success') setFullDataMap(res.data);
                else alert('Gagal memuat data!');
                setIsLoadingData(false);
            });
        }
    }, [activeView, fullDataMap]);

    // --- RENDER COMING SOON (Mesin & Ruangan) ---
    if (activeView === 'indoor') {
        return (
            <div className="content-placeholder">
                <div className="glow-icon">🚧</div>
                <h2>Segera Hadir</h2>
                <p>Formulir audit ini sedang dalam tahap pengembangan.</p>
                <button onClick={() => setActiveView('menu')} className="btn-web3" style={{ width: 'auto', padding: '12px 24px', marginTop: '20px' }}>
                    <span>Kembali ke Pilihan Audit</span>
                </button>
            </div>
        );
    }

    // REVISI 1: Handle Perubahan Dropdown Area
    const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const areaName = e.target.value;
        setSelectedArea(areaName);
        if (fullDataMap && fullDataMap[areaName]) {
            setAreaMetadata({
                code: fullDataMap[areaName].kodeArea,
                dept: fullDataMap[areaName].departement
            });
        } else {
            setAreaMetadata({ code: "", dept: "" });
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedArea) return alert("Pilih area terlebih dahulu!");
        setIsSubmitting(true);

        const form = e.currentTarget;
        const payload = {
            action: "saveAudit",
            tglAudit: (form.querySelector('#tglAudit') as HTMLInputElement).value,
            namaAuditor: (form.querySelector('#namaAuditor') as HTMLInputElement).value,
            namaArea: selectedArea,
            codeArea: areaMetadata.code,
            departement: areaMetadata.dept,
            items: [] as any[]
        };

        const auditItemDivs = form.querySelectorAll('.audit-item');
        for (let itemDiv of Array.from(auditItemDivs)) {
            const kategori = itemDiv.getAttribute('data-kategori');
            const pertanyaan = itemDiv.querySelector('.item-desc strong')?.textContent?.replace(/^\d+\.\s*/, '') || '';
            const sliderInput = itemDiv.querySelector('.score-slider') as HTMLInputElement;
            const fileInput = itemDiv.querySelector('.file-input') as HTMLInputElement;

            let fileData = { base64: null as string | null, mimeType: null as string | null, fileName: null as string | null };
            if (fileInput?.files?.[0]) {
                try { fileData = await fileToBase64(fileInput.files[0]); } catch (err) { console.error(err); }
            }

            payload.items.push({
                kategori, pertanyaan, nilai: parseInt(sliderInput.value),
                buktiBase64: fileData.base64, mimeType: fileData.mimeType,
                fileName: `${areaMetadata.code}_${kategori}_${Date.now()}.jpg`
            });
        }

        const res = await saveAuditData(payload);
        setIsSubmitting(false);
        if (res.status === 'success') {
            alert("Audit Berhasil Disimpan!");
            setActiveView('menu');
        } else {
            alert("Gagal: " + res.message);
        }
    };

    // --- RENDER MENU ---
    if (activeView === 'menu') {
        return (
            <div className="audit-menu-container">
                <h2>Pilih Jenis Audit</h2>
                <div className="audit-options-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    <div className="audit-option-card" onClick={() => setActiveView('outdoor')}>
                        <div className="icon">🌳</div>
                        <h3>AUDIT OUTDOOR AREA</h3>
                        <p>Penilaian standar 6S area luar pabrik.</p>
                    </div>
                    <div className="audit-option-card" onClick={() => setActiveView('indoor')}>
                        <div className="icon">🏠</div>
                        <h3>AUDIT INDOOR AREA</h3>
                        <p>Penilaian standar 6S ruangan.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoadingData) return <div className="content-placeholder"><h2>Loading...</h2></div>;

    // --- RENDER FORM ---
    const areaNames = fullDataMap ? Object.keys(fullDataMap) : [];
    const categoryKeys = ["RINGKAS", "RAPI", "RESIK", "RAWAT", "RAJIN", "SAFETY"];

    return (
        <form className="audit-form" onSubmit={handleSubmit}>
            <div className="form-section meta-data">
                <div className="input-col"><label>Tanggal Audit</label><input type="date" id="tglAudit" defaultValue={today} required /></div>
                <div className="input-col"><label>Auditor</label><input type="text" id="namaAuditor" defaultValue={user?.namaLengkap || ''} readOnly /></div>
                
                {/* REVISI 1: Dropdown Nama Area dengan border yang lebih rapi */}
                <div className="input-col">
                    <label>Pilih Area</label>
                    <select 
                        value={selectedArea} 
                        onChange={handleAreaChange} 
                        required 
                        className="web3-select"
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1.5px solid #CBD5E1', /* Warna border abu-abu kebiruan yang modern */
                            backgroundColor: '#FFFFFF',
                            color: '#333333',
                            fontSize: '0.95rem',
                            outline: 'none',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)', /* Bayangan halus */
                            cursor: 'pointer',
                            transition: 'border-color 0.2s ease-in-out'
                        }}
                    >
                        <option value="">-- Pilih Area --</option>
                        {areaNames.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                </div>
                
                <div className="input-col"><label>Kode Area</label><input type="text" value={areaMetadata.code} readOnly placeholder="Otomatis" /></div>
                <div className="input-col"><label>Departement</label><input type="text" value={areaMetadata.dept} readOnly placeholder="Otomatis" /></div>
            </div>

            {selectedArea && (
                
                <div className="categories-container">
                    <div className="score-legend">
                        <strong>Ketentuan Skor (Berdasarkan Temuan):</strong>
                        <div className="legend-item"><span className="l-dot" style={{ background: '#EF4444' }}></span> 0 - 1 : Perlu Perbaikan <strong>(Parah)</strong></div>
                        <div className="legend-item"><span className="l-dot" style={{ background: '#F59E0B' }}></span> 2 - 3 : Perawatan <strong>(Ringan)</strong></div>
                        <div className="legend-item"><span className="l-dot" style={{ background: '#10B981' }}></span> 4 - 5 : Excellence <strong>(Sempurna)</strong></div>
                    </div>
                    {categoryKeys.map(cat => {
                        const items = fullDataMap[selectedArea]?.kategoriPertanyaan?.[cat] || [];
                        if (items.length === 0) return null;
                        
                        return (
                            <div className="category-card" key={cat}>
                                {/* REVISI 2: Menambahkan kata "KATEGORI" di depan nama kategori */}
                                <h2 className="category-title">KATEGORI {cat}</h2>
                                
                                {items.map((item: any, idx: number) => (
                                    <div className="audit-item" data-kategori={cat} key={idx}>
                                        
                                        {/* REVISI 1: Menambahkan padding agar teks tidak terlalu ke kiri dan tidak berdempetan dengan border */}
                                        <div className="item-content" style={{ paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingBottom: '0.75rem', paddingTop: '0.5rem' }}>
                                            <p className="item-desc" style={{ marginBottom: '10px' }}>
                                                <strong> {idx + 1}. {item.pertanyaan}</strong>
                                            </p>
                                            <FileInput id={`img_${cat}_${idx}`} />
                                        </div>
                                        
                                        <SliderInput name={`val_${cat}_${idx}`} />
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}

            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button type="button" onClick={() => setActiveView('menu')} className="btn-web3 secondary"><span>Kembali</span></button>
                <button type="submit" className="btn-web3" disabled={isSubmitting || !selectedArea}>
                    <span>{isSubmitting ? 'Menyimpan...' : 'Kirim Hasil Audit'}</span>
                </button>
            </div>
        </form>
    );
}