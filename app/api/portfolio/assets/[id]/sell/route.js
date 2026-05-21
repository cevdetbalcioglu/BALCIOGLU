// app/api/portfolio/assets/[id]/sell/route.js
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { quantity, pricePerUnit, spotPrice, transactedAt } = await req.json();
  const userId = session.user.id;

  const asset = await db.asset.findFirst({
    where: { id: params.id, userId },
  });

  if (!asset) return NextResponse.json({ error: 'Varlık bulunamadı' }, { status: 404 });
  if (asset.quantity < quantity) return NextResponse.json({ error: 'Yetersiz miktar' }, { status: 400 });

  const totalAmount = quantity * pricePerUnit;
  const profit = (pricePerUnit - asset.avgCost) * quantity;
  const newQuantity = asset.quantity - quantity;

  // Varlığı güncelle
  await db.asset.update({
    where: { id: asset.id },
    data: { quantity: newQuantity },
  });

  // İşlem kaydı
  await db.transaction.create({
    data: {
      userId,
      assetId: asset.id,
      type: 'SELL',
      quantity,
      pricePerUnit,
      totalAmount,
      spotPrice: spotPrice || null,
      note: `Kâr/Zarar: ${profit >= 0 ? '+' : ''}${profit.toFixed(2)} TRY`,
      transactedAt: transactedAt ? new Date(transactedAt) : new Date(),
    },
  });

  // Bakiyeye ekle
  let balance = await db.balance.findUnique({ where: { userId } });
  if (!balance) balance = await db.balance.create({ data: { userId, amount: 0 } });

  await db.balance.update({
    where: { userId },
    data: { amount: { increment: totalAmount } },
  });
  await db.balanceMovement.create({
    data: {
      balanceId: balance.id,
      type: 'SELL_CREDIT',
      amount: totalAmount,
      description: `${asset.symbol} satış — ${profit >= 0 ? 'kâr' : 'zarar'}: ${Math.abs(profit).toFixed(2)} TRY`,
    },
  });

  return NextResponse.json({ success: true, profit, newQuantity });
}
