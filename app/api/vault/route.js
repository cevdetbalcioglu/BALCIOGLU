// app/api/vault/route.js

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { encrypt, decrypt } from '@/lib/vault';
import { NextResponse } from 'next/server';

// GET — kullanıcının tüm vault kayıtları (şifreler çözülmüş olarak döner)
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await db.vaultItem.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isFavorite: 'desc' }, { updatedAt: 'desc' }],
  });

  // Şifreleri çöz
  const decrypted = items.map(item => ({
    ...item,
    password: decrypt(item.password, item.iv),
    iv: undefined, // client'a IV gönderme
  }));

  return NextResponse.json(decrypted);
}

// POST — yeni kayıt ekle
export async function POST(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, category, username, password, url, notes } = await req.json();
  if (!title || !password) {
    return NextResponse.json({ error: 'Başlık ve şifre zorunlu' }, { status: 400 });
  }

  const { encrypted, iv } = encrypt(password);

  const item = await db.vaultItem.create({
    data: {
      userId: session.user.id,
      title,
      category: category || 'login',
      username: username || null,
      password: encrypted,
      url: url || null,
      notes: notes || null,
      iv,
    },
  });

  return NextResponse.json({ ...item, password, iv: undefined });
}
