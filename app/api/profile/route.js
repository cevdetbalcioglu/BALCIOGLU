// app/api/profile/route.js
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// GET — mevcut kullanıcı bilgileri
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, createdAt: true, password: true },
  });

  return NextResponse.json({ ...user, hasPassword: !!user.password, password: undefined });
}

// PATCH — profil güncelle
export async function PATCH(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, email, currentPassword, newPassword } = await req.json();

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

  const updateData = {};

  // İsim güncelle
  if (name?.trim()) updateData.name = name.trim();

  // E-posta güncelle — başkası kullanıyor mu kontrol et
  if (email?.trim() && email !== user.email) {
    const exists = await db.user.findUnique({ where: { email: email.trim() } });
    if (exists) return NextResponse.json({ error: 'Bu e-posta zaten kullanımda' }, { status: 400 });
    updateData.email = email.trim();
  }

  // Şifre güncelle
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Mevcut şifrenizi girin' }, { status: 400 });
    }
    if (!user.password) {
      return NextResponse.json({ error: 'OAuth ile giriş yapılan hesaplarda şifre değiştirilemez' }, { status: 400 });
    }
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: 'Mevcut şifre yanlış' }, { status: 400 });
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Yeni şifre en az 8 karakter olmalı' }, { status: 400 });
    }
    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Değiştirilecek alan yok' }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, name: true, email: true, image: true },
  });

  return NextResponse.json(updated);
}