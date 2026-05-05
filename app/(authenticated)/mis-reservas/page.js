'use client';
import { useState, useEffect } from 'react';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function MisReservasPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reservas?mine=true');
      const data = await res.json();
      setReservations(Array.isArray(data) ? data : []);
    } catch { setReservations([]); }
    setLoading(false);
  };

  useEffect(() => { fetchReservations(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;
    try {
      const res = await fetch(`/api/reservas?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchReservations();
    } catch {}
  };

  const today = new Date().toISOString().split('T')[0];
  const upcoming = reservations.filter(r => r.date >= today);
  const past = reservations.filter(r => r.date < today);

  const formatDateDisplay = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${parseInt(d)} ${MONTHS[parseInt(m)-1]} ${y}`;
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Mis Reservas</h1>
        <p className="page-subtitle">Historial y reservas activas</p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon stat-icon--amber">🎟️</div>
          <div>
            <div className="stat-value">{upcoming.length}</div>
            <div className="stat-label">Próximas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon stat-icon--green">✅</div>
          <div>
            <div className="stat-value">{past.length}</div>
            <div className="stat-label">Pasadas</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : reservations.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🎬</div>
            <p className="empty-state-text">Aún no tienes reservas</p>
            <p className="text-sm text-muted mt-2">¡Reserva la sala de cine desde el Dashboard!</p>
          </div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="card mb-4" style={{ marginBottom: 24 }}>
              <h2 className="card-title" style={{ marginBottom: 16 }}>Próximas reservas</h2>
              <div className="res-list">
                {upcoming.map(r => (
                  <div key={r.id} className="res-card">
                    <div className="res-card-time">
                      {r.start_time}<br/>{r.end_time}
                    </div>
                    <div className="res-card-info">
                      <div className="res-card-title">{formatDateDisplay(r.date)}</div>
                      <div className="res-card-detail">Depto {r.apartment}</div>
                    </div>
                    <div className="res-card-actions">
                      <span className="badge badge-amber">Activa</span>
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(r.id)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div className="card">
              <h2 className="card-title" style={{ marginBottom: 16 }}>Reservas pasadas</h2>
              <div className="res-list">
                {past.map(r => (
                  <div key={r.id} className="res-card" style={{ opacity: 0.6 }}>
                    <div className="res-card-time">{r.start_time}<br/>{r.end_time}</div>
                    <div className="res-card-info">
                      <div className="res-card-title">{formatDateDisplay(r.date)}</div>
                      <div className="res-card-detail">Depto {r.apartment}</div>
                    </div>
                    <span className="badge badge-neutral">Finalizada</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
