'use client'; 

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation'; // Tambahkan useRouter
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // State baru untuk menahan tampilan UI sebelum pengecekan tiket selesai
    const [isAuthChecking, setIsAuthChecking] = useState(true); 
    
    const pathname = usePathname(); 
    const router = useRouter(); // Alat untuk melempar/memindah halaman

    // ==========================================
    // 1. EFEK PENJAGA PINTU (Auth Guard)
    // ==========================================
    useEffect(() => {
        const userSession = sessionStorage.getItem('userLogin');
        
        if (!userSession) {
            router.push('/');
        } else {
            // Jika tiket ada, izinkan masuk (matikan penahan UI)
            setIsAuthChecking(false);
        }
    }, [router]);

    // ==========================================
    // 2. EFEK AJAIB: Tutup sidebar otomatis
    // ==========================================
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    // Jika masih dalam proses pengecekan tiket, jangan render Dashboard (mencegah bocor/kedipan)
    if (isAuthChecking) {
        return (
            <div className="web3-bg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>
        );
    }

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