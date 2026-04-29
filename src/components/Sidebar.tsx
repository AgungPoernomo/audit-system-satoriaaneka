'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Sidebar({ isOpen }: { isOpen?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<{namaLengkap: string, role: string} | null>(null);

    useEffect(() => {
        const userData = sessionStorage.getItem('userLogin');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('userLogin');
        router.push('/login');
    };

    return (
        <aside className={`sidebar glass-panel ${isOpen ? 'active' : ''}`} id="sidebar">
            <div className="sidebar-top">
                <div className="sidebar-brand">
                    <img 
                        src="/logo-satoria.png" 
                        alt="Logo Satoria" 
                        className="brand-logo" 
                        style={{ width: '100%', maxWidth: '160px', height: 'auto', marginBottom: '12px' }}
                    />
                    <h2 style={{ fontSize: '18px' }}>AUDIT <span className="gradient-text">SYSTEM</span></h2>
                </div>

                <nav className="sidebar-nav">
                    {/* 1. Dashboard */}
                    <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        Dashboard
                    </Link>

                    {/* 2. Audit Checklist */}
                    <Link href="/audit-checklist" className={`nav-item ${pathname === '/audit-checklist' ? 'active' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                        Audit Checklist
                    </Link>

                    {/* 3. Scorring */}
                    <Link href="/scoring" className={`nav-item ${pathname === '/scoring' ? 'active' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                        Scorring
                    </Link>

                    {/* 4. Master Map */}
                    <Link href="/master-map" className={`nav-item ${pathname === '/master-map' ? 'active' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
                        Master Map
                    </Link>

                    {/* 5. Area Standard Layout */}
                    <Link href="/standard-layout" className={`nav-item ${pathname === '/standard-layout' ? 'active' : ''}`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Standard Layout
                    </Link>
                </nav>
            </div>

            <div className="sidebar-bottom">
                <div className="user-profile-sidebar">
                    <div className="user-avatar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gradient-1)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user ? user.namaLengkap : 'Memuat...'}</span>
                        <span className="badge">{user ? user.role : '...'}</span>
                    </div>
                </div>
                <button onClick={handleLogout} className="nav-item btn-logout-sidebar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Logout
                </button>
            </div>
        </aside>
    );
}