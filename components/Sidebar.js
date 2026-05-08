'use client';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, Suspense } from 'react';

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const isAdmin = session?.user?.role === 'admin';

  if (pathname === '/') return null;

  const facility = searchParams.get('facility') || 'cine';
  const facilityName = facility === 'cine' ? 'Sala de Cine' : 'Sala de Reuniones';
  const facilityIcon = facility === 'cine' ? '🎬' : '🤝';

  const initials = session?.user?.name
    ? session.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const navItems = [
    { href: `/dashboard`, icon: '📅', label: 'Calendario' },
    { href: `/reservar`, icon: '➕', label: 'Nueva Reserva' },
    { href: `/mis-reservas`, icon: '🎟️', label: 'Mis Reservas' },
  ];

  const adminItems = [
    { href: '/admin', icon: '👥', label: 'Usuarios' },
    { href: '/admin/reservas', icon: '📋', label: 'Todas las Reservas' },
  ];

  return (
    <>
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setOpen(true)}>☰</button>
        <span style={{ fontWeight: 700, fontSize: 16 }}>{facilityIcon} {facilityName}</span>
        <div style={{ width: 32 }} />
      </div>

      <div className={`mobile-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`app-sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">{facilityIcon}</div>
          <div>
            <div className="sidebar-logo-text">{facilityName}</div>
            <div className="sidebar-logo-sub">Cumbres de Santa María</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link
            href="/"
            className="sidebar-link"
            style={{ background: 'var(--bg-glass)', marginBottom: 16, color: 'var(--text-muted)' }}
          >
            <span className="sidebar-link-icon">⬅</span>
            Cambiar Instalación
          </Link>

          {navItems.map(item => {
            // Only append facility to dashboard and reservar
            const finalHref = (item.href === '/dashboard' || item.href === '/reservar') 
                ? `${item.href}?facility=${facility}` 
                : item.href;
                
            return (
              <Link
                key={item.href}
                href={finalHref}
                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div className="sidebar-section-title">Administración</div>
              {adminItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{session?.user?.name}</div>
            <div className="sidebar-user-apt">Depto {session?.user?.apartment}</div>
          </div>
          <button
            className="btn btn-icon btn-secondary"
            onClick={() => signOut({ callbackUrl: '/' })}
            title="Cerrar sesión"
            style={{ fontSize: 16 }}
          >
            🚪
          </button>
        </div>
      </aside>
    </>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={null}>
      <SidebarContent />
    </Suspense>
  );
}
