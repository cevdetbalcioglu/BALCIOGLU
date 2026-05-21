// app/api/portfolio/assets/route.js
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET — kullanıcının tüm varlıkları
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const assets = await db.asset.findMany({
    where: { userId: session.user.id },
    include: {
      transactions: { orderBy: { transactedAt: 'desc' } },
      notes: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { category: 'asc' },
  });

  return NextResponse.json(assets);
}

// POST — yeni varlık ekle veya varsa güncelle (alış işlemi)
export async function POST(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { symbol, name, category, quantity, pricePerUnit, spotPrice, transactedAt } = await req.json();

  if (!symbol || !name || !category || !quantity || !pricePerUnit) {
    return NextResponse.json({ error: 'Eksik alan' }, { status: 400 });
  }

  const totalAmount = quantity * pricePerUnit;
  const userId = session.user.id;

  // Varlık var mı kontrol et
  const existing = await db.asset.findUnique({ where: { userId_symbol: { userId, symbol } } });

  let asset;
  if (existing) {
    // Ortalama maliyet hesapla
    const newTotalCost = existing.avgCost * existing.quantity + totalAmount;
    const newQuantity = existing.quantity + quantity;
    const newAvgCost = newTotalCost / newQuantity;

    asset = await db.asset.update({
      where: { id: existing.id },
      data: { quantity: newQuantity, avgCost: newAvgCost },
    });
  } else {
    asset = await db.asset.create({
      data: { userId, symbol, name, category, quantity, avgCost: pricePerUnit },
    });
  }

  // İşlem kaydı oluştur
  await db.transaction.create({
    data: {
      userId,
      assetId: asset.id,
      type: 'BUY',
      quantity,
      pricePerUnit,
      totalAmount,
      spotPrice: spotPrice || null,
      transactedAt: transactedAt ? new Date(transactedAt) : new Date(),
    },
  });

  // Bakiyeden düş
  await updateBalance(userId, -totalAmount, 'BUY_DEBIT', `${symbol} alış`);

  return NextResponse.json(asset);
}

async function updateBalance(userId, delta, type, description) {
  let balance = await db.balance.findUnique({ where: { userId } });
  if (!balance) {
    balance = await db.balance.create({ data: { userId, amount: 0 } });
  }
  await db.balance.update({
    where: { userId },
    data: { amount: { increment: delta } },
  });
  await db.balanceMovement.create({
    data: { balanceId: balance.id, type, amount: Math.abs(delta), description },
  });
}
