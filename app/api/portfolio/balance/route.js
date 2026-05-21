// app/api/portfolio/balance/route.js
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET — güncel bakiye ve hareketler
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const balance = await db.balance.findUnique({
    where: { userId: session.user.id },
    include: {
      movements: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  });

  return NextResponse.json(balance || { amount: 0, movements: [] });
}

// POST — bakiye yükle veya çek
export async function POST(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { amount, type, description } = await req.json();
  // type: 'DEPOSIT' | 'WITHDRAW'

  if (!amount || amount <= 0) return NextResponse.json({ error: 'Geçersiz tutar' }, { status: 400 });

  const userId = session.user.id;
  const delta = type === 'WITHDRAW' ? -amount : amount;

  let balance = await db.balance.findUnique({ where: { userId } });
  if (!balance) balance = await db.balance.create({ data: { userId, amount: 0 } });

  if (type === 'WITHDRAW' && balance.amount < amount) {
    return NextResponse.json({ error: 'Yetersiz bakiye' }, { status: 400 });
  }

  const updated = await db.balance.update({
    where: { userId },
    data: { amount: { increment: delta } },
  });

  await db.balanceMovement.create({
    data: {
      balanceId: balance.id,
      type,
      amount,
      description: description || (type === 'DEPOSIT' ? 'TL yükleme' : 'TL çekme'),
    },
  });

  return NextResponse.json(updated);
}
