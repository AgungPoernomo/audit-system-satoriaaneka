'use client';

import { usePathname } from 'next/navigation';

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
    const pathname = usePathname();

    let title = "Dashboard Utama";
    let subtitle = "Overview & Aktivitas Sistem";

    if (pathname === '/audit-checklist') {
        title = "Audit Checklist";
        subtitle = "Pilih Jenis Audit & Lakukan Penilaian Aktual!";
    } else if (pathname === '/scoring') {
        title = "Scorring (Leaderboard)";
        subtitle = "Peringkat Area Berdasarkan Nilai Audit";
    } else if (pathname === '/master-map') {
        title = "Master Map";
        subtitle = "Layout Visual Area Luar Pabrik";
    } else if (pathname === '/standard-layout') {
        title = "Area Standard Layout";
        subtitle = "Aturan & Standar Visual Area";
    }

    return (
        <header className="top-header glass-panel">
            <button className="mobile-toggle" onClick={toggleSidebar}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="header-title">
                <h1>{title}</h1>
                <p className="header-subtitle">{subtitle}</p>
            </div>
        </header>
    );
}