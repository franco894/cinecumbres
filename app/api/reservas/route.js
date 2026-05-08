import { auth } from '@/lib/auth';
import {
  getReservationsByDate,
  getReservationsByDateRange,
  getReservationsByUser,
  createReservation,
  cancelReservation,
} from '@/lib/db';

export async function GET(request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const myReservations = searchParams.get('mine');
  const facility = searchParams.get('facility') || 'cine';

  try {
    let reservations;

    if (myReservations === 'true') {
      reservations = await getReservationsByUser(Number(session.user.id));
    } else if (startDate && endDate) {
      reservations = await getReservationsByDateRange(startDate, endDate, facility);
    } else if (date) {
      reservations = await getReservationsByDate(date, facility);
    } else {
      // Default: today's reservations
      const today = new Date().toISOString().split('T')[0];
      reservations = await getReservationsByDate(today, facility);
    }

    return Response.json(reservations);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { date, startTime, endTime, title, notes, facility = 'cine' } = body;

    if (!date || !startTime || !endTime) {
      return Response.json(
        { error: 'Fecha, hora de inicio y hora de fin son obligatorios' },
        { status: 400 }
      );
    }

    // Validate date is not more than 1 month in the future
    const reservationDate = new Date(date + 'T00:00:00');
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 1);
    if (reservationDate > maxDate) {
      return Response.json(
        { error: 'No puedes reservar con más de 1 mes de anticipación' },
        { status: 400 }
      );
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (reservationDate < today) {
      return Response.json(
        { error: 'No puedes reservar en una fecha pasada' },
        { status: 400 }
      );
    }

    // Validate max 24h duration or overnight
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    
    if (startMinutes === endMinutes) {
      return Response.json(
        { error: 'La hora de fin no puede ser igual a la hora de inicio' },
        { status: 400 }
      );
    }

    let reservation;
    if (endMinutes < startMinutes) {
      // Overnight reservation: split into two records
      const nextDay = new Date(reservationDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDateStr = nextDay.toISOString().split('T')[0];

      // Insert first part (startTime to 24:00)
      await createReservation(
        Number(session.user.id),
        facility,
        date,
        startTime,
        '24:00',
        title || '',
        notes || ''
      );

      // Insert second part (00:00 to endTime)
      reservation = await createReservation(
        Number(session.user.id),
        facility,
        nextDateStr,
        '00:00',
        endTime,
        title || '',
        notes || ''
      );
    } else {
      reservation = await createReservation(
        Number(session.user.id),
        facility,
        date,
        startTime,
        endTime,
        title || '',
        notes || ''
      );
    }

    return Response.json(reservation || { success: true }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 409 });
  }
}

export async function DELETE(request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID de reserva requerido' }, { status: 400 });
    }

    await cancelReservation(
      Number(id),
      Number(session.user.id),
      session.user.role === 'admin'
    );

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 403 });
  }
}
