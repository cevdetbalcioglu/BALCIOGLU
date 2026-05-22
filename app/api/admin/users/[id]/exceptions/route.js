// app/api/admin/users/[id]/exceptions/route.js
// Kullanıcıya bireysel menü istisnası ekle/kaldır

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

async function requireAdmin() {
  const session = await auth();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return user?.role === 'ADMIN' ? session : null;
}

// POST — istisna ekle veya toggle et
export async function POST(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

  const { menuItemId, type } = await req.json(); // type: 'GRANT' | 'REVOKE'

  const existing = await db.userMenuException.findUnique({
    where: { userId_menuItemId: { userId: params.id, menuItemId } },
  });

  if (existing) {
    // Aynı tip — kaldır (toggle)
    if (existing.type === type) {
      await db.userMenuException.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: 'removed' });
    }
    // Farklı tip — güncelle
    const updated = await db.userMenuException.update({
      where: { id: existing.id },
      data: { type },
    });
    return NextResponse.json({ action: 'updated', data: updated });
  }

  const created = await db.userMenuException.create({
    data: { userId: params.id, menuItemId, type },
  });
  return NextResponse.json({ action: 'created', data: created });
}

// DELETE — tüm istisnaları temizle
export async function DELETE(req, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });

  await db.userMenuException.deleteMany({ where: { userId: params.id } });
  return NextResponse.json({ success: true });
}
