// app/api/vault/[id]/route.js

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/vault';
import { NextResponse } from 'next/server';

// PATCH — güncelle
export async function PATCH(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const existing = await db.vaultItem.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });

  const updateData = {
    title:      data.title      ?? existing.title,
    category:   data.category   ?? existing.category,
    username:   data.username   ?? existing.username,
    url:        data.url        ?? existing.url,
    notes:      data.notes      ?? existing.notes,
    isFavorite: data.isFavorite ?? existing.isFavorite,
  };

  // Şifre değiştiyse yeniden şifrele
  if (data.password) {
    const { encrypted, iv } = encrypt(data.password);
    updateData.password = encrypted;
    updateData.iv = iv;
  }

  const updated = await db.vaultItem.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({
    ...updated,
    password: data.password || decrypt(existing.password, existing.iv),
    iv: undefined,
  });
}

// DELETE — sil
export async function DELETE(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const item = await db.vaultItem.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!item) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });

  await db.vaultItem.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
