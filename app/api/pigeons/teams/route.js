// app/api/pigeons/teams/route.js

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const teams = await db.pigeonTeam.findMany({
    where: { userId: session.user.id },
    orderBy: { teamNo: 'asc' },
    include: {
      clutches: {
        orderBy: { round: 'asc' },
        include: {
          eggs: { include: { pigeon: true } },
          father: true,
          mother: true,
        },
      },
    },
  });

  return NextResponse.json(teams);
}

export async function POST(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { teamNo, season, motherLabel, fatherLabel, ringColor, notes } = await req.json();
  if (!teamNo) return NextResponse.json({ error: 'Takım no zorunlu' }, { status: 400 });

  const team = await db.pigeonTeam.create({
    data: {
      userId: session.user.id,
      teamNo: parseInt(teamNo),
      season: season || null,
      motherLabel: motherLabel || null,
      fatherLabel: fatherLabel || null,
      ringColor: ringColor || null,
      notes: notes || null,
    },
  });

  return NextResponse.json(team);
}
