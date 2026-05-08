import { auth } from '@/lib/auth';
import { getAllUsers, createUser, deleteUser, updateUser } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return Response.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const users = await getAllUsers();
    return Response.json(users);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return Response.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, password, name, apartment, role } = body;

    if (!email || !password || !name || !apartment) {
      return Response.json(
        { error: 'Email, contraseña, nombre y departamento son obligatorios' },
        { status: 400 }
      );
    }

    const user = await createUser(email, password, name, apartment, role || 'resident');
    return Response.json(user, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 409 });
  }
}

export async function PUT(request) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return Response.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return Response.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    await updateUser(Number(id), data);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    return Response.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }

    // Don't allow deleting yourself
    if (Number(id) === Number(session.user.id)) {
      return Response.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
    }

    await deleteUser(Number(id));
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
