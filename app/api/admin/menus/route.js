// app/api/admin/menus/route.js
// Menü listesi + rol izinleri yönetimi

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

async function requireAdmin() {
  const session = await auth();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return user?.role === 'ADMIN' ? session : null;
}

// GET — tüm menüler + hangi role'e atanmış
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

  const menus = await db.menuItem.findMany({
    orderBy: { order: 'asc' },
    include: { rolePermissions: true },
  });

  return NextResponse.json(menus);
}

// POST — yeni menü ekle
export async function POST(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

  const { label, href, icon, parentId, order } = await req.json();
  if (!label || !href) return NextResponse.json({ error: 'Label ve href zorunlu' }, { status: 400 });

  const item = await db.menuItem.create({
    data: { label, href, icon: icon || null, parentId: parentId || null, order: order || 0 },
  });

  return NextResponse.json(item);
}
