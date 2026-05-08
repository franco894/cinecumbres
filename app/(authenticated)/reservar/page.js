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

function PremiumCalendar({ selectedDate, onSelectDate }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Si selectedDate es provisto, inicializar en ese mes, sino usar hoy
    const d = selectedDate ? new Date(selectedDate) : new Date();
    // Ajustar para zona horaria local evitando problemas de desplazamiento
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    return new Date(year, month, 1);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1);
  maxDate.setHours(23, 59, 59, 999);

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday
  
  // Ajustar para que el Lunes sea el primer día de la semana
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const days = [];
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const isPrevDisabled = currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() <= today.getMonth();
  const isNextDisabled = currentMonth.getFullYear() === maxDate.getFullYear() && currentMonth.getMonth() >= maxDate.getMonth();

  return (
    <div className="premium-calendar">
      <div className="calendar-nav">
        <button className="calendar-nav-btn" onClick={prevMonth} disabled={isPrevDisabled} type="button">
          &#8249;
        </button>
        <div className="calendar-month">
          {monthNames[month]} {year}
        </div>
        <button className="calendar-nav-btn" onClick={nextMonth} disabled={isNextDisabled} type="button">
          &#8250;
        </button>
      </div>
      
      <div className="calendar-grid">
        {dayNames.map(day => (
          <div key={day} className="calendar-header-cell">{day}</div>
        ))}
        
        {days.map((date, idx) => {
          if (!date) return <div key={`empty-${idx}`} className="calendar-cell calendar-cell--empty"></div>;
          
          // Ajuste de zona horaria manual para crear el string YYYY-MM-DD correcto
          const offset = date.getTimezoneOffset();
          const localDate = new Date(date.getTime() - (offset * 60 * 1000));
          const dateStr = localDate.toISOString().split('T')[0];
          
          const isSelected = dateStr === selectedDate;
          const isPast = date < today;
          const isBeyondMax = date > maxDate;
          const isDisabled = isPast || isBeyondMax;
          const isToday = date.getTime() === today.getTime();
          
          return (
            <button
              key={idx}
              className={`calendar-cell ${isSelected ? 'calendar-cell--selected' : ''} ${isDisabled ? 'calendar-cell--disabled' : ''} ${isToday && !isSelected ? 'calendar-cell--today' : ''}`}
              onClick={() => !isDisabled && onSelectDate(dateStr)}
              disabled={isDisabled}
              type="button"
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReservarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const facility = searchParams.get('facility') || 'cine';
  
  const [date, setDate] = useState(() => {
    const paramDate = searchParams.get('date');
    if (paramDate) return paramDate;
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localNow = new Date(now.getTime() - (offset * 60 * 1000));
    return localNow.toISOString().split('T')[0];
  });

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
      const nextDay = new Date(date + 'T00:00:00');
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDateStr = nextDay.toISOString().split('T')[0];

      const res = await fetch(`/api/reservas?startDate=${date}&endDate=${nextDateStr}&facility=${facility}`);
      const data = await res.json();
      setReservations(Array.isArray(data) ? data : []);
    } catch { setReservations([]); }
    setLoading(false);
  }, [date, facility]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  const isHourTaken = (hour) => {
    return reservations.some(r => r.date === date && hour >= r.start_time && hour < r.end_time);
  };

  const getAvailableEndTimes = () => {
    if (!startTime) return [];
    const startIndex = HOURS.indexOf(startTime);
    if (startIndex === -1) return [];
    
    const possibleEnds = [];
    let hitBlock = false;
    
    // Mismo día
    for (let i = startIndex + 1; i <= 24; i++) {
      const endHour = i === 24 ? '24:00' : HOURS[i];
      const overlapsToday = reservations.some(r => r.date === date && startTime < r.end_time && endHour > r.start_time);
      if (overlapsToday) {
        hitBlock = true;
        break;
      }
      possibleEnds.push(endHour);
    }
    
    // Si no topamos con ninguna reserva hoy y llegamos a las 24:00, verificamos el día siguiente
    if (!hitBlock) {
      const nextDay = new Date(date + 'T00:00:00');
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDateStr = nextDay.toISOString().split('T')[0];
      
      for (let i = 1; i <= 24; i++) {
        if (possibleEnds.length >= 24) break; // Max 24h duration
        
        const endHour = i === 24 ? '24:00' : HOURS[i];
        const overlapsTomorrow = reservations.some(r => r.date === nextDateStr && '00:00' < r.end_time && endHour > r.start_time);
        
        if (overlapsTomorrow) {
          break;
        }
        possibleEnds.push(`${endHour} (Día sgte)`);
      }
    }
    
    return possibleEnds;
  };

  const availableEndTimes = getAvailableEndTimes();

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setStartTime('');
    setEndTime('');
  };

  const handleStartTimeChange = (e) => {
    setStartTime(e.target.value);
    setEndTime(''); // Reset end time when start time changes
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
    
    const actualEndTime = endTime.replace(' (Día sgte)', '');

    try {
      const res = await fetch('/api/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, startTime, endTime: actualEndTime, facility }),
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

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Nueva Reserva</h1>
        <p className="page-subtitle">Selecciona fecha y horario para tu función</p>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Calendar */}
        <div className="card glass-card">
          <div className="card-header" style={{ marginBottom: '24px' }}>
            <h2 className="card-title">1. Selecciona la Fecha</h2>
          </div>
          <PremiumCalendar selectedDate={date} onSelectDate={handleDateChange} />
        </div>

        {/* Bottom: Time Selection & Confirmation */}
        <div className="card glass-card flex-col">
          <div className="card-header" style={{ marginBottom: '24px' }}>
            <h2 className="card-title">2. Selecciona el Horario</h2>
          </div>

          <div style={{ marginBottom: '32px' }}>
            {loading ? (
              <div className="text-muted text-sm flex items-center gap-2">
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                Verificando disponibilidad...
              </div>
            ) : (
              <div className="text-muted text-sm" style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', textAlign: 'center' }}>
                Fecha seleccionada: <strong style={{ color: 'var(--text-primary)' }}>{date.split('-').reverse().join('/')}</strong>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Hora de Inicio</label>
              <div className="select-wrapper">
                <select 
                  className="form-select time-select"
                  value={startTime}
                  onChange={handleStartTimeChange}
                  disabled={loading}
                >
                  <option value="" disabled>Selecciona inicio...</option>
                  {HOURS.map(hour => {
                    const isTaken = isHourTaken(hour);
                    return (
                      <option key={`start-${hour}`} value={hour} disabled={isTaken}>
                        {hour} {isTaken ? '(Ocupado)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Hora de Término</label>
              <div className="select-wrapper">
                <select 
                  className="form-select time-select"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={!startTime || loading}
                >
                  <option value="" disabled>Selecciona término...</option>
                  {availableEndTimes.map(hour => (
                    <option key={`end-${hour}`} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="reserve-summary" style={{ marginTop: '32px' }}>
            {error && <div className="login-error">{error}</div>}
            {success && (
              <div style={{ background: 'var(--success-dim)', color: 'var(--success)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
                {success}
              </div>
            )}

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px' }}
              onClick={handleSubmit}
              disabled={!startTime || !endTime || submitting}
            >
              {submitting ? 'Reservando...' : '🎬 Confirmar Reserva'}
            </button>
            
            <p className="text-sm text-muted text-center" style={{ marginTop: '16px' }}>
              Al confirmar, la reserva aparecerá en "Mis Reservas".
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
