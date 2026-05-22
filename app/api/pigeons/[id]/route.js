// app/api/pigeons/[id]/route.js

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const pigeon = await db.pigeon.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!pigeon) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });

  const updated = await db.pigeon.update({
    where: { id: params.id },
    data: {
      ringLabel:   data.ringLabel   ?? undefined,
      gender:      data.gender      ?? undefined,
      performance: data.performance ?? undefined,
      health:      data.health      ?? undefined,
      notes:       data.notes       ?? undefined,
      isActive:    data.isActive    ?? undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.pigeon.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return NextResponse.json({ success: true });
}
