'use client';
import { useState, useEffect } from 'react';

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export default function AdminReservasPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const start = now.toISOString().split('T')[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0).toISOString().split('T')[0];
      const res = await fetch(`/api/reservas?startDate=${start}&endDate=${end}`);
      const data = await res.json();
      setReservations(Array.isArray(data) ? data : []);
    } catch { setReservations([]); }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('¿Cancelar esta reserva?')) return;
    try {
      const res = await fetch(`/api/reservas?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchAll();
    } catch {}
  };

  const formatDateDisplay = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    return `${parseInt(d)} ${MONTHS[parseInt(m)-1]} ${y}`;
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Todas las Reservas</h1>
        <p className="page-subtitle">Vista de administrador — próximas reservas activas</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon stat-icon--amber">📋</div>
          <div>
            <div className="stat-value">{reservations.length}</div>
            <div className="stat-label">Reservas activas</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : reservations.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-text">No hay reservas activas</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Residente</th>
                  <th>Depto</th>
                  <th style={{ width: 100 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{formatDateDisplay(r.date)}</td>
                    <td>{r.start_time} — {r.end_time}</td>
                    <td>{r.user_name}</td>
                    <td><span className="badge badge-amber">{r.apartment}</span></td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancel(r.id)}>
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
