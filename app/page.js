'use client';
import { useRouter } from 'next/navigation';
import { SessionProvider, useSession, signOut } from 'next-auth/react';

function InstalacionesContent() {
  const router = useRouter();
  const { data: session, status } = useSession();

  return (
    <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto', padding: '80px 20px', minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      
      {/* Top Right Header */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        {status === 'loading' ? null : session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.03)', padding: '8px 20px', borderRadius: 100, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
              Hola, <strong style={{color:'var(--accent)'}}>{session.user.name}</strong> <span style={{color:'var(--text-muted)'}}>(Depto {session.user.apartment})</span>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
            >
              ¿No eres tú? Cambiar usuario
            </button>
          </div>
        ) : (
          <button 
            className="btn btn-primary"
            onClick={() => router.push('/login')}
          >
            Iniciar sesión
          </button>
        )}
      </div>

      {/* Official Logo Header */}
      <div style={{ marginBottom: 64, textAlign: 'center' }}>
        <img 
          src="https://cumbresdesantamaria.cl/wp-content/uploads/2021/01/LOGO-CUMBRES-DE-SANTA-MARIA-300x165.png" 
          alt="Cumbres de Santa María" 
          style={{ height: 90, width: 'auto', opacity: 0.95, objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }} 
        />
        <div style={{ width: 40, height: 2, background: 'var(--accent)', margin: '32px auto 0' }} />
        <h2 style={{ fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: 24, fontWeight: 500 }}>
          Selección de Instalación
        </h2>
      </div>

      <div style={{ display: 'flex', gap: 32, width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
        
        {/* Sala de Cine */}
        <button 
          className="card glass-card" 
          style={{ 
            flex: '1 1 300px', maxWidth: 360, padding: '60px 32px', textAlign: 'center', 
            cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
            border: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(145deg, rgba(30,30,35,0.6) 0%, rgba(15,15,20,0.8) 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)', color: 'var(--text-primary)'
          }}
          onClick={() => router.push('/dashboard?facility=cine')}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4), 0 0 40px rgba(255, 152, 0, 0.1)'; e.currentTarget.querySelector('svg').style.color = 'var(--accent)'; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)'; e.currentTarget.querySelector('svg').style.color = 'inherit'; }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'color 0.4s', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
            <line x1="7" y1="2" x2="7" y2="22"></line>
            <line x1="17" y1="2" x2="17" y2="22"></line>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="2" y1="7" x2="7" y2="7"></line>
            <line x1="2" y1="17" x2="7" y2="17"></line>
            <line x1="17" y1="17" x2="22" y2="17"></line>
            <line x1="17" y1="7" x2="22" y2="7"></line>
          </svg>
          <h2 style={{ fontSize: 20, fontWeight: 400, letterSpacing: 1, margin: 0 }}>Sala de Cine</h2>
        </button>

        {/* Sala de Reuniones */}
        <button 
          className="card glass-card" 
          style={{ 
            flex: '1 1 300px', maxWidth: 360, padding: '60px 32px', textAlign: 'center', 
            cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
            border: '1px solid rgba(255,255,255,0.05)', background: 'linear-gradient(145deg, rgba(30,30,35,0.6) 0%, rgba(15,15,20,0.8) 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)', color: 'var(--text-primary)'
          }}
          onClick={() => router.push('/dashboard?facility=reuniones')}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4), 0 0 40px rgba(255, 152, 0, 0.1)'; e.currentTarget.querySelector('svg').style.color = 'var(--accent)'; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)'; e.currentTarget.querySelector('svg').style.color = 'inherit'; }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'color 0.4s', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <h2 style={{ fontSize: 20, fontWeight: 400, letterSpacing: 1, margin: 0 }}>Sala de Reuniones</h2>
        </button>

      </div>
    </div>
  );
}

export default function InstalacionesPage() {
  return (
    <SessionProvider>
      <InstalacionesContent />
    </SessionProvider>
  );
}
