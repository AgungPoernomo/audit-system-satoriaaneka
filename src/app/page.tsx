'use client'; // Wajib untuk halaman yang memiliki interaksi (form, tombol, state)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '../lib/api';

export default function LoginPage() {
    // Menggantikan document.getElementById dengan React State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    // Alat pemindah halaman bawaan Next.js
    const router = useRouter();

    // Fungsi yang dipanggil saat tombol submit ditekan
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); // Mencegah browser reload
        setIsLoading(true);
        setErrorMsg(''); // Kosongkan error sebelumnya

        try {
            const response = await loginUser(username, password);

            if (response.status === 'success') {
                // Simpan data ke session (persis seperti Vanilla JS lama Anda)
                sessionStorage.setItem('userLogin', JSON.stringify(response.data));
                
                // Pindah ke halaman Dashboard ("/")
                router.push('/'); 
            } else {
                setErrorMsg(response.message || 'ID atau Sandi salah');
            }
        } catch (err) {
            setErrorMsg('Koneksi ke server terputus. Coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-layout">
            {/* Background Web3 Animasi khusus halaman Login */}
            <div className="web3-bg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <div className="login-box glass-panel">
                <div className="login-header">
                    <img 
                        src="/logo-satoria.png" 
                        alt="Logo Satoria" 
                        className="login-logo" 
                        style={{ marginBottom: '24px', maxWidth: '200px', height: 'auto' }}
                    />
                    <h1 className="title" style={{ fontSize: '24px' }}>AUDIT <span className="gradient-text">SYSTEM</span></h1>
                    <p className="subtitle">Login untuk Melanjutkan</p>
                </div>

                {/* Tempat munculnya pesan error jika gagal login */}
                {errorMsg && (
                    <div style={{ 
                        color: '#EF4444', 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        padding: '10px', 
                        borderRadius: '8px',
                        marginBottom: '20px', 
                        fontSize: '14px', 
                        fontWeight: 600 
                    }}>
                        ⚠️ {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <input 
                            type="text" 
                            placeholder="Username" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required 
                        />
                        <div className="input-glow"></div>
                    </div>
                    
                    <div className="input-group">
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                        />
                        <div className="input-glow"></div>
                    </div>

                    <button type="submit" className="btn-web3" disabled={isLoading}>
                        <span>{isLoading ? 'Memverifikasi...' : 'Masuk Sistem'}</span>
                    </button>
                </form>
            </div>
        </div>
    );
}