// app/api/pigeons/clutches/route.js

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { teamId, round, eggDate, hatchDate, fatherId, motherId, chicks, notes } = await req.json();
  if (!teamId || !round) return NextResponse.json({ error: 'Takım ve tur zorunlu' }, { status: 400 });

  // Takım bu kullanıcıya mı ait
  const team = await db.pigeonTeam.findFirst({ where: { id: teamId, userId: session.user.id } });
  if (!team) return NextResponse.json({ error: 'Takım bulunamadı' }, { status: 404 });

  const clutch = await db.clutch.create({
    data: {
      userId:    session.user.id,
      teamId,
      round:     parseInt(round),
      eggDate:   eggDate   ? new Date(eggDate)   : null,
      hatchDate: hatchDate ? new Date(hatchDate) : null,
      fatherId:  fatherId  || null,
      motherId:  motherId  || null,
      notes:     notes     || null,
      eggs: {
        create: (chicks || []).map(pigeonId => ({ pigeonId: pigeonId || null })),
      },
    },
    include: { eggs: { include: { pigeon: true } } },
  });

  return NextResponse.json(clutch);
}
