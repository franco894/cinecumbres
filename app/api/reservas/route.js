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

  try {
    let reservations;

    if (myReservations === 'true') {
      reservations = getReservationsByUser(Number(session.user.id));
    } else if (startDate && endDate) {
      reservations = getReservationsByDateRange(startDate, endDate);
    } else if (date) {
      reservations = getReservationsByDate(date);
    } else {
      // Default: today's reservations
      const today = new Date().toISOString().split('T')[0];
      reservations = getReservationsByDate(today);
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
    const { date, startTime, endTime, title, notes } = body;

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

    // Validate max 24h duration
    const start = startTime.split(':').map(Number);
    const end = endTime.split(':').map(Number);
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    if (endMinutes <= startMinutes) {
      return Response.json(
        { error: 'La hora de fin debe ser posterior a la hora de inicio' },
        { status: 400 }
      );
    }

    const reservation = createReservation(
      Number(session.user.id),
      date,
      startTime,
      endTime,
      title || '',
      notes || ''
    );

    return Response.json(reservation, { status: 201 });
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

    cancelReservation(
      Number(id),
      Number(session.user.id),
      session.user.role === 'admin'
    );

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 403 });
  }
}
