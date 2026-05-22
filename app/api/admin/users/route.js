// app/api/admin/users/route.js

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

async function requireAdmin() {
  const session = await auth();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return user?.role === 'ADMIN' ? session : null;
}

// GET — tüm kullanıcılar + rolleri + istisnaları
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

  const users = await db.user.findMany({
    select: {
      id: true, name: true, email: true, role: true, createdAt: true,
      menuExceptions: { include: { menuItem: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(users);
}

// PATCH — kullanıcı rolünü değiştir
export async function PATCH(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

  const { userId, role } = await req.json();
  if (!userId || !role) return NextResponse.json({ error: 'Eksik alan' }, { status: 400 });

  const updated = await db.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(updated);
}
