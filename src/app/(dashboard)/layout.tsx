'use client'; 

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation'; // Tambahkan alat pendeteksi URL
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname(); // Membaca URL saat ini

    // EFEK AJAIB: Tutup sidebar secara otomatis setiap kali URL (pathname) berubah
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    return (
        <>
            <div className="web3-bg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <div 
                className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
                onClick={() => setIsSidebarOpen(false)}
            ></div>

            <div className="dashboard-wrapper">
                <Sidebar isOpen={isSidebarOpen} />
                
                <main className="main-content">
                    <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                    <div className="content-area glass-panel">
                        {children}
                    </div>
                </main>
            </div>
        </>
    );
}