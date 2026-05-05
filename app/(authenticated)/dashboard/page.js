'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  let startDay = first.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(d);
  return days;
}

export default function DashboardPage() {
  const router = useRouter();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(formatDate(today));
  const [reservations, setReservations] = useState([]);
  const [monthReservations, setMonthReservations] = useState({});
  const [loading, setLoading] = useState(false);

  const todayStr = formatDate(today);

  const fetchDayReservations = useCallback(async (date) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reservas?date=${date}`);
      const data = await res.json();
      setReservations(Array.isArray(data) ? data : []);
    } catch { setReservations([]); }
    setLoading(false);
  }, []);

  const fetchMonthReservations = useCallback(async () => {
    const startDate = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-01`;
    const lastDay = new Date(currentYear, currentMonth+1, 0).getDate();
    const endDate = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;
    try {
      const res = await fetch(`/api/reservas?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      const map = {};
      if (Array.isArray(data)) {
        data.forEach(r => { map[r.date] = (map[r.date] || 0) + 1; });
      }
      setMonthReservations(map);
    } catch { setMonthReservations({}); }
  }, [currentMonth, currentYear]);

  useEffect(() => { fetchDayReservations(selectedDate); }, [selectedDate, fetchDayReservations]);
  useEffect(() => { fetchMonthReservations(); }, [fetchMonthReservations]);

  const days = getMonthDays(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    setSelectedDate(dateStr);
  };

  const isToday = (day) => {
    if (!day) return false;
    return `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` === todayStr;
  };

  const isSelected = (day) => {
    if (!day) return false;
    return `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` === selectedDate;
  };

  const hasReservations = (day) => {
    if (!day) return false;
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return !!monthReservations[dateStr];
  };

  const isPast = (day) => {
    if (!day) return false;
    const d = new Date(currentYear, currentMonth, day);
    const t = new Date(); t.setHours(0,0,0,0);
    return d < t;
  };

  const selectedDateObj = new Date(selectedDate + 'T12:00:00');
  const displayDate = `${selectedDateObj.getDate()} de ${MONTHS[selectedDateObj.getMonth()]}`;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Disponibilidad de la sala de cine</p>
      </div>

      <div className="dashboard-grid">
        {/* Calendar */}
        <div className="card">
          <div className="calendar-nav">
            <button className="calendar-nav-btn" onClick={prevMonth}>‹</button>
            <span className="calendar-month">{MONTHS[currentMonth]} {currentYear}</span>
            <button className="calendar-nav-btn" onClick={nextMonth}>›</button>
          </div>
          <div className="calendar-grid">
            {DAYS.map(d => <div key={d} className="calendar-header-cell">{d}</div>)}
            {days.map((day, i) => (
              <button
                key={i}
                className={`calendar-cell ${!day ? 'calendar-cell--empty' : ''} ${isToday(day) ? 'calendar-cell--today' : ''} ${isSelected(day) ? 'calendar-cell--selected' : ''} ${isPast(day) ? 'calendar-cell--disabled' : ''} ${hasReservations(day) ? 'calendar-cell--has-reservations' : ''}`}
                onClick={() => day && !isPast(day) && handleDayClick(day)}
                disabled={!day || isPast(day)}
              >
                {day || ''}
              </button>
            ))}
          </div>
        </div>

        {/* Day detail */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">{displayDate}</h2>
            <button className="btn btn-primary btn-sm" onClick={() => router.push(`/reservar?date=${selectedDate}`)}>
              ➕ Reservar
            </button>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : reservations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🍿</div>
              <p className="empty-state-text">Sin reservas para este día</p>
              <p className="text-sm text-muted mt-2">¡La sala está disponible!</p>
            </div>
          ) : (
            <div className="res-list">
              {reservations.map(r => (
                <div key={r.id} className="res-card">
                  <div className="res-card-time">
                    {r.start_time}<br/>{r.end_time}
                  </div>
                  <div className="res-card-info">
                    <div className="res-card-title">
                      {r.user_name}
                    </div>
                    <div className="res-card-detail">
                      Depto {r.apartment}
                    </div>
                  </div>
                  <span className="badge badge-amber">Ocupado</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


    </>
  );
}
