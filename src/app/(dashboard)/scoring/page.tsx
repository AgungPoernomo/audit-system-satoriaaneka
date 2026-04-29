'use client';

import { useState, useEffect } from 'react';
// Pastikan fungsi ini memanggil API action "getScoringData" di file lib/api.ts Anda
import { getScoringRanking } from '../../../lib/api';

export default function ScoringPage() {
    // REVISI: Samakan menu dengan audit checklist
    const [activeView, setActiveView] = useState<'menu' | 'outdoor' | 'indoor'>('menu');
    const [scoringData, setScoringData] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedData, setSelectedData] = useState<any>(null);

    useEffect(() => {
        // Ambil data untuk outdoor atau indoor
        if ((activeView === 'outdoor' || activeView === 'indoor') && !scoringData) {
            setIsLoading(true);
            getScoringRanking().then(res => {
                if (res.status === 'success') {
                    const sortedData = res.data.sort((a: any, b: any) => b.totalSkor - a.totalSkor);
                    setScoringData(sortedData);
                } else {
                    alert('Gagal memuat data peringkat!');
                }
                setIsLoading(false);
            });
        }
    }, [activeView, scoringData]);

    const openModal = (data: any) => {
        setSelectedData(data);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedData(null), 300);
    };

    // ==========================================
    // 1. TAMPILAN MENU
    // ==========================================
    if (activeView === 'menu') {
        return (
            <div className="audit-menu-container">
                <h2>Pilih Leaderboard Area</h2>
                <div className="audit-options-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    <div className="audit-option-card" onClick={() => setActiveView('outdoor')}>
                        <div className="icon">🏆</div>
                        <h3>Scoring Outdoor Area</h3>
                        <p>Peringkat kebersihan dan standar area luar pabrik</p>
                    </div>
                    <div className="audit-option-card" onClick={() => setActiveView('indoor')}>
                        <div className="icon">🏢</div>
                        <h3>Scoring Indoor Area</h3>
                        <p>Peringkat kebersihan ruangan, kantor, dan gudang</p>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // 2. TAMPILAN LEADERBOARD
    // ==========================================
    if (isLoading) {
        return <div className="content-placeholder"><div className="glow-icon" style={{ animation: 'pulse 1s infinite' }}>📊</div><h2>Menghitung Peringkat...</h2></div>;
    }

    return (
        <div className="scoring-dashboard">
            {/* Navigasi Atas Leaderboard */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <button onClick={() => setActiveView('menu')} className="btn-web3" style={{ width: 'auto', padding: '8px 16px', background: 'var(--text-muted)', boxShadow: 'none' }}>
                    <span>← Kembali</span>
                </button>
                <div className="scoring-header" style={{ marginBottom: 0 }}>
                    <h2>Area Leaderboard</h2>
                </div>
                <div style={{ width: '80px' }}></div> 
            </div>

            {/* List Ranking */}
            {(!scoringData || scoringData.length === 0) ? (
                <div className="content-placeholder"><h2>Belum Ada Data Audit</h2></div>
            ) : (
                <div className="ranking-list">
                    {scoringData.map((item, index) => {
                        const score = parseInt(item.totalSkor) || 0;
                        const statusClass = score >= 85 ? "stat-good" : score >= 51 ? "stat-warning" : "stat-problem";
                        const statusText = score >= 85 ? "GOOD" : score >= 51 ? "WARNING" : "PROBLEM";
                        const tglFormat = new Date(item.tglAudit).toLocaleDateString('id-ID');

                        return (
                            <div className="ranking-card" key={index} onClick={() => openModal(item)}>
                                <div className="rank-number">#{index + 1}</div>
                                <div className="rank-info">
                                    <h3>{item.namaArea} <span className="code-badge">{item.codeArea}</span></h3>
                                    <p>Auditor: {item.auditor} | Dept: {item.departement || '-'} | Tgl: {tglFormat}</p>
                                </div>
                                <div className="rank-score-box">
                                    <div className="score-value">{score}</div>
                                    <div className={`status-badge ${statusClass}`}>{statusText}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ==========================================
                3. POP-UP MODAL DETAIL
                ========================================== */}
            <div className={`modal-overlay ${isModalOpen ? 'active' : ''}`} onClick={closeModal}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <button className="btn-close-modal" onClick={closeModal}>✕</button>
                    
                    {selectedData && (
                        <>
                            <div className="modal-header">
                                <div className="modal-subtitle">Detail Audit</div>
                                <h2>{selectedData.namaArea}</h2>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>Auditor: {selectedData.auditor}</p>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Departement: {selectedData.departement || '-'}</p>
                                <div className="modal-total-score">Total Skor: {selectedData.totalSkor}</div>
                            </div>
                            
                            <div className="modal-body">
                                <div className="detail-grid">
                                    {/* REVISI: Menggunakan huruf kapital sesuai dengan logika penyimpanan baru */}
                                    {["RINGKAS", "RAPI", "RESIK", "RAWAT", "RAJIN", "SAFETY"].map((cat) => {
                                        const catData = selectedData.detail?.[cat];
                                        if (!catData || catData.items.length === 0) return null;

                                        return (
                                            <div className="detail-cat-card" key={cat}>
                                                <div className="cat-header">
                                                    <h4>{cat}</h4>
                                                    <span className="cat-score">{catData.totalKategori} Point</span>
                                                </div>
                                                <ul className="cat-items">
                                                    {catData.items.map((i: any, idx: number) => (
                                                        <li key={idx} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
                                                            <span style={{ flex: 1 }}>{i.pertanyaan} <strong>({i.nilai} point)</strong></span>
                                                            
                                                            {i.buktiUrl && i.buktiUrl.includes("http") && (
                                                                <a href={i.buktiUrl} target="_blank" rel="noreferrer" style={{ color: '#4F46E5', fontSize: '11px', marginLeft: '8px', textDecoration: 'none', background: 'rgba(79, 70, 229, 0.1)', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                                                    Lihat Bukti
                                                                </a>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
        </div>
    );
}