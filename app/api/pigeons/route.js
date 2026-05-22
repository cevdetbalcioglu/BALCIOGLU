// app/api/pigeons/route.js

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pigeons = await db.pigeon.findMany({
    where: { userId: session.user.id },
    orderBy: { ringId: 'asc' },
    include: {
      hatchedIn: {
        include: {
          clutch: {
            include: {
              team: true,
              father: true,
              mother: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(pigeons);
}

export async function POST(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ringId, ringLabel, gender, performance, health, notes } = await req.json();
  if (!ringId || !ringLabel) return NextResponse.json({ error: 'Ring ID ve etiket zorunlu' }, { status: 400 });

  const pigeon = await db.pigeon.create({
    data: {
      userId: session.user.id,
      ringId: ringId.trim().toUpperCase(),
      ringLabel: ringLabel.trim(),
      gender: gender || null,
      performance: performance || null,
      health: health || null,
      notes: notes || null,
    },
  });

  return NextResponse.json(pigeon);
}
