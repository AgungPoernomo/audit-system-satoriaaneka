'use client'; 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '../lib/api'; 

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    
    const router = useRouter();

    // Cek apakah user SUDAH login. Jika sudah, langsung lempar ke /dashboard
    useEffect(() => {
        const userSession = sessionStorage.getItem('userLogin');
        if (userSession) {
            router.push('/dashboard');
        } else {
            setIsCheckingSession(false);
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); 
        setIsLoading(true);
        setErrorMsg(''); 

        try {
            const response = await loginUser(username, password);
            if (response.status === 'success') {
                sessionStorage.setItem('userLogin', JSON.stringify(response.data));
                router.push('/dashboard'); // Lempar ke Dashboard
            } else {
                setErrorMsg(response.message || 'ID atau Sandi salah');
            }
        } catch (err) {
            setErrorMsg('Koneksi ke server terputus. Coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    // Tahan tampilan sebentar saat mengecek memori agar tidak berkedip
    if (isCheckingSession) {
        return <div className="web3-bg"><div className="blob blob-1"></div><div className="blob blob-2"></div></div>;
    }

    return (
        <div className="login-layout">
            <div className="web3-bg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <div className="login-box glass-panel">
                <div className="login-header">
                    <img src="/logo-satoria.png" alt="Logo Satoria" className="login-logo" style={{ marginBottom: '24px', maxWidth: '200px', height: 'auto' }} />
                    <h1 className="title" style={{ fontSize: '24px' }}>AUDIT <span className="gradient-text">SYSTEM</span></h1>
                    <p className="subtitle">Login untuk Melanjutkan</p>
                </div>

                {errorMsg && (
                    <div style={{ color: '#EF4444', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: 600 }}>
                        ⚠️ {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group"><input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required /><div className="input-glow"></div></div>
                    <div className="input-group"><input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required /><div className="input-glow"></div></div>
                    <button type="submit" className="btn-web3" disabled={isLoading}><span>{isLoading ? 'Memverifikasi...' : 'Masuk Sistem'}</span></button>
                </form>
            </div>
        </div>
    );
}