// app/api/admin/menus/[id]/route.js

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

async function requireAdmin() {
  const session = await auth();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return user?.role === 'ADMIN' ? session : null;
}

// PATCH — menü güncelle veya rol iznini toggle et
export async function PATCH(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

  const data = await req.json();

  // Rol izni toggle: { toggleRole: 'USER' | 'ADMIN' }
  if (data.toggleRole) {
    const existing = await db.roleMenuPermission.findUnique({
      where: { role_menuItemId: { role: data.toggleRole, menuItemId: params.id } },
    });
    if (existing) {
      await db.roleMenuPermission.delete({ where: { id: existing.id } });
      return NextResponse.json({ granted: false });
    } else {
      await db.roleMenuPermission.create({ data: { role: data.toggleRole, menuItemId: params.id } });
      return NextResponse.json({ granted: true });
    }
  }

  // Menü güncelle
  const updated = await db.menuItem.update({
    where: { id: params.id },
    data: {
      label:    data.label    ?? undefined,
      href:     data.href     ?? undefined,
      icon:     data.icon     ?? undefined,
      order:    data.order    ?? undefined,
      isActive: data.isActive ?? undefined,
    },
  });
  return NextResponse.json(updated);
}

// DELETE — menüyü sil
export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

  await db.menuItem.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
