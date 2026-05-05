'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

export default function ReservarPage() {
  return (
    <Suspense fallback={<div className="loading-center"><div className="spinner" /></div>}>
      <ReservarContent />
    </Suspense>
  );
}

function ReservarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reservas?date=${date}`);
      const data = await res.json();
      setReservations(Array.isArray(data) ? data : []);
    } catch { setReservations([]); }
    setLoading(false);
  }, [date]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  const isHourTaken = (hour) => {
    return reservations.some(r => hour >= r.start_time && hour < r.end_time);
  };

  const isInRange = (hour) => {
    if (!startTime || !endTime) return false;
    return hour >= startTime && hour < endTime;
  };

  const handleHourClick = (hour) => {
    if (isHourTaken(hour)) return;

    if (!startTime || (startTime && endTime)) {
      setStartTime(hour);
      setEndTime('');
    } else {
      if (hour <= startTime) {
        setStartTime(hour);
      } else {
        const blocked = HOURS.some(h => h > startTime && h < hour && isHourTaken(h));
        if (blocked) {
          setStartTime(hour);
          setEndTime('');
        } else {
          const idx = HOURS.indexOf(hour);
          setEndTime(idx < 23 ? HOURS[idx + 1] : '24:00');
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) {
      setError('Selecciona fecha y horario');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, startTime, endTime }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear la reserva');
      } else {
        setSuccess('¡Reserva creada exitosamente!');
        setStartTime('');
        setEndTime('');
        fetchReservations();
        setTimeout(() => router.push('/mis-reservas'), 1500);
      }
    } catch {
      setError('Error de conexión');
    }
    setSubmitting(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Nueva Reserva</h1>
        <p className="page-subtitle">Selecciona fecha y horario</p>
      </div>

      {/* Selection summary bar - sticky on mobile */}
      <div className="reserve-summary-bar">
        <div className="reserve-summary-fields">
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 130 }}>
            <label className="form-label">Fecha</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => { setDate(e.target.value); setStartTime(''); setEndTime(''); }}
              min={today}
              max={maxDateStr}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 70 }}>
            <label className="form-label">Inicio</label>
            <div className="reserve-time-display">{startTime || '—'}</div>
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 70 }}>
            <label className="form-label">Fin</label>
            <div className="reserve-time-display">{endTime || '—'}</div>
          </div>
        </div>

        {error && <div className="login-error" style={{ marginTop: 12 }}>{error}</div>}
        {success && (
          <div style={{ background: 'var(--success-dim)', color: 'var(--success)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 13, marginTop: 12 }}>
            {success}
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
          onClick={handleSubmit}
          disabled={!startTime || !endTime || submitting}
        >
          {submitting ? 'Reservando...' : '🎬 Confirmar Reserva'}
        </button>
      </div>

      {/* Time slots grid */}
      <div className="card">
        <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
          Toca la hora de inicio y luego la hora de fin
        </p>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="timeslots">
            {HOURS.map(hour => {
              const taken = isHourTaken(hour);
              const selected = hour === startTime;
              const inRange = isInRange(hour);
              return (
                <button
                  key={hour}
                  className={`timeslot ${taken ? 'timeslot--taken' : ''} ${selected ? 'timeslot--selected' : ''} ${inRange ? 'timeslot--in-range' : ''}`}
                  onClick={() => handleHourClick(hour)}
                  disabled={taken}
                >
                  {hour}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
